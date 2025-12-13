/*
 * Mục đích: Các tiện ích chung (logging, xử lý chuỗi, thời gian, số ngẫu nhiên).
 *
 * Hàm:
 * - log_message(level, format, ...): In log có timestamp.
 * - trim_string(str): Cắt khoảng trắng đầu/cuối chuỗi tại chỗ.
 * - get_current_timestamp(): Epoch seconds hiện tại.
 * - random_range(min, max): Sinh số nguyên [min, max].
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <stdarg.h>
#include "config.h"

// Log utility with timestamp
void log_message(const char* level, const char* format, ...) {
    time_t now = time(NULL);
    struct tm* tm_info = localtime(&now);
    char timestamp[20];
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", tm_info);
    
    printf("[%s] [%s] ", timestamp, level);
    
    va_list args;
    va_start(args, format);
    vprintf(format, args);
    va_end(args);
    
    printf("\n");
    fflush(stdout);
}

// String trimming utility
void trim_string(char* str) {
    if (str == NULL) return;
    
    // Trim leading spaces
    char* start = str;
    while (*start == ' ' || *start == '\t' || *start == '\n' || *start == '\r') {
        start++;
    }
    
    // Trim trailing spaces
    char* end = start + strlen(start) - 1;
    while (end > start && (*end == ' ' || *end == '\t' || *end == '\n' || *end == '\r')) {
        end--;
    }
    *(end + 1) = '\0';
    
    // Move trimmed string to beginning
    if (start != str) {
        memmove(str, start, strlen(start) + 1);
    }
}

// Get current timestamp in seconds
long get_current_timestamp() {
    return (long)time(NULL);
}

// Generate random number between min and max
int random_range(int min, int max) {
    return min + rand() % (max - min + 1);
}
