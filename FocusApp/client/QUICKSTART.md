# Quick Start Guide - FocusApp Client

## Step 1: Prerequisites

- Windows 10/11
- MinGW-w64 (gcc, make) in PATH
- Git (optional)

## Step 2: Verify File Structure

Ensure you have:
```
FocusApp/
├── common/
│   ├── protocol.h
│   ├── config.h
│   └── utils.c
├── client/
│   ├── main.c
│   ├── base64.c
│   ├── base64.h
│   ├── network.c
│   ├── network.h
│   └── Makefile
└── UI/
    ├── login/
    ├── study/
    └── ...
```

## Step 3: Build

```powershell
# In FocusApp/client directory
make clean
make

# Expected output: FocusApp.exe
```

## Step 4: Start Server

```powershell
# Open new terminal
cd FocusApp/server
./FocusServer.exe

# Wait for: "Server listening on port 8080"
```

## Step 5: Run Client

```powershell
# Back to client terminal
cd FocusApp/client
./FocusApp.exe

# A console menu will appear
```

## Step 6: Test

1. Register a new account
2. Login with credentials
3. Start session
4. Send a test frame (choose an image file path)
5. Observe server push messages (focus warnings, updates)

## Common Issues

### 1. pthread not found / link errors
- Ensure MinGW provides pthread. The Makefile links `-lpthread`.

### 2. `cannot connect to localhost:8080`
- Start server first: `cd server; ./FocusServer.exe`
- Check firewall: Allow port 8080

### 3. `undefined reference to WSAStartup`
- Add `-lws2_32` to Makefile (already included)
- Verify MinGW installation: `gcc --version`

### 4. Sending frames from file fails
- Verify the file path is correct and accessible
- Try with a small JPEG/PNG image

## Architecture Flow

```
[User] → [Console Menu] → [Network] → [Server]
                 ↓
             TCP Socket

Push Notifications:
[Server] → [Network Receiver Thread] → [Console Output]
```

## Next Steps

- Implement Server (see `../server/README.md`)
- Add ONNX model integration for focus detection
- Implement file-based storage (users.txt, history.txt)
- Add threading for concurrent client handling

## Build Options

```powershell
# Clean build
make clean

# Build with debug symbols
make CFLAGS="-g -DDEBUG"

# Build and run
make run

# Show help
make help
```

## Environment

- **OS**: Windows 10/11
- **Compiler**: MinGW-w64 GCC 8.1.0+
- **Shell**: PowerShell 5.1
- **Networking**: Winsock2 (Windows Sockets API)
 - **UI**: Console (no Webview)

## Testing Checklist

- [ ] Client connects to server on startup
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials fails
- [ ] Register new user creates account
- [ ] Start session sends `MSG_START_SESSION`
- [ ] Can send a frame from file
- [ ] Server warnings appear in console
- [ ] End session calculates stats
- [ ] Leaderboard loads top users
- [ ] Profile shows user data
- [ ] Logout disconnects socket

## Performance Notes

- **Latency**: ~10-50ms (localhost TCP)
- **Frame Size**: ~50-200KB (base64 JPEG)
- **CPU Usage**: ~5-15% (encoding + socket I/O)
- **Memory**: ~20-50MB (Webview + network buffers)

## Security Considerations

- **No encryption**: TCP plaintext (OK for localhost)
- **Password storage**: Server hashes with bcrypt (TODO)
- **Injection**: Payload sanitization required (TODO)
- **DoS**: Rate limiting on server (TODO)

For production deployment, implement TLS/SSL and proper authentication.
