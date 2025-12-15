#define _GNU_SOURCE
#include "ipc_websocket.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <stdint.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <errno.h>

#include "base64.h"

// Minimal SHA1 implementation (public domain style)
typedef struct {
    uint32_t state[5];
    uint64_t count;
    unsigned char buffer[64];
} sha1_ctx;

static uint32_t rol(uint32_t value, unsigned int bits) {
    return (value << bits) | (value >> (32 - bits));
}

static void sha1_transform(uint32_t state[5], const unsigned char buffer[64]) {
    uint32_t W[80];
    for (int t = 0; t < 16; ++t) {
        W[t] = ((uint32_t)buffer[t * 4] << 24) |
               ((uint32_t)buffer[t * 4 + 1] << 16) |
               ((uint32_t)buffer[t * 4 + 2] << 8) |
               ((uint32_t)buffer[t * 4 + 3]);
    }
    for (int t = 16; t < 80; ++t) {
        W[t] = rol(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    }

    uint32_t a = state[0];
    uint32_t b = state[1];
    uint32_t c = state[2];
    uint32_t d = state[3];
    uint32_t e = state[4];

    for (int t = 0; t < 80; ++t) {
        uint32_t K, f;
        if (t < 20) {
            f = (b & c) | ((~b) & d);
            K = 0x5A827999;
        } else if (t < 40) {
            f = b ^ c ^ d;
            K = 0x6ED9EBA1;
        } else if (t < 60) {
            f = (b & c) | (b & d) | (c & d);
            K = 0x8F1BBCDC;
        } else {
            f = b ^ c ^ d;
            K = 0xCA62C1D6;
        }
        uint32_t temp = rol(a, 5) + f + e + K + W[t];
        e = d;
        d = c;
        c = rol(b, 30);
        b = a;
        a = temp;
    }

    state[0] += a;
    state[1] += b;
    state[2] += c;
    state[3] += d;
    state[4] += e;
}

static void sha1_init(sha1_ctx* ctx) {
    ctx->state[0] = 0x67452301;
    ctx->state[1] = 0xEFCDAB89;
    ctx->state[2] = 0x98BADCFE;
    ctx->state[3] = 0x10325476;
    ctx->state[4] = 0xC3D2E1F0;
    ctx->count = 0;
}

static void sha1_update(sha1_ctx* ctx, const unsigned char* data, size_t len) {
    size_t i = 0;
    size_t j = (size_t)((ctx->count >> 3) & 63);
    ctx->count += ((uint64_t)len) << 3;

    size_t fill = 64 - j;
    if (len >= fill) {
        memcpy(&ctx->buffer[j], &data[0], fill);
        sha1_transform(ctx->state, ctx->buffer);
        for (i = fill; i + 63 < len; i += 64) {
            sha1_transform(ctx->state, &data[i]);
        }
        j = 0;
    }
    memcpy(&ctx->buffer[j], &data[i], len - i);
}

static void sha1_final(sha1_ctx* ctx, unsigned char digest[20]) {
    unsigned char finalcount[8];
    for (int i = 0; i < 8; ++i) {
        finalcount[i] = (unsigned char)((ctx->count >> ((7 - i) * 8)) & 255);
    }

    unsigned char c = 0x80;
    sha1_update(ctx, &c, 1);
    unsigned char zero = 0x00;
    while ((ctx->count & 504) != 448) {
        sha1_update(ctx, &zero, 1);
    }
    sha1_update(ctx, finalcount, 8);

    for (int i = 0; i < 20; ++i) {
        digest[i] = (unsigned char)((ctx->state[i >> 2] >> ((3 - (i & 3)) * 8)) & 255);
    }
}

#define WS_GUID "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

int websocket_handshake(int fd) {
    char req[4096];
    int n = recv(fd, req, sizeof(req) - 1, 0);
    if (n <= 0) {
        fprintf(stderr, "[WS] handshake recv failed: %d\n", n);
        return -1;
    }
    req[n] = '\0';
    fprintf(stderr, "[WS] handshake request (%d bytes):\n%s\n", n, req);

    if (strncmp(req, "GET", 3) != 0) {
        fprintf(stderr, "[WS] not GET\n");
        return -1;
    }
    const char* key_hdr = "Sec-WebSocket-Key:";
    char* key_pos = strcasestr(req, key_hdr);
    if (!key_pos) {
        fprintf(stderr, "[WS] no Sec-WebSocket-Key\n");
        return -1;
    }
    key_pos += strlen(key_hdr);
    while (*key_pos == ' ' || *key_pos == '\t') key_pos++;
    char client_key[128] = {0};
    int i = 0;
    while (*key_pos && *key_pos != '\r' && *key_pos != '\n' && i < (int)sizeof(client_key) - 1) {
        client_key[i++] = *key_pos++;
    }
    client_key[i] = '\0';
    fprintf(stderr, "[WS] client_key: %s\n", client_key);
    if (client_key[0] == '\0') {
        fprintf(stderr, "[WS] empty key\n");
        return -1;
    }

    char concat[256];
    snprintf(concat, sizeof(concat), "%s%s", client_key, WS_GUID);

    unsigned char digest[20];
    sha1_ctx ctx;
    sha1_init(&ctx);
    sha1_update(&ctx, (const unsigned char*)concat, strlen(concat));
    sha1_final(&ctx, digest);

    char accept_b64[128];
    size_t enc_len = base64_encoded_size(20);
    if (enc_len + 1 > sizeof(accept_b64)) {
        fprintf(stderr, "[WS] b64 size too large\n");
        return -1;
    }
    base64_encode(digest, 20, accept_b64, sizeof(accept_b64));
    fprintf(stderr, "[WS] accept_b64: %s\n", accept_b64);

    char resp[512];
    int resp_len = snprintf(resp, sizeof(resp),
        "HTTP/1.1 101 Switching Protocols\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        "Sec-WebSocket-Accept: %s\r\n"
        "\r\n",
        accept_b64);
    fprintf(stderr, "[WS] handshake response (%d bytes):\n%s\n", resp_len, resp);
    if (resp_len <= 0 || resp_len >= (int)sizeof(resp)) {
        fprintf(stderr, "[WS] resp_len invalid\n");
        return -1;
    }
    int sent = send(fd, resp, resp_len, 0);
    fprintf(stderr, "[WS] send() returned %d (expected %d)\n", sent, resp_len);
    if (sent != resp_len) {
        fprintf(stderr, "[WS] send response failed: %s\n", strerror(errno));
        return -1;
    }
    fprintf(stderr, "[WS] handshake complete, socket fd=%d ready for frames\n", fd);
    return 0;
}

static int read_exact(int fd, void* buf, int len) {
    int got = 0;
    char* p = (char*)buf;
    while (got < len) {
        int n = recv(fd, p + got, len - got, 0);
        if (n < 0) {
            if (errno == EAGAIN || errno == EWOULDBLOCK || errno == EINTR) {
                // No data yet; wait a bit and retry (keep connection alive)
                usleep(10000);
                continue;
            }
            fprintf(stderr, "[IPC] read_exact: recv error at %d/%d bytes: %s\n", got, len, strerror(errno));
            return -1;
        }
        if (n == 0) {
            // Peer closed gracefully
            fprintf(stderr, "[IPC] read_exact: connection closed at %d/%d bytes\n", got, len);
            return -1;
        }
        got += n;
    }
    return got;
}

int websocket_recv_frame(int fd, char** payload, uint8_t* opcode) {
    unsigned char hdr[2];
    fprintf(stderr, "[WS] recv_frame: reading 2-byte header from fd=%d...\n", fd);
    if (read_exact(fd, hdr, 2) < 0) {
        fprintf(stderr, "[WS] recv_frame: FAILED to read header\n");
        return -1;
    }
    fprintf(stderr, "[WS] recv_frame: header OK (0x%02x 0x%02x)\n", hdr[0], hdr[1]);
    *opcode = hdr[0] & 0x0F;
    int masked = (hdr[1] & 0x80) != 0;
    uint64_t len = hdr[1] & 0x7F;
    fprintf(stderr, "[WS] recv_frame: opcode=0x%x masked=%d len=%lu\n", *opcode, masked, (unsigned long)len);
    if (len == 126) {
        unsigned char ext[2];
        if (read_exact(fd, ext, 2) < 0) return -1;
        len = (ext[0] << 8) | ext[1];
    } else if (len == 127) {
        unsigned char ext[8];
        if (read_exact(fd, ext, 8) < 0) return -1;
        len = ((uint64_t)ext[4] << 24) | ((uint64_t)ext[5] << 16) | ((uint64_t)ext[6] << 8) | ((uint64_t)ext[7]);
    }
    unsigned char mask[4] = {0};
    if (masked) {
        if (read_exact(fd, mask, 4) < 0) return -1;
    }
    if (len > 4 * 1024 * 1024) {
        fprintf(stderr, "[WS] recv_frame: payload too large %lu\n", (unsigned long)len);
        return -1;
    }
    fprintf(stderr, "[WS] recv_frame: allocating %lu bytes\n", (unsigned long)len);
    char* buf = (char*)malloc((size_t)len + 1);
    if (!buf) {
        fprintf(stderr, "[WS] recv_frame: malloc FAILED\n");
        return -1;
    }
    fprintf(stderr, "[WS] recv_frame: reading %lu bytes payload...\n", (unsigned long)len);
    if (read_exact(fd, buf, (int)len) < 0) {
        fprintf(stderr, "[WS] recv_frame: FAILED to read payload\n");
        free(buf);
        return -1;
    }
    fprintf(stderr, "[WS] recv_frame: payload OK\n");
    if (masked) {
        for (uint64_t i = 0; i < len; ++i) {
            buf[i] ^= mask[i % 4];
        }
    }
    buf[len] = '\0';
    *payload = buf;
    return (int)len;
}

static int websocket_send_frame(int fd, uint8_t opcode, const char* data, int len) {
    fprintf(stderr, "[WS] send_frame: fd=%d opcode=0x%x len=%d\n", fd, opcode, len);
    unsigned char header[10];
    int hlen = 0;
    header[hlen++] = 0x80 | (opcode & 0x0F);
    if (len <= 125) {
        header[hlen++] = (unsigned char)len;
    } else if (len <= 65535) {
        header[hlen++] = 126;
        header[hlen++] = (len >> 8) & 0xFF;
        header[hlen++] = len & 0xFF;
    } else {
        header[hlen++] = 127;
        header[hlen++] = 0; header[hlen++] = 0; header[hlen++] = 0; header[hlen++] = 0;
        header[hlen++] = (len >> 24) & 0xFF;
        header[hlen++] = (len >> 16) & 0xFF;
        header[hlen++] = (len >> 8) & 0xFF;
        header[hlen++] = len & 0xFF;
    }
    if (send(fd, header, hlen, 0) != hlen) {
        fprintf(stderr, "[WS] send_frame: FAILED to send header\n");
        return -1;
    }
    fprintf(stderr, "[WS] send_frame: header sent (%d bytes)\n", hlen);
    if (len > 0 && data) {
        if (send(fd, data, len, 0) != len) {
            fprintf(stderr, "[WS] send_frame: FAILED to send payload\n");
            return -1;
        }
        fprintf(stderr, "[WS] send_frame: payload sent (%d bytes)\n", len);
    }
    fprintf(stderr, "[WS] send_frame: COMPLETE\n");
    return 0;
}

int websocket_send_text(int fd, const char* data, int len) {
    if (len < 0) len = (int)strlen(data);
    return websocket_send_frame(fd, 0x1, data, len);
}

int websocket_send_pong(int fd, const char* data, int len) {
    return websocket_send_frame(fd, 0xA, data, len);
}

int websocket_send_close(int fd) {
    return websocket_send_frame(fd, 0x8, NULL, 0);
}
