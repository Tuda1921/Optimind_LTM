#ifndef WEBSOCKET_H
#define WEBSOCKET_H

#include <stdint.h>

// Perform WebSocket handshake if the initial bytes look like HTTP GET.
// Returns 0 on success, -1 on failure.
int websocket_handshake(int fd);

// Receive a WebSocket frame (text/binary). Allocates payload (caller free).
// opcode out param stores the opcode (0x1 text, 0x2 binary, 0x8 close, 0x9 ping).
// Returns payload length, or -1 on error/connection close.
int websocket_recv_frame(int fd, char** payload, uint8_t* opcode);

// Send a text frame (unmasked, as server side).
int websocket_send_text(int fd, const char* data, int len);

// Send a pong frame for ping.
int websocket_send_pong(int fd, const char* data, int len);

#endif // WEBSOCKET_H
