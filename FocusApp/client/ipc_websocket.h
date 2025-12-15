#ifndef IPC_WEBSOCKET_H
#define IPC_WEBSOCKET_H

#include <stdint.h>

int websocket_handshake(int fd);
int websocket_recv_frame(int fd, char** payload, uint8_t* opcode);
int websocket_send_text(int fd, const char* data, int len);
int websocket_send_pong(int fd, const char* data, int len);
int websocket_send_close(int fd);

#endif
