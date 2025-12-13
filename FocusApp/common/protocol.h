/*
 * Mục đích: Định nghĩa giao thức TLV dùng chung giữa Client/Server.
 *  - MessageType: liệt kê các loại thông điệp (đăng nhập, bắt đầu/kết thúc phiên, stream, cảnh báo, thống kê...).
 *  - PacketHeader: header cố định 8 byte (int32 type + int32 length) theo đúng format Phase 1.
 *  - Macro: HEADER_SIZE, MAX_PAYLOAD_SIZE, mã phản hồi, và alias tương thích (MSG_START_POMO, MSG_WARNING...).
 */
#ifndef PROTOCOL_H
#define PROTOCOL_H

#include <stdint.h>

// Message Types - Enum for all protocol messages
typedef enum {
    // Auth Group (2-6 điểm)
    MSG_LOGIN_REQ = 1,
    MSG_LOGIN_RES,
    MSG_REGISTER_REQ,
    MSG_REGISTER_RES,
    MSG_LOGOUT,
    
    // Focus & Stream Group (6-10 điểm)
    MSG_START_SESSION,      // Bắt đầu học
    MSG_END_SESSION,        // Kết thúc học
    MSG_STREAM_FRAME,       // Gửi dữ liệu ảnh (Base64)
    MSG_FOCUS_WARN,         // Server cảnh báo mất tập trung
    MSG_FOCUS_UPDATE,       // Server gửi điểm tập trung hiện tại
    
    // Stats & Gamification Group (3-5 điểm)
    MSG_UPDATE_COINS,       // Cộng xu
    MSG_GET_LEADERBOARD,    // Lấy bảng xếp hạng
    MSG_RES_LEADERBOARD,    // Trả về dữ liệu BXH
    MSG_GET_HISTORY,        // Lấy lịch sử học tập
    MSG_RES_HISTORY,        // Trả về lịch sử
    MSG_GET_PROFILE,        // Lấy thông tin profile
    MSG_RES_PROFILE,        // Trả về profile
    
    // Heartbeat & Error
    MSG_PING,
    MSG_PONG,
    MSG_ERROR
} MessageType;

// Packet Header Structure (Fixed 8 bytes)
typedef struct {
    int32_t type;           // MessageType (4 bytes)
    int32_t length;         // Độ dài payload (4 bytes)
    char payload[0];        // Flexible Array Member (C99)
} PacketHeader;

// Helper macros
#define HEADER_SIZE (sizeof(int32_t) * 2)
#define MAX_PAYLOAD_SIZE (1024 * 1024 * 2)  // 2MB for images

// Response codes
#define RESPONSE_OK "OK"
#define RESPONSE_FAIL "FAIL"
#define RESPONSE_ERROR "ERROR"

// Compatibility aliases to match Phase 1 spec names
// Map POMO/Warning/Stat to current message set so client can use spec terms
#ifndef MSG_START_POMO
#define MSG_START_POMO MSG_START_SESSION
#endif
#ifndef MSG_END_POMO
#define MSG_END_POMO MSG_END_SESSION
#endif
#ifndef MSG_WARNING
#define MSG_WARNING MSG_FOCUS_WARN
#endif
#ifndef MSG_UPDATE_STAT
#define MSG_UPDATE_STAT MSG_UPDATE_COINS
#endif

#endif // PROTOCOL_H
