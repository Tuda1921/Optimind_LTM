/*
 * Mục đích: Khai báo API mạng cho Client (POSIX TCP), bao gồm
 *  - Kết nối/đóng kết nối tới server
 *  - Gửi/nhận gói tin theo định dạng TLV (header 8 byte: type + length)
 *  - Các hàm tiện ích gửi thông điệp theo giao thức (login, register, start/end session, stream, leaderboard, profile)
 *
 * Cấu trúc chính:
 * - NetworkState: giữ socket, trạng thái kết nối, username, user_id.
 *
 * Hàm chính:
 * - network_init(state): Khởi tạo trạng thái mạng (chưa kết nối).
 * - network_connect(state, host, port): Tạo socket và kết nối TCP tới server.
 * - network_send_packet(state, type, payload, length): Gửi 1 gói tin TLV.
 * - network_receive_packet(state, out_packet): Nhận 1 gói tin đầy đủ (blocking), cấp phát bộ nhớ cho out_packet.
 * - network_close(state): Đóng kết nối, reset trạng thái.
 * - send_login/register/start_session/end_session/stream_frame...: Helper dựng payload và gọi network_send_packet.
 */
#ifndef NETWORK_H
#define NETWORK_H

#include <stdint.h>
#include "../common/protocol.h"

// Network connection state
typedef struct {
    int socket_fd;
    int is_connected;
    char username[50];
    int user_id;
} NetworkState;

// Initialize network
int network_init(NetworkState* state);

// Connect to server
int network_connect(NetworkState* state, const char* host, int port);

// Send packet
int network_send_packet(NetworkState* state, int type, const char* payload, int length);

// Receive packet (blocking)
int network_receive_packet(NetworkState* state, PacketHeader** packet);

// Close connection
void network_close(NetworkState* state);

// Helper functions
int send_login(NetworkState* state, const char* username, const char* password);
int send_register(NetworkState* state, const char* username, const char* password);
int send_start_session(NetworkState* state);
int send_end_session(NetworkState* state);
int send_stream_frame(NetworkState* state, const char* base64_data);
int send_stream_frame_bytes(NetworkState* state, const void* data, int len);
int send_get_leaderboard(NetworkState* state);
int send_get_profile(NetworkState* state);

#endif // NETWORK_H
