/*
 * Mục đích: Điểm vào (entry) của Server.
 *  - Khởi tạo SharedState và mutex.
 *  - Tạo socket lắng nghe, accept kết nối và spawn thread cho mỗi client.
 *  - Mỗi thread chạy client_thread() (định nghĩa trong handlers.c).
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <pthread.h>

#include "handlers.h"
#include "../common/config.h"

extern void log_message(const char* level, const char* format, ...);

int main() {
    // Initialize shared state and mutex
    memset(&g_shared, 0, sizeof(g_shared));
    if (pthread_mutex_init(&g_shared.mtx, NULL) != 0) {
        fprintf(stderr, "pthread_mutex_init failed\n");
        return 1;
    }

    // Ensure data dir and load persisted users
    ensure_data_dir();
    load_users_from_file();

    int listen_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (listen_fd < 0) {
        perror("socket");
        return 1;
    }

    int opt = 1;
    setsockopt(listen_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(SERVER_PORT);

    if (bind(listen_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        perror("bind");
        close(listen_fd);
        return 1;
    }

    if (listen(listen_fd, 16) < 0) {
        perror("listen");
        close(listen_fd);
        return 1;
    }

    log_message("INFO", "Server listening on port %d", SERVER_PORT);

    for (;;) {
        struct sockaddr_in cli;
        socklen_t clilen = sizeof(cli);
        int* fd = (int*)malloc(sizeof(int));
        if (!fd) { perror("malloc"); break; }
        *fd = accept(listen_fd, (struct sockaddr*)&cli, &clilen);
        if (*fd < 0) {
            perror("accept");
            free(fd);
            continue;
        }
        char ip[64];
        inet_ntop(AF_INET, &cli.sin_addr, ip, sizeof(ip));
        log_message("INFO", "Accepted connection from %s:%d", ip, ntohs(cli.sin_port));

        pthread_t th;
        if (pthread_create(&th, NULL, client_thread, fd) != 0) {
            perror("pthread_create");
            close(*fd);
            free(fd);
            continue;
        }
        pthread_detach(th);
    }

    close(listen_fd);
    pthread_mutex_destroy(&g_shared.mtx);
    return 0;
}
