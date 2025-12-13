/*
 * Mục đích: Cài đặt lớp giao tiếp mạng của Client bằng POSIX sockets (Linux/WSL).
 *  - Định dạng gói tin TLV: header 8 byte (int32 type, int32 length) + payload.
 *  - Xử lý gửi/nhận an toàn (loop đến khi đủ byte), validate kích thước payload.
 *
 * Hàm chính:
 * - network_init(state): Khởi tạo biến trạng thái.
 * - network_connect(state, host, port): Tạo socket, kết nối TCP.
 * - network_send_packet(state, type, payload, length): Gửi gói tin (header + payload).
 * - network_receive_packet(state, **packet): Nhận đầy đủ 1 gói (cấp phát bộ nhớ cho caller).
 * - network_close(state): Đóng socket và đánh dấu ngắt kết nối.
 *
 * Helper (giao thức nghiệp vụ):
 * - send_login, send_register, send_start_session, send_end_session,
 *   send_stream_frame (Base64 - legacy), send_stream_frame_bytes (nhị phân),
 *   send_get_leaderboard, send_get_profile.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <netinet/in.h>
#include "network.h"
#include "../common/protocol.h"
#include "../common/config.h"

extern void log_message(const char* level, const char* format, ...);

// Initialize network (POSIX)
int network_init(NetworkState* state) {
    state->socket_fd = -1;
    state->is_connected = 0;
    memset(state->username, 0, sizeof(state->username));
    state->user_id = -1;
    
    log_message("INFO", "Network initialized");
    return 0;
}

// Connect to server
int network_connect(NetworkState* state, const char* host, int port) {
    struct sockaddr_in server_addr;
    
    // Create socket
    state->socket_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (state->socket_fd < 0) {
        log_message("ERROR", "Socket creation failed");
        return -1;
    }
    
    // Setup server address
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(port);
    
    if (inet_pton(AF_INET, host, &server_addr.sin_addr) <= 0) {
        log_message("ERROR", "Invalid address: %s", host);
        close(state->socket_fd);
        return -1;
    }
    
    // Connect
    if (connect(state->socket_fd, (struct sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
        log_message("ERROR", "Connection failed to %s:%d", host, port);
        close(state->socket_fd);
        return -1;
    }
    
    state->is_connected = 1;
    log_message("INFO", "Connected to server %s:%d", host, port);
    return 0;
}

// Send packet with header
int network_send_packet(NetworkState* state, int type, const char* payload, int length) {
    if (!state->is_connected) {
        log_message("ERROR", "Not connected to server");
        return -1;
    }
    
    // Allocate buffer for header + payload
    int total_size = HEADER_SIZE + length;
    char* buffer = (char*)malloc(total_size);
    if (!buffer) {
        log_message("ERROR", "Memory allocation failed");
        return -1;
    }
    
    // Pack header
    PacketHeader* header = (PacketHeader*)buffer;
    header->type = type;
    header->length = length;
    
    // Copy payload
    if (length > 0 && payload) {
        memcpy(buffer + HEADER_SIZE, payload, length);
    }
    
    // Send all data
    int sent = 0;
    while (sent < total_size) {
        int n = send(state->socket_fd, buffer + sent, total_size - sent, 0);
        if (n <= 0) {
            log_message("ERROR", "Send failed");
            free(buffer);
            return -1;
        }
        sent += n;
    }
    
    log_message("DEBUG", "Sent packet type=%d, length=%d", type, length);
    free(buffer);
    return 0; // success
}

// Receive packet (blocking)
int network_receive_packet(NetworkState* state, PacketHeader** packet) {
    if (!state->is_connected) {
        log_message("ERROR", "Not connected to server");
        return -1;
    }
    
    // Read header first (8 bytes)
    char header_buf[HEADER_SIZE];
    int received = 0;
    int header_size = (int)HEADER_SIZE;
    
    while (received < header_size) {
        int n = recv(state->socket_fd, header_buf + received, header_size - received, 0);
        if (n <= 0) {
            log_message("ERROR", "Connection closed or error while receiving header");
            state->is_connected = 0;
            return -1;
        }
        received += n;
    }
    
    // Parse header
    PacketHeader temp_header;
    memcpy(&temp_header, header_buf, HEADER_SIZE);
    
    int type = temp_header.type;
    int length = temp_header.length;
    
    log_message("DEBUG", "Received header: type=%d, length=%d", type, length);
    
    // Validate length
    if (length < 0 || length > MAX_PAYLOAD_SIZE) {
        log_message("ERROR", "Invalid payload length: %d", length);
        return -1;
    }
    
    // Allocate memory for full packet
    *packet = (PacketHeader*)malloc(HEADER_SIZE + length + 1); // +1 cho '\0' an toàn khi xử lý chuỗi
    if (!*packet) {
        log_message("ERROR", "Memory allocation failed for packet");
        return -1;
    }
    
    // Copy header
    memcpy(*packet, &temp_header, HEADER_SIZE);
    
    // Read payload if exists
    if (length > 0) {
        received = 0;
        char* payload_ptr = (char*)(*packet) + HEADER_SIZE;
        
        while (received < length) {
            int n = recv(state->socket_fd, payload_ptr + received, length - received, 0);
            if (n <= 0) {
                log_message("ERROR", "Connection closed while receiving payload");
                free(*packet);
                *packet = NULL;
                state->is_connected = 0;
                return -1;
            }
            received += n;
        }
    }
    // Đặt null-terminator an toàn sau payload để tiện xử lý chuỗi ở caller
    ((char*)(*packet))[HEADER_SIZE + length] = '\0';
    
    return HEADER_SIZE + length;
}

// Close connection
void network_close(NetworkState* state) {
    if (state->socket_fd >= 0) {
        close(state->socket_fd);
        state->socket_fd = -1;
    }
    state->is_connected = 0;
    log_message("INFO", "Network connection closed");
}

// Helper: Send login request
int send_login(NetworkState* state, const char* username, const char* password) {
    char payload[200];
    snprintf(payload, sizeof(payload), "%s|%s", username, password);
    return network_send_packet(state, MSG_LOGIN_REQ, payload, strlen(payload));
}

// Helper: Send register request
int send_register(NetworkState* state, const char* username, const char* password) {
    char payload[200];
    snprintf(payload, sizeof(payload), "%s|%s", username, password);
    return network_send_packet(state, MSG_REGISTER_REQ, payload, strlen(payload));
}

// Helper: Start session
int send_start_session(NetworkState* state) {
    return network_send_packet(state, MSG_START_SESSION, NULL, 0);
}

// Helper: End session
int send_end_session(NetworkState* state) {
    return network_send_packet(state, MSG_END_SESSION, NULL, 0);
}

// Helper: Send stream frame (base64) - legacy
int send_stream_frame(NetworkState* state, const char* base64_data) {
    return network_send_packet(state, MSG_STREAM_FRAME, base64_data, (int)strlen(base64_data));
}

// Helper: Send stream frame as raw binary bytes
int send_stream_frame_bytes(NetworkState* state, const void* data, int len) {
    if (!data || len <= 0) return -1;
    return network_send_packet(state, MSG_STREAM_FRAME, (const char*)data, len);
}

// Helper: Get leaderboard
int send_get_leaderboard(NetworkState* state) {
    return network_send_packet(state, MSG_GET_LEADERBOARD, NULL, 0);
}

// Helper: Get profile
int send_get_profile(NetworkState* state) {
    return network_send_packet(state, MSG_GET_PROFILE, NULL, 0);
}
