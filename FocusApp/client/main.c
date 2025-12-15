/*
 * Mục đích: Ứng dụng Client dạng console (không dùng Webview) để demo giao thức.
 *  - Hiển thị menu thao tác: login/register, start/end session, gửi frame, lấy leaderboard/profile.
 *  - Tạo 1 thread nền (receiver_thread) để nhận thông điệp đẩy từ server (warning, coins update,...).
 *
 * Thành phần chính:
 * - receiver_thread(): Vòng lặp blocking nhận packet và in log/console theo type.
 * - print_menu(), read_line(), load_file(): Tiện ích UI/IO nhỏ trong console.
 * - main(): Khởi tạo mạng, kết nối server, chạy vòng lặp menu.
 */
// Console-based client (no Webview)
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <pthread.h>
#include <time.h>
#include <errno.h>

#include "network.h"
#include "../common/protocol.h"
#include "../common/config.h"
#include "base64.h"
#include "ipc.h"

extern void log_message(const char* level, const char* format, ...);

static NetworkState g_network = {0};
static volatile int g_running = 1;

// Bộ nhớ đệm phản hồi đồng bộ từ server
typedef struct {
    int type;
    int length;
    char data[2048];
    int ready; // 1 khi có phản hồi mới
    pthread_mutex_t mtx;
    pthread_cond_t cv;
} ResponseCache;

static ResponseCache g_resp = {0};

static void print_menu() {
    printf("\n=== FocusApp Client (Console) ===\n");
    printf("1) Login\n");
    printf("2) Register\n");
    printf("3) Start Session\n");
    printf("4) Send Frame (from file)\n");
    printf("5) End Session\n");
    printf("6) Get Leaderboard\n");
    printf("7) Get Profile\n");
    printf("0) Quit\n> ");
    fflush(stdout);
}

static int read_line(char* buf, size_t sz) {
    if (!fgets(buf, (int)sz, stdin)) return 0;
    size_t n = strlen(buf);
    if (n && (buf[n-1] == '\n' || buf[n-1] == '\r')) buf[--n] = '\0';
    if (n && (buf[n-1] == '\r')) buf[--n] = '\0';
    return 1;
}

static int load_file(const char* path, unsigned char** out_buf, size_t* out_len) {
    FILE* f = fopen(path, "rb");
    if (!f) return -1;
    fseek(f, 0, SEEK_END);
    long len = ftell(f);
    fseek(f, 0, SEEK_SET);
    if (len <= 0) { fclose(f); return -1; }
    unsigned char* buf = (unsigned char*)malloc((size_t)len);
    if (!buf) { fclose(f); return -1; }
    size_t rd = fread(buf, 1, (size_t)len, f);
    fclose(f);
    if (rd != (size_t)len) { free(buf); return -1; }
    *out_buf = buf; *out_len = (size_t)len; return 0;
}

static void* receiver_thread(void* arg) {
    (void)arg;
    log_message("INFO", "\nReceiver thread started");
    while (g_running && g_network.is_connected) {
        PacketHeader* packet = NULL;
        int res = network_receive_packet(&g_network, &packet);
        if (res < 0) {
            log_message("ERROR", "Receive failed; stopping receiver thread");
            break;
        }
        if (!packet) continue;

        char* payload = (char*)packet + HEADER_SIZE;
        if (packet->length < MAX_PAYLOAD_SIZE) payload[packet->length] = '\0';

        switch (packet->type) {
            case MSG_FOCUS_WARN:
                printf("\n[SERVER] Focus warning! Please stay attentive.\n");
                ipc_broadcast_event("focus_warn", NULL);
                fflush(stdout);
                break;
            case MSG_FOCUS_UPDATE:
                printf("[SERVER] Focus score: %s\n", payload);
                ipc_broadcast_event("focus_update", payload);
                break;
            case MSG_UPDATE_COINS:
                printf("[SERVER] Coins update: %s\n", payload);
                ipc_broadcast_event("session_result", payload);
                break;
            case MSG_ERROR: {
                printf("[SERVER] Error: %s\n", payload);
                char errbuf[512];
                snprintf(errbuf, sizeof(errbuf), "{\"message\":\"%s\"}", payload);
                ipc_broadcast_event("error", errbuf);
                break;
            }
            case MSG_LOGIN_RES:
            case MSG_REGISTER_RES:
            case MSG_RES_LEADERBOARD:
            case MSG_RES_PROFILE: {
                // Lưu phản hồi vào cache và báo thức cho thread chính
                pthread_mutex_lock(&g_resp.mtx);
                g_resp.type = packet->type;
                g_resp.length = packet->length;
                size_t copy_len = (size_t)packet->length;
                if (copy_len >= sizeof(g_resp.data)) copy_len = sizeof(g_resp.data)-1;
                memcpy(g_resp.data, payload, copy_len);
                g_resp.data[copy_len] = '\0';
                g_resp.ready = 1;
                pthread_cond_signal(&g_resp.cv);
                pthread_mutex_unlock(&g_resp.mtx);

                if (packet->type == MSG_LOGIN_RES) {
                    if (strcmp(payload, RESPONSE_OK) == 0) ipc_broadcast_event("login_ok", "\"ok\"");
                    else {
                        char errbuf[256]; snprintf(errbuf, sizeof(errbuf), "{\"message\":\"%s\"}", payload);
                        ipc_broadcast_event("error", errbuf);
                    }
                } else if (packet->type == MSG_REGISTER_RES) {
                    if (strcmp(payload, RESPONSE_OK) == 0) ipc_broadcast_event("register_ok", "\"ok\"");
                    else {
                        char errbuf[256]; snprintf(errbuf, sizeof(errbuf), "{\"message\":\"%s\"}", payload);
                        ipc_broadcast_event("error", errbuf);
                    }
                } else if (packet->type == MSG_RES_LEADERBOARD) {
                    ipc_broadcast_event("leaderboard", payload);
                } else if (packet->type == MSG_RES_PROFILE) {
                    ipc_broadcast_event("profile", payload);
                }
                break;
            }
            default:
                printf("[SERVER] Unhandled message type: %d (%d bytes)\n", packet->type, packet->length);
                break;
        }
        free(packet);
    }
    log_message("INFO", "Receiver thread stopped");
    return NULL;
}

int main() {
    log_message("INFO", "=== FocusApp Client (Console) ===");

    // Khởi tạo cache phản hồi
    pthread_mutex_init(&g_resp.mtx, NULL);
    pthread_cond_init(&g_resp.cv, NULL);

    if (network_init(&g_network) != 0) {
        log_message("ERROR", "Network init failed");
        return 1;
    }
    if (network_connect(&g_network, SERVER_HOST, SERVER_PORT) != 0) {
        log_message("ERROR", "Connect to %s:%d failed", SERVER_HOST, SERVER_PORT);
        network_close(&g_network);
        return 1;
    }
    log_message("INFO", "Connected to %s:%d", SERVER_HOST, SERVER_PORT);

    // Start IPC WebSocket server for FE
    if (ipc_start(&g_network) != 0) {
        log_message("ERROR", "Failed to start IPC server");
        network_close(&g_network);
        return 1;
    }

    pthread_t th;
    if (pthread_create(&th, NULL, receiver_thread, NULL) != 0) {
        log_message("ERROR", "Failed to start receiver thread");
        network_close(&g_network);
        return 1;
    }
    pthread_detach(th);

    char input[1024];
    int choice = -1;
    while (g_running) {
        print_menu();
        if (!read_line(input, sizeof(input))) break;
        choice = atoi(input);
        if (choice == 0) {
            g_running = 0;
            break;
        }
        if (choice == 1) {
            char user[128], pass[128];
            printf("Username: "); fflush(stdout); if (!read_line(user, sizeof(user))) continue;
            printf("Password: "); fflush(stdout); if (!read_line(pass, sizeof(pass))) continue;
            if (send_login(&g_network, user, pass) < 0) {
                printf("Send login failed\n");
                continue;
            }
            // Chờ phản hồi từ receiver_thread qua cache (timeout ~3s)
            struct timespec ts; clock_gettime(CLOCK_REALTIME, &ts);
            ts.tv_sec += 3;
            int got = 0;
            pthread_mutex_lock(&g_resp.mtx);
            while (!g_resp.ready) {
                if (pthread_cond_timedwait(&g_resp.cv, &g_resp.mtx, &ts) == ETIMEDOUT) break;
            }
            if (g_resp.ready && g_resp.type == MSG_LOGIN_RES) {
                got = 1;
                if (strcmp(g_resp.data, RESPONSE_OK) == 0) {
                    snprintf(g_network.username, sizeof(g_network.username), "%.49s", user);
                    printf("Login successful as %s\n", user);
                } else {
                    printf("Login failed: %s\n", g_resp.data);
                }
            }
            g_resp.ready = 0;
            pthread_mutex_unlock(&g_resp.mtx);
            if (!got) printf("No/invalid response to login\n");
        } else if (choice == 2) {
            char user[128], pass[128];
            printf("Username: "); fflush(stdout); if (!read_line(user, sizeof(user))) continue;
            printf("Password: "); fflush(stdout); if (!read_line(pass, sizeof(pass))) continue;
            if (send_register(&g_network, user, pass) < 0) { printf("Send register failed\n"); continue; }
            struct timespec ts2; clock_gettime(CLOCK_REALTIME, &ts2); ts2.tv_sec += 3;
            int got2 = 0;
            pthread_mutex_lock(&g_resp.mtx);
            while (!g_resp.ready) {
                if (pthread_cond_timedwait(&g_resp.cv, &g_resp.mtx, &ts2) == ETIMEDOUT) break;
            }
            if (g_resp.ready && g_resp.type == MSG_REGISTER_RES) {
                got2 = 1;
                if (strcmp(g_resp.data, RESPONSE_OK) == 0) printf("Register successful\n");
                else printf("Register failed: %s\n", g_resp.data);
            }
            g_resp.ready = 0;
            pthread_mutex_unlock(&g_resp.mtx);
            if (!got2) printf("No/invalid response to register\n");
        } else if (choice == 3) {
            if (send_start_session(&g_network) == 0) printf("Session started\n");
            else printf("Start session failed\n");
        } else if (choice == 4) {
            char path[512];
            printf("Image path (JPEG/PNG): "); fflush(stdout); if (!read_line(path, sizeof(path))) continue;
            unsigned char* file_buf = NULL; size_t file_len = 0;
            if (load_file(path, &file_buf, &file_len) != 0) { printf("Failed to read file\n"); continue; }
            if (send_stream_frame_bytes(&g_network, file_buf, (int)file_len) == 0) {
                printf("Frame sent (binary %zu bytes)\n", file_len);
            } else {
                printf("Send frame failed\n");
            }
            free(file_buf);
        } else if (choice == 5) {
            if (send_end_session(&g_network) == 0) printf("Session ended (await server stats in push)\n");
            else printf("End session failed\n");
        } else if (choice == 6) {
            if (send_get_leaderboard(&g_network) < 0) { printf("Send failed\n"); continue; }
            struct timespec ts3; clock_gettime(CLOCK_REALTIME, &ts3); ts3.tv_sec += 3;
            int got3 = 0;
            pthread_mutex_lock(&g_resp.mtx);
            while (!g_resp.ready) {
                if (pthread_cond_timedwait(&g_resp.cv, &g_resp.mtx, &ts3) == ETIMEDOUT) break;
            }
            if (g_resp.ready && g_resp.type == MSG_RES_LEADERBOARD) {
                got3 = 1;
                printf("Leaderboard: %s\n", g_resp.data);
            }
            g_resp.ready = 0;
            pthread_mutex_unlock(&g_resp.mtx);
            if (!got3) printf("No/invalid response to get_leaderboard\n");
        } else if (choice == 7) {
            if (send_get_profile(&g_network) < 0) { printf("Send failed\n"); continue; }
            struct timespec ts4; clock_gettime(CLOCK_REALTIME, &ts4); ts4.tv_sec += 3;
            int got4 = 0;
            pthread_mutex_lock(&g_resp.mtx);
            while (!g_resp.ready) {
                if (pthread_cond_timedwait(&g_resp.cv, &g_resp.mtx, &ts4) == ETIMEDOUT) break;
            }
            if (g_resp.ready && g_resp.type == MSG_RES_PROFILE) {
                got4 = 1;
                printf("Profile: %s\n", g_resp.data);
            }
            g_resp.ready = 0;
            pthread_mutex_unlock(&g_resp.mtx);
            if (!got4) printf("No/invalid response to get_profile\n");
        } else {
            printf("Unknown choice\n");
        }
    }

    g_running = 0;
    ipc_stop();
    network_close(&g_network);
    pthread_mutex_destroy(&g_resp.mtx);
    pthread_cond_destroy(&g_resp.cv);
    log_message("INFO", "Client exited");
    return 0;
}
