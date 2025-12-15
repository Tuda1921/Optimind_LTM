#ifndef IPC_H
#define IPC_H

#include "network.h"

#define IPC_PORT 9000
#define IPC_MAX_CLIENTS 16

int ipc_start(NetworkState* net);
void ipc_stop();
void ipc_broadcast_event(const char* event, const char* data_json);

#endif
