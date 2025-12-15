/*
 * Mục đích: Cài đặt các hàm mã hoá Base64 (phục vụ đường truyền ảnh nếu dùng dạng text).
 *
 * Hàm:
 * - base64_encoded_size(input_length): Trả về kích thước chuỗi Base64 đầu ra.
 * - base64_encode(data, input_length, encoded_data, encoded_capacity): Mã hoá dữ liệu nhị phân sang Base64.
 *   Lưu ý: Caller cần cấp buffer đủ lớn (theo base64_encoded_size) để tránh tràn bộ đệm.
 */
#include "base64.h"
#include <stdint.h>

static const char b64_table[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

static int b64_value(char c) {
    if (c >= 'A' && c <= 'Z') return c - 'A';
    if (c >= 'a' && c <= 'z') return c - 'a' + 26;
    if (c >= '0' && c <= '9') return c - '0' + 52;
    if (c == '+') return 62;
    if (c == '/') return 63;
    if (c == '=') return -2; // padding
    return -1;               // invalid
}

size_t base64_encoded_size(size_t input_length) {
    size_t out = 4 * ((input_length + 2) / 3);
    return out;
}

void base64_encode(const unsigned char* data, size_t input_length, char* encoded_data, size_t encoded_capacity) {
    size_t i = 0, j = 0;
    while (i < input_length) {
        size_t rem = input_length - i;
        unsigned octet_a = data[i++];
        unsigned octet_b = (rem > 1) ? data[i++] : 0;
        unsigned octet_c = (rem > 2) ? data[i++] : 0;

        unsigned triple = (octet_a << 16) | (octet_b << 8) | octet_c;

        if (j + 4 > encoded_capacity) return; // avoid overflow; caller should size correctly
        encoded_data[j++] = b64_table[(triple >> 18) & 0x3F];
        encoded_data[j++] = b64_table[(triple >> 12) & 0x3F];
        encoded_data[j++] = (rem > 1) ? b64_table[(triple >> 6) & 0x3F] : '=';
        encoded_data[j++] = (rem > 2) ? b64_table[triple & 0x3F] : '=';
    }
    if (j < encoded_capacity) encoded_data[j] = '\0';
}

size_t base64_decoded_size(const char* b64, size_t len) {
    if (len % 4 != 0) return 0;
    size_t padding = 0;
    if (len >= 1 && b64[len - 1] == '=') padding++;
    if (len >= 2 && b64[len - 2] == '=') padding++;
    return (len / 4) * 3 - padding;
}

int base64_decode(const char* b64, size_t len, unsigned char* out, size_t out_capacity) {
    if (len % 4 != 0) return -1;
    size_t expected = base64_decoded_size(b64, len);
    if (expected > out_capacity) return -2;

    size_t j = 0;
    for (size_t i = 0; i < len; i += 4) {
        int v0 = b64_value(b64[i]);
        int v1 = b64_value(b64[i + 1]);
        int v2 = b64_value(b64[i + 2]);
        int v3 = b64_value(b64[i + 3]);
        if (v0 < 0 || v1 < 0 || v2 == -1 || v3 == -1) return -1;

        uint32_t triple = ((uint32_t)v0 << 18) | ((uint32_t)v1 << 12)
                        | ((uint32_t)((v2 < 0) ? 0 : v2) << 6)
                        | (uint32_t)((v3 < 0) ? 0 : v3);

        out[j++] = (triple >> 16) & 0xFF;
        if (b64[i + 2] != '=') out[j++] = (triple >> 8) & 0xFF;
        if (b64[i + 3] != '=') out[j++] = triple & 0xFF;
    }
    return (int)expected;
}
