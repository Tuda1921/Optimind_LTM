/*
 * Mục đích: Cài đặt các hàm xử lý phía Server cho từng client.
 *  - Nhận/gửi dữ liệu qua TCP, parse header TLV, dispatch theo MessageType.
 *  - Quản lý trạng thái phiên học, cảnh báo tập trung, cập nhật thống kê/xếp hạng.
 *
 * Hàm quan trọng:
 * - recv_all / send_all / send_packet: I/O socket an toàn, đóng gói TLV.
 * - shared_find_or_add_user / shared_add_session_result: Quản lý UserStat trong SharedState (có mutex).
 * - handle_login / handle_start_session / handle_end_session / handle_stream_frame:
 *     Xử lý logic xác thực, bắt đầu/kết thúc phiên, phát cảnh báo định kỳ.
 * - handle_get_leaderboard / handle_get_profile: Trả JSON dữ liệu bảng xếp hạng và hồ sơ.
 * - client_thread(void*): Vòng lặp nhận gói và gọi handler tương ứng cho 1 kết nối.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <pthread.h>
#include <time.h>
#include <errno.h>
#include <ctype.h>

#include "handlers.h"
#include "websocket.h"
#include "../client/base64.h"

extern void log_message(const char* level, const char* format, ...);

SharedState g_shared; // zeroed in main; mutex initialized in main

// Ensure data directory exists
void ensure_data_dir() {
    system("mkdir -p data");
}

// Load users from USERS_FILE into shared state (overwrites current in-memory)
void load_users_from_file() {
    ensure_data_dir();
    FILE* f = fopen(USERS_FILE, "r");
    if (!f) return; // if file absent, ignore

    pthread_mutex_lock(&g_shared.mtx);
    memset(&g_shared.users, 0, sizeof(g_shared.users));

    char line[256];
    while (fgets(line, sizeof(line), f)) {
        char user[64], pass[64] = {0};
        int coins = 0, sessions = 0, seconds = 0;
        int n = sscanf(line, "%63[^|]|%63[^|]|%d|%d|%d", user, pass, &coins, &sessions, &seconds);
        if (n == 4) { // backward compatible file without password
            strcpy(pass, "");
        }
        if (n >= 4) {
            int idx = shared_find_or_add_user_unlocked(user);
            if (idx >= 0) {
                strncpy(g_shared.users[idx].password, pass, sizeof(g_shared.users[idx].password)-1);
                g_shared.users[idx].password[sizeof(g_shared.users[idx].password)-1] = '\0';
                g_shared.users[idx].total_coins = coins;
                g_shared.users[idx].total_sessions = sessions;
                g_shared.users[idx].total_seconds = seconds;
            }
        }
    }
    pthread_mutex_unlock(&g_shared.mtx);
    fclose(f);
    log_message("INFO", "[Persist] Loaded users from %s", USERS_FILE);
}

// Save all users to USERS_FILE (overwrite)
void save_users_to_file() {
    ensure_data_dir();
    FILE* f = fopen(USERS_FILE, "w");
    if (!f) {
        log_message("ERROR", "[Persist] Cannot open %s to save users: %s", USERS_FILE, strerror(errno));
        return;
    }
    pthread_mutex_lock(&g_shared.mtx);
    for (int i = 0; i < MAX_USERS; ++i) {
        if (!g_shared.users[i].in_use) continue;
        fprintf(f, "%s|%s|%d|%d|%d\n",
                g_shared.users[i].username,
                g_shared.users[i].password,
                g_shared.users[i].total_coins,
                g_shared.users[i].total_sessions,
                g_shared.users[i].total_seconds);
    }
    pthread_mutex_unlock(&g_shared.mtx);
    fclose(f);
    log_message("INFO", "[Persist] Saved users to %s", USERS_FILE);
}

// Append history record for a session
void append_history_record(const char* username, int seconds, int coins) {
    ensure_data_dir();
    FILE* f = fopen(HISTORY_FILE, "a");
    if (!f) {
        log_message("ERROR", "[Persist] Cannot append history to %s: %s", HISTORY_FILE, strerror(errno));
        return;
    }
    time_t now = time(NULL);
    fprintf(f, "%s|%d|%d|%ld\n", username, seconds, coins, (long)now);
    fclose(f);
}

// Internal find/add without locking (caller must hold g_shared.mtx)
static int shared_find_user_unlocked(const char* username) {
    for (int i = 0; i < MAX_USERS; ++i) {
        if (g_shared.users[i].in_use && strcmp(g_shared.users[i].username, username) == 0) {
            return i;
        }
    }
    return -1;
}

static int shared_find_or_add_user_unlocked(const char* username) {
    int idx = -1, free_idx = -1;
    for (int i = 0; i < MAX_USERS; ++i) {
        if (g_shared.users[i].in_use && strcmp(g_shared.users[i].username, username) == 0) {
            idx = i; break;
        }
        if (!g_shared.users[i].in_use && free_idx == -1) free_idx = i;
    }
    if (idx == -1 && free_idx != -1) {
        strncpy(g_shared.users[free_idx].username, username, sizeof(g_shared.users[free_idx].username)-1);
        g_shared.users[free_idx].username[sizeof(g_shared.users[free_idx].username)-1] = '\0';
        g_shared.users[free_idx].in_use = 1;
        idx = free_idx;
    }
    return idx;
}

int recv_all(int fd, void* buf, int len) {
    int total = 0;
    char* p = (char*)buf;
    while (total < len) {
        int n = recv(fd, p + total, len - total, 0);
        if (n <= 0) return -1;
        total += n;
    }
    return total;
}

int send_all(int fd, const void* buf, int len) {
    int total = 0;
    const char* p = (const char*)buf;
    while (total < len) {
        int n = send(fd, p + total, len - total, 0);
        if (n <= 0) return -1;
        total += n;
    }
    return total;
}

int send_packet(int fd, int type, const void* payload, int length) {
    PacketHeader hdr;
    hdr.type = type;
    hdr.length = length;
    if (send_all(fd, &hdr, HEADER_SIZE) < 0) return -1;
    if (length > 0 && payload) {
        if (send_all(fd, payload, length) < 0) return -1;
    }
    return 0;
}

int shared_find_or_add_user(const char* username) {
    pthread_mutex_lock(&g_shared.mtx);
    int idx = shared_find_or_add_user_unlocked(username);
    pthread_mutex_unlock(&g_shared.mtx);
    return idx;
}

void shared_add_session_result(const char* username, int seconds, int coins) {
    pthread_mutex_lock(&g_shared.mtx);
    int idx = shared_find_or_add_user_unlocked(username);
    if (idx >= 0) {
        g_shared.users[idx].total_sessions += 1;
        g_shared.users[idx].total_seconds += seconds;
        g_shared.users[idx].total_coins += coins;
    }
    pthread_mutex_unlock(&g_shared.mtx);
}

static void send_error(ClientContext* ctx, const char* where, const char* message) {
    if (ctx->is_websocket) {
        char buf[256];
        snprintf(buf, sizeof(buf), "{\"event\":\"error\",\"data\":{\"where\":\"%s\",\"message\":\"%s\"}}", where, message);
        websocket_send_text(ctx->client_fd, buf, (int)strlen(buf));
    } else {
        send_packet(ctx->client_fd, MSG_ERROR, message, (int)strlen(message));
    }
}

static int parse_user_pass(const char* payload, int length, char* user, int ulen, char* pass, int plen) {
    const char* bar = (const char*)memchr(payload, '|', length);
    if (!bar) return -1;
    int nuser = (int)(bar - payload);
    if (nuser >= ulen) nuser = ulen - 1;
    memcpy(user, payload, nuser); user[nuser] = '\0';
    int npass = length - (int)(bar - payload) - 1;
    if (npass >= plen) npass = plen - 1;
    memcpy(pass, bar + 1, npass); pass[npass] = '\0';
    return 0;
}

static int handle_login(ClientContext* ctx, const char* payload, int length) {
    char user[64] = {0}, pass[64] = {0};
    if (parse_user_pass(payload, length, user, sizeof(user), pass, sizeof(pass)) < 0) {
        send_error(ctx, "login", "Thiếu username|password");
        return -1;
    }

    pthread_mutex_lock(&g_shared.mtx);
    int idx = shared_find_user_unlocked(user);
    if (idx < 0 || strcmp(g_shared.users[idx].password, pass) != 0) {
        pthread_mutex_unlock(&g_shared.mtx);
        send_error(ctx, "login", "Sai tài khoản hoặc mật khẩu");
        return -1;
    }
    pthread_mutex_unlock(&g_shared.mtx);

    strncpy(ctx->username, user, sizeof(ctx->username) - 1);
    ctx->username[sizeof(ctx->username) - 1] = '\0';
    ctx->logged_in = 1;

    const char* ok = RESPONSE_OK;
    if (ctx->is_websocket) {
        websocket_send_text(ctx->client_fd, "{\"event\":\"login_ok\"}", 22);
    } else {
        send_packet(ctx->client_fd, MSG_LOGIN_RES, ok, (int)strlen(ok));
    }
    log_message("INFO", "[Auth] User %s logged in", ctx->username);
    return 0;
}

static int handle_register(ClientContext* ctx, const char* payload, int length) {
    char user[64] = {0}, pass[64] = {0};
    if (parse_user_pass(payload, length, user, sizeof(user), pass, sizeof(pass)) < 0 || pass[0] == '\0') {
        send_error(ctx, "register", "Thiếu username|password");
        return -1;
    }

    pthread_mutex_lock(&g_shared.mtx);
    int idx = shared_find_user_unlocked(user);
    if (idx >= 0) {
        pthread_mutex_unlock(&g_shared.mtx);
        send_error(ctx, "register", "Tài khoản đã tồn tại");
        return -1;
    }
    int new_idx = shared_find_or_add_user_unlocked(user);
    if (new_idx >= 0) {
        strncpy(g_shared.users[new_idx].password, pass, sizeof(g_shared.users[new_idx].password) - 1);
        g_shared.users[new_idx].password[sizeof(g_shared.users[new_idx].password) - 1] = '\0';
        g_shared.users[new_idx].total_coins = 0;
        g_shared.users[new_idx].total_sessions = 0;
        g_shared.users[new_idx].total_seconds = 0;
    }
    pthread_mutex_unlock(&g_shared.mtx);

    save_users_to_file();

    const char* ok = RESPONSE_OK;
    if (ctx->is_websocket) {
        websocket_send_text(ctx->client_fd, "{\"event\":\"register_ok\"}", 25);
    } else {
        send_packet(ctx->client_fd, MSG_REGISTER_RES, ok, (int)strlen(ok));
    }
    log_message("INFO", "[Auth] User %s registered", user);
    return 0;
}

static void handle_start_session(ClientContext* ctx) {
    ctx->session_start = time(NULL);
    ctx->frame_count = 0;
    log_message("INFO", "[Pomo] %s started session", ctx->username[0]?ctx->username:"<guest>");
}

static void handle_end_session(ClientContext* ctx) {
    time_t now = time(NULL);
    int seconds = (int)difftime(now, ctx->session_start);
    if (seconds < 0) seconds = 0;
    int coins = (seconds / 60) * COINS_PER_MINUTE;

    const char* user = ctx->username[0] ? ctx->username : "guest";
    shared_add_session_result(user, seconds, coins);

    // Lưu persist và ghi history
    save_users_to_file();
    append_history_record(user, seconds, coins);

    char json[256];
    snprintf(json, sizeof(json), "{\"seconds\":%d,\"coins\":%d}", seconds, coins);
    if (ctx->is_websocket) {
        char wrapper[320];
        int w = snprintf(wrapper, sizeof(wrapper), "{\"event\":\"session_result\",\"data\":%s}", json);
        websocket_send_text(ctx->client_fd, wrapper, w);
    } else {
        send_packet(ctx->client_fd, MSG_UPDATE_COINS, json, (int)strlen(json));
    }
    log_message("INFO", "[Pomo] %s ended session: %d sec, %d coins", user, seconds, coins);
}

static void handle_stream_frame(ClientContext* ctx, const char* data, int length) {
    ctx->frame_count++;

    const char* user = ctx->username[0] ? ctx->username : "guest";

    // Tính điểm tập trung đơn giản dựa trên checksum payload (demo)
    unsigned long long sum = 0;
    int step = (length > 4096) ? length / 4096 : 1;
    for (int i = 0; i < length; i += step) sum += (unsigned char)data[i];
    int score = (int)((sum % 10100) / 100); // 0..100

    char json[128];
    snprintf(json, sizeof(json), "{\"score\":%d,\"frames\":%d}", score, ctx->frame_count);
    if (ctx->is_websocket) {
        char wrap[180];
        int w = snprintf(wrap, sizeof(wrap), "{\"event\":\"focus_update\",\"data\":%s}", json);
        websocket_send_text(ctx->client_fd, wrap, w);
        if (score < FOCUS_THRESHOLD) {
            websocket_send_text(ctx->client_fd, "{\"event\":\"focus_warn\"}", 30);
        }
    } else {
        send_packet(ctx->client_fd, MSG_FOCUS_UPDATE, json, (int)strlen(json));
        if (score < FOCUS_THRESHOLD) send_packet(ctx->client_fd, MSG_FOCUS_WARN, NULL, 0);
    }
    log_message("INFO", "[Stream] Frame %d from %s, score=%d", ctx->frame_count, user, score);
}

static void handle_get_leaderboard(ClientContext* ctx) {
    // Build simple JSON array of top users (first N)
    char buf[2048];
    int off = 0;
    off += snprintf(buf+off, sizeof(buf)-off, "[");

    pthread_mutex_lock(&g_shared.mtx);
    int count = 0;
    for (int i = 0; i < MAX_USERS && count < 10; ++i) {
        if (!g_shared.users[i].in_use) continue;
        if (count > 0) off += snprintf(buf+off, sizeof(buf)-off, ",");
        off += snprintf(buf+off, sizeof(buf)-off, "{\"username\":\"%s\",\"coins\":%d,\"sessions\":%d}",
                        g_shared.users[i].username, g_shared.users[i].total_coins, g_shared.users[i].total_sessions);
        count++;
    }
    pthread_mutex_unlock(&g_shared.mtx);

    off += snprintf(buf+off, sizeof(buf)-off, "]");
    if (ctx->is_websocket) {
        char wrapper[2300];
        int w = snprintf(wrapper, sizeof(wrapper), "{\"event\":\"leaderboard\",\"data\":%s}", buf);
        websocket_send_text(ctx->client_fd, wrapper, w);
    } else {
        send_packet(ctx->client_fd, MSG_RES_LEADERBOARD, buf, (int)strlen(buf));
    }
}

static void handle_get_profile(ClientContext* ctx) {
    char buf[512];
    pthread_mutex_lock(&g_shared.mtx);
    int idx = shared_find_or_add_user_unlocked(ctx->username);
    int coins = 0, sessions = 0, seconds = 0;
    if (idx >= 0) {
        coins = g_shared.users[idx].total_coins;
        sessions = g_shared.users[idx].total_sessions;
        seconds = g_shared.users[idx].total_seconds;
    }
    pthread_mutex_unlock(&g_shared.mtx);

    snprintf(buf, sizeof(buf), "{\"username\":\"%s\",\"coins\":%d,\"sessions\":%d,\"seconds\":%d}",
             ctx->username, coins, sessions, seconds);
    if (ctx->is_websocket) {
        char wrapper[600];
        int w = snprintf(wrapper, sizeof(wrapper), "{\"event\":\"profile\",\"data\":%s}", buf);
        websocket_send_text(ctx->client_fd, wrapper, w);
    } else {
        send_packet(ctx->client_fd, MSG_RES_PROFILE, buf, (int)strlen(buf));
    }
}

// -------- WebSocket helpers --------
static void send_ws_simple(ClientContext* ctx, const char* event, const char* payload) {
    char buf[1024];
    if (!payload) payload = "null";
    int n = snprintf(buf, sizeof(buf), "{\"event\":\"%s\",\"data\":%s}", event, payload);
    if (n < 0) return;
    websocket_send_text(ctx->client_fd, buf, n);
}

static int json_find_string(const char* json, int len, const char* key, char* out, int outlen) {
    // Very small JSON extractor: assumes "key":"value" without escapes.
    const char* p = json;
    int klen = (int)strlen(key);
    while (p < json + len) {
        const char* k = strstr(p, key);
        if (!k) break;
        k += klen;
        const char* colon = strchr(k, ':');
        if (!colon) break;
        const char* quote = strchr(colon, '"');
        if (!quote) { p = colon + 1; continue; }
        quote++;
        const char* end = strchr(quote, '"');
        if (!end) break;
        int slen = (int)(end - quote);
        if (slen >= outlen) slen = outlen - 1;
        memcpy(out, quote, slen);
        out[slen] = '\0';
        return 1;
    }
    return 0;
}

static void handle_ws_message(ClientContext* ctx, const char* payload, int length) {
    char type[64] = {0};
    if (!json_find_string(payload, length, "\"type\"", type, sizeof(type))) {
        send_ws_simple(ctx, "error", "\"missing type\"");
        return;
    }

    if (strcmp(type, "login") == 0) {
        char user[64] = {0}, pass[64] = {0};
        json_find_string(payload, length, "\"username\"", user, sizeof(user));
        json_find_string(payload, length, "\"password\"", pass, sizeof(pass));
        char buf[256];
        int len = snprintf(buf, sizeof(buf), "%s|%s", user, pass);
        handle_login(ctx, buf, len);
        return;
    }
    if (strcmp(type, "signup") == 0 || strcmp(type, "register") == 0) {
        char user[64] = {0}, pass[64] = {0};
        json_find_string(payload, length, "\"username\"", user, sizeof(user));
        json_find_string(payload, length, "\"password\"", pass, sizeof(pass));
        char buf[256];
        int len = snprintf(buf, sizeof(buf), "%s|%s", user, pass);
        handle_register(ctx, buf, len);
        return;
    }
    if (strcmp(type, "start_session") == 0) {
        handle_start_session(ctx);
        send_ws_simple(ctx, "session_started", "\"ok\"");
        return;
    }
    if (strcmp(type, "end_session") == 0) {
        handle_end_session(ctx);
        return;
    }
    if (strcmp(type, "get_leaderboard") == 0) {
        handle_get_leaderboard(ctx);
        return;
    }
    if (strcmp(type, "get_profile") == 0) {
        handle_get_profile(ctx);
        return;
    }
    if (strcmp(type, "stream_frame") == 0) {
        char b64[2048] = {0};
        if (!json_find_string(payload, length, "\"data\"", b64, sizeof(b64))) {
            send_ws_simple(ctx, "error", "\"missing data\"");
            return;
        }
        size_t b64len = strlen(b64);
        size_t need = base64_decoded_size(b64, b64len);
        unsigned char* bin = (unsigned char*)malloc(need + 1);
        if (!bin) { send_ws_simple(ctx, "error", "\"oom\""); return; }
        int outlen = base64_decode(b64, b64len, bin, need);
        if (outlen < 0) { free(bin); send_ws_simple(ctx, "error", "\"bad base64\""); return; }
        handle_stream_frame(ctx, (const char*)bin, outlen);
        free(bin);
        return;
    }

    send_ws_simple(ctx, "error", "\"unknown type\"");
}

void* client_thread(void* arg) {
    int fd = *(int*)arg;
    free(arg);

    ClientContext ctx = {0};
    ctx.client_fd = fd;

    // Detect WebSocket handshake
    {
        char peek[3];
        int n = recv(fd, peek, sizeof(peek), MSG_PEEK);
        if (n > 0 && strncmp(peek, "GET", 3) == 0) {
            if (websocket_handshake(fd) == 0) {
                ctx.is_websocket = true;
                log_message("INFO", "WebSocket client upgraded");
            } else {
                log_message("ERROR", "WebSocket handshake failed");
                close(fd);
                return NULL;
            }
        }
    }

    if (ctx.is_websocket) {
        for (;;) {
            char* payload = NULL;
            uint8_t opcode = 0;
            int len = websocket_recv_frame(fd, &payload, &opcode);
            if (len < 0) break;
            if (opcode == 0x8) { // close
                free(payload);
                break;
            }
            if (opcode == 0x9) { // ping
                websocket_send_pong(fd, payload, len);
                free(payload);
                continue;
            }
            if (opcode == 0x1 && payload) { // text
                handle_ws_message(&ctx, payload, len);
            }
            free(payload);
        }
        close(fd);
        log_message("INFO", "WebSocket client disconnected");
        return NULL;
    }

    // Fallback TLV mode
    for (;;) {
        PacketHeader hdr;
        if (recv_all(fd, &hdr, HEADER_SIZE) <= 0) break;
        if (hdr.length < 0 || hdr.length > MAX_PAYLOAD_SIZE) break;

        char* payload = NULL;
        if (hdr.length > 0) {
            payload = (char*)malloc(hdr.length);
            if (!payload) break;
            if (recv_all(fd, payload, hdr.length) <= 0) { free(payload); break; }
        }

        switch (hdr.type) {
            case MSG_LOGIN_REQ:
                handle_login(&ctx, payload, hdr.length);
                break;
            case MSG_REGISTER_REQ:
                handle_register(&ctx, payload, hdr.length);
                break;
            case MSG_START_SESSION:
                handle_start_session(&ctx);
                break;
            case MSG_END_SESSION:
                handle_end_session(&ctx);
                break;
            case MSG_STREAM_FRAME:
                handle_stream_frame(&ctx, payload, hdr.length);
                break;
            case MSG_GET_LEADERBOARD:
                handle_get_leaderboard(&ctx);
                break;
            case MSG_GET_PROFILE:
                handle_get_profile(&ctx);
                break;
            default:
                log_message("DEBUG", "Unhandled type %d (len=%d)", hdr.type, hdr.length);
                break;
        }

        if (payload) free(payload);
    }

    close(fd);
    log_message("INFO", "Client disconnected");
    return NULL;
}
