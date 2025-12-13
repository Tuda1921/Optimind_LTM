/*
 * Mục đích: Cấu hình chung cho Client/Server (địa chỉ, cổng, tham số luồng, ngưỡng cảnh báo...).
 *
 * Các nhóm cấu hình chính:
 * - Network: SERVER_HOST, SERVER_PORT, kích thước buffer, số client tối đa.
 * - Session/AI demo: STREAM_INTERVAL_MS, FOCUS_THRESHOLD.
 * - File server (placeholder): đường dẫn lưu dữ liệu nếu cần.
 * - Gamification: hệ số thưởng, xu/phút (tham khảo).
 * - DEBUG_MODE: bật/tắt log chi tiết.
 */
#ifndef CONFIG_H
#define CONFIG_H

// Network Configuration
#define SERVER_HOST "127.0.0.1"
#define SERVER_PORT 8080
#define BUFFER_SIZE 4096
#define MAX_CLIENTS 100

// Session Configuration
#define STREAM_INTERVAL_MS 1000  // Gửi frame mỗi 1 giây
#define FOCUS_THRESHOLD 60       // Ngưỡng độ tập trung cảnh báo (%)

// File paths (Server side)
#define USERS_FILE "data/users.txt"
#define HISTORY_FILE "data/history.txt"

// Gamification
#define COINS_PER_MINUTE 2       // 2 xu/phút học tập
#define FOCUS_BONUS_MULTIPLIER 1.5  // Nhân thêm 1.5 nếu tập trung tốt

// Debug
#define DEBUG_MODE 1

#endif // CONFIG_H
