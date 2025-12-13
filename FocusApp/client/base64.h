/*
 * Mục đích: Khai báo các hàm mã hoá Base64 dùng (tuỳ chọn) cho việc gửi frame.
 *
 * Hàm chính:
 * - base64_encoded_size(input_length): Tính kích thước chuỗi Base64 tương ứng với dữ liệu đầu vào.
 * - base64_encode(data, input_length, encoded_data, encoded_capacity): Mã hoá mảng byte sang chuỗi Base64.
 */
#ifndef BASE64_H
#define BASE64_H

#include <stddef.h>

size_t base64_encoded_size(size_t input_length);
void base64_encode(const unsigned char* data, size_t input_length, char* encoded_data, size_t encoded_capacity);

#endif // BASE64_H