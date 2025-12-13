/*
 * Mục đích: Khai báo cấu trúc dữ liệu dùng chung và API xử lý phía Server.
 *
 * Cấu trúc:
 * - UserStat: Thống kê người dùng (coins, số phiên, tổng giây học...).
 * - ClientContext: Trạng thái theo kết nối client (fd, username, thời điểm bắt đầu phiên...).
 * - SharedState: Bộ nhớ chia sẻ toàn server (mảng UserStat + mutex bảo vệ).
 *
 * Hàm:
 * - recv_all/send_all: Đảm bảo nhận/gửi đủ số byte yêu cầu trên socket.
 * - send_packet: Gửi gói tin TLV (header + payload).
 * - shared_find_or_add_user, shared_add_session_result: Cập nhật/tìm người dùng trong bảng xếp hạng.
 * - client_thread(void*): Hàm chạy trong mỗi thread xử lý 1 client.
 */
#ifndef SERVER_HANDLERS_H
#define SERVER_HANDLERS_H

#include <pthread.h>
#include <stdint.h>
#include <time.h>
#include "../common/protocol.h"
#include "../common/config.h"

// Shared leaderboard/profile state (in-memory)
#define MAX_USERS 128

typedef struct {
    char username[64];
    int total_coins;
    int total_sessions;
    int total_seconds;
    int in_use; // 1 if populated
} UserStat;

typedef struct {
    int client_fd;
    char username[64];
    time_t session_start;
    int frame_count;
    int logged_in;
} ClientContext;

typedef struct {
    UserStat users[MAX_USERS];
    pthread_mutex_t mtx;
} SharedState;

extern SharedState g_shared;

// Utility I/O
int recv_all(int fd, void* buf, int len);
int send_all(int fd, const void* buf, int len);
int send_packet(int fd, int type, const void* payload, int length);

// User stats helpers
int shared_find_or_add_user(const char* username);
void shared_add_session_result(const char* username, int seconds, int coins);

// Client thread entry
void* client_thread(void* arg);

// Persistence helpers
void ensure_data_dir();
void load_users_from_file();
void save_users_to_file();
void append_history_record(const char* username, int seconds, int coins);

#endif // SERVER_HANDLERS_H
