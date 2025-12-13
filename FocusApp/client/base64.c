/*
 * Mục đích: Cài đặt các hàm mã hoá Base64 (phục vụ đường truyền ảnh nếu dùng dạng text).
 *
 * Hàm:
 * - base64_encoded_size(input_length): Trả về kích thước chuỗi Base64 đầu ra.
 * - base64_encode(data, input_length, encoded_data, encoded_capacity): Mã hoá dữ liệu nhị phân sang Base64.
 *   Lưu ý: Caller cần cấp buffer đủ lớn (theo base64_encoded_size) để tránh tràn bộ đệm.
 */
#include "base64.h"

static const char b64_table[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

size_t base64_encoded_size(size_t input_length) {
    size_t out = 4 * ((input_length + 2) / 3);
    return out;
}

void base64_encode(const unsigned char* data, size_t input_length, char* encoded_data, size_t encoded_capacity) {
    size_t i = 0, j = 0;
    while (i < input_length) {
        unsigned octet_a = i < input_length ? data[i++] : 0;
        unsigned octet_b = i < input_length ? data[i++] : 0;
        unsigned octet_c = i < input_length ? data[i++] : 0;

        unsigned triple = (octet_a << 16) | (octet_b << 8) | octet_c;

        if (j + 4 > encoded_capacity) return; // avoid overflow; caller should size correctly
        encoded_data[j++] = b64_table[(triple >> 18) & 0x3F];
        encoded_data[j++] = b64_table[(triple >> 12) & 0x3F];
        encoded_data[j++] = (i > input_length + 1) ? '=' : b64_table[(triple >> 6) & 0x3F];
        encoded_data[j++] = (i > input_length) ? '=' : b64_table[triple & 0x3F];
    }
    if (j < encoded_capacity) encoded_data[j] = '\0';
}
