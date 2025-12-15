#define _GNU_SOURCE
#include "ipc.h"
#include "ipc_websocket.h"
#include "base64.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <sys/time.h>
#include <pthread.h>

#include "network.h"
#include "../common/config.h"
#include "../common/protocol.h"

extern void log_message(const char* level, const char* format, ...);

// IPC state
static int g_ipc_listen_fd = -1;
static NetworkState* g_net = NULL;

typedef struct {
    int fd;
    int in_use;
} IpcClient;

static IpcClient g_clients[IPC_MAX_CLIENTS];
static pthread_mutex_t g_clients_mtx = PTHREAD_MUTEX_INITIALIZER;
static volatile int g_ipc_running = 1;

// Helpers
static void add_client(int fd) {
    pthread_mutex_lock(&g_clients_mtx);
    for (int i = 0; i < IPC_MAX_CLIENTS; ++i) {
        if (!g_clients[i].in_use) {
            g_clients[i].in_use = 1;
            g_clients[i].fd = fd;
            break;
        }
    }
    pthread_mutex_unlock(&g_clients_mtx);
}

static void remove_client(int fd) {
    pthread_mutex_lock(&g_clients_mtx);
    for (int i = 0; i < IPC_MAX_CLIENTS; ++i) {
        if (g_clients[i].in_use && g_clients[i].fd == fd) {
            g_clients[i].in_use = 0;
            g_clients[i].fd = -1;
            break;
        }
    }
    pthread_mutex_unlock(&g_clients_mtx);
}

void ipc_broadcast_event(const char* event, const char* data_json) {
    char buf[4096];
    int len = 0;
    if (data_json && data_json[0]) {
        len = snprintf(buf, sizeof(buf), "{\"event\":\"%s\",\"data\":%s}", event, data_json);
    } else {
        len = snprintf(buf, sizeof(buf), "{\"event\":\"%s\"}", event);
    }
    if (len <= 0) return;

    pthread_mutex_lock(&g_clients_mtx);
    for (int i = 0; i < IPC_MAX_CLIENTS; ++i) {
        if (!g_clients[i].in_use) continue;
        if (websocket_send_text(g_clients[i].fd, buf, len) < 0) {
            log_message("WARN", "IPC send failed, closing client fd=%d", g_clients[i].fd);
            close(g_clients[i].fd);
            g_clients[i].in_use = 0;
        }
    }
    pthread_mutex_unlock(&g_clients_mtx);
}

// Very small JSON string extractor for {"key":"value"}
static int json_get_string(const char* json, const char* key, char* out, size_t outlen) {
    const char* pos = strstr(json, key);
    if (!pos) return 0;
    pos = strchr(pos, ':');
    if (!pos) return 0;
    pos = strchr(pos, '"');
    if (!pos) return 0;
    pos++;
    const char* end = strchr(pos, '"');
    if (!end) return 0;
    size_t len = (size_t)(end - pos);
    if (len >= outlen) len = outlen - 1;
    memcpy(out, pos, len);
    out[len] = '\0';
    return 1;
}

static void handle_ipc_command(int fd, const char* payload, int len) {
    (void)fd;   // Unused but needed for function signature
    (void)len;  // Unused but needed for function signature
    if (!g_net || !g_net->is_connected) {
        ipc_broadcast_event("error", "\"server_not_connected\"");
        return;
    }
    char type[64] = {0};
    if (!json_get_string(payload, "\"type\"", type, sizeof(type))) {
        ipc_broadcast_event("error", "\"missing_type\"");
        return;
    }

    if (strcmp(type, "login") == 0) {
        char user[64] = {0}, pass[64] = {0};
        json_get_string(payload, "\"username\"", user, sizeof(user));
        json_get_string(payload, "\"password\"", pass, sizeof(pass));
        if (send_login(g_net, user, pass) < 0) ipc_broadcast_event("error", "\"login_send_failed\"");
        return;
    }
    if (strcmp(type, "register") == 0 || strcmp(type, "signup") == 0) {
        char user[64] = {0}, pass[64] = {0};
        json_get_string(payload, "\"username\"", user, sizeof(user));
        json_get_string(payload, "\"password\"", pass, sizeof(pass));
        if (send_register(g_net, user, pass) < 0) ipc_broadcast_event("error", "\"register_send_failed\"");
        return;
    }
    if (strcmp(type, "start_session") == 0) {
        if (send_start_session(g_net) < 0) ipc_broadcast_event("error", "\"start_session_failed\"");
        else ipc_broadcast_event("session_started", "\"ok\"");
        return;
    }
    if (strcmp(type, "end_session") == 0) {
        if (send_end_session(g_net) < 0) ipc_broadcast_event("error", "\"end_session_failed\"");
        return;
    }
    if (strcmp(type, "get_leaderboard") == 0) {
        if (send_get_leaderboard(g_net) < 0) ipc_broadcast_event("error", "\"leaderboard_failed\"");
        return;
    }
    if (strcmp(type, "get_profile") == 0) {
        if (send_get_profile(g_net) < 0) ipc_broadcast_event("error", "\"profile_failed\"");
        return;
    }
    if (strcmp(type, "stream_frame") == 0) {
        char b64[4096] = {0};
        if (!json_get_string(payload, "\"data\"", b64, sizeof(b64))) {
            ipc_broadcast_event("error", "\"missing_data\"");
            return;
        }
        size_t b64len = strlen(b64);
        size_t need = base64_decoded_size(b64, b64len);
        unsigned char* bin = (unsigned char*)malloc(need + 1);
        if (!bin) { ipc_broadcast_event("error", "\"oom\""); return; }
        int outlen = base64_decode(b64, b64len, bin, need);
        if (outlen < 0) { free(bin); ipc_broadcast_event("error", "\"bad_base64\""); return; }
        if (send_stream_frame_bytes(g_net, bin, outlen) < 0) {
            ipc_broadcast_event("error", "\"stream_send_failed\"");
        }
        free(bin);
        return;
    }
    ipc_broadcast_event("error", "\"unknown_type\"");
}

static void* ipc_client_thread(void* arg) {
    int fd = *(int*)arg;
    free(arg);
    add_client(fd);
    log_message("INFO", "IPC client connected fd=%d", fd);
    fprintf(stderr, "[IPC] client_thread ready to recv frames on fd=%d\n", fd);
    
    // Send welcome message immediately after handshake
    const char* welcome = "{\"event\":\"connected\",\"data\":\"ready\"}";
    fprintf(stderr, "[IPC] sending welcome message to fd=%d\n", fd);
    if (websocket_send_text(fd, welcome, strlen(welcome)) < 0) {
        fprintf(stderr, "[IPC] ERROR: failed to send welcome\n");
        close(fd);
        remove_client(fd);
        return NULL;
    }
    fprintf(stderr, "[IPC] ===== WELCOME SENT, NOW WAITING FOR BROWSER MESSAGES =====\n");

    // Set a reasonable timeout to avoid hanging indefinitely
    struct timeval tv;
    tv.tv_sec = 60;  // 60 second timeout
    tv.tv_usec = 0;
    if (setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv)) < 0) {
        log_message("WARN", "Failed to set socket timeout on fd=%d", fd);
    }

    for (;;) {
        fprintf(stderr, "[IPC] calling recv_frame on fd=%d\n", fd);
        char* payload = NULL;
        uint8_t opcode = 0;
        int len = websocket_recv_frame(fd, &payload, &opcode);
        fprintf(stderr, "[IPC] recv_frame returned %d on fd=%d\n", len, fd);
        if (len < 0) {
            log_message("DEBUG", "IPC recv_frame failed fd=%d", fd);
            fprintf(stderr, "[IPC] recv_frame error, breaking\n");
            break;
        }
        log_message("DEBUG", "IPC recv_frame fd=%d opcode=0x%x len=%d", fd, opcode, len);
        if (opcode == 0x8) { free(payload); break; } // close
        if (opcode == 0x9) { websocket_send_pong(fd, payload, len); free(payload); continue; } // ping
        if (opcode == 0x1 && payload) {
            log_message("DEBUG", "IPC text message fd=%d: %.100s", fd, payload);
            handle_ipc_command(fd, payload, len);
        }
        free(payload);
    }

    close(fd);
    remove_client(fd);
    log_message("INFO", "IPC client disconnected fd=%d", fd);
    return NULL;
}

static void* ipc_accept_thread(void* arg) {
    (void)arg;
    struct sockaddr_in addr; socklen_t addrlen = sizeof(addr);
    while (g_ipc_running) {
        int cfd = accept(g_ipc_listen_fd, (struct sockaddr*)&addr, &addrlen);
        if (cfd < 0) continue;
        // Ensure socket is blocking mode
        int flags = fcntl(cfd, F_GETFL, 0);
        if (flags >= 0) fcntl(cfd, F_SETFL, flags & ~O_NONBLOCK);
        log_message("INFO", "IPC accept fd=%d, doing handshake...", cfd);
        if (websocket_handshake(cfd) != 0) {
            log_message("WARN", "IPC handshake failed fd=%d, closing", cfd);
            close(cfd);
            continue;
        }
        log_message("INFO", "IPC handshake OK fd=%d", cfd);
        int* pfd = (int*)malloc(sizeof(int));
        if (!pfd) { close(cfd); continue; }
        *pfd = cfd;
        pthread_t th;
        pthread_create(&th, NULL, ipc_client_thread, pfd);
        pthread_detach(th);
    }
    return NULL;
}

int ipc_start(NetworkState* net) {
    g_net = net;
    g_ipc_listen_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (g_ipc_listen_fd < 0) {
        log_message("ERROR", "IPC socket create failed");
        return -1;
    }
    // Ensure listen socket is blocking
    int flags = fcntl(g_ipc_listen_fd, F_GETFL, 0);
    if (flags >= 0) fcntl(g_ipc_listen_fd, F_SETFL, flags & ~O_NONBLOCK);
    int opt = 1; setsockopt(g_ipc_listen_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    struct sockaddr_in addr; memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    // Bind to all interfaces (0.0.0.0) so Windows -> WSL localhost relay works
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    addr.sin_port = htons(IPC_PORT);
    if (bind(g_ipc_listen_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        log_message("ERROR", "IPC bind failed");
        close(g_ipc_listen_fd);
        return -1;
    }
    if (listen(g_ipc_listen_fd, 8) < 0) {
        log_message("ERROR", "IPC listen failed");
        close(g_ipc_listen_fd);
        return -1;
    }
    pthread_t th;
    if (pthread_create(&th, NULL, ipc_accept_thread, NULL) != 0) {
        log_message("ERROR", "IPC thread create failed");
        close(g_ipc_listen_fd);
        return -1;
    }
    pthread_detach(th);
    log_message("INFO", "IPC WebSocket listening on 0.0.0.0:%d", IPC_PORT);
    
    // Note: We do NOT start a separate network_recv_thread here
    // The main.c receiver_thread already calls ipc_broadcast_event()
    // to forward server responses to WebSocket clients
    
    return 0;
}

void ipc_stop() {
    g_ipc_running = 0;
    if (g_ipc_listen_fd >= 0) close(g_ipc_listen_fd);
    pthread_mutex_lock(&g_clients_mtx);
    for (int i = 0; i < IPC_MAX_CLIENTS; ++i) {
        if (g_clients[i].in_use) {
            websocket_send_close(g_clients[i].fd);
            close(g_clients[i].fd);
            g_clients[i].in_use = 0;
        }
    }
    pthread_mutex_unlock(&g_clients_mtx);
}
