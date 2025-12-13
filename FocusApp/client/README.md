# FocusApp Client - Desktop Study Timer

Desktop application built with C and TCP Sockets. This variant removes Webview and runs as a console client.

## Architecture

```
┌─────────────────────────────────────────┐
│           Webview Window                │
│   ┌─────────────────────────────────┐   │
│   │   HTML/CSS/JS UI                │   │
│   │   (from /UI folder)             │   │
│   │                                 │   │
│   │   Console actions:              │   │
│   │   - Login/Register              │   │
│   │   - Start/End session           │   │
│   │   - Send frame (from file)      │   │
│   └─────────────────────────────────┘   │
│                  ↕                       │
│   ┌─────────────────────────────────┐   │
│   │    Console Menu                 │   │
│   │  - stdin/stdout interaction     │   │
│   │  - menu-driven operations       │   │
│   └─────────────────────────────────┘   │
│                  ↕                       │
│   ┌─────────────────────────────────┐   │
│   │  Network Layer (network.c)      │   │
│   │  - TCP Socket to Server         │   │
│   │  - Winsock2 API                 │   │
│   │  - Custom binary protocol       │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                   ↕ TCP :8080
         ┌─────────────────────┐
         │   FocusApp Server   │
         │   (C Server)        │
         └─────────────────────┘
```

## Protocol

**Custom Binary Protocol:**
- **Header**: 8 bytes fixed
  - `int32 type`: Message type (see `common/protocol.h`)
  - `int32 length`: Payload length (0 to 2MB)
- **Payload**: Variable length data (JSON strings, base64 frames, etc.)

**Message Types:**
- `MSG_LOGIN_REQ` / `MSG_LOGIN_RES`: Authentication
- `MSG_REGISTER_REQ` / `MSG_REGISTER_RES`: User registration
- `MSG_STREAM_FRAME`: Camera frame (base64)
- `MSG_START_SESSION` / `MSG_END_SESSION`: Study session control
- `MSG_FOCUS_WARN`: Server warning (push notification)
- `MSG_UPDATE_FOCUS`: Focus score update (push)
- `MSG_UPDATE_COINS` / `MSG_UPDATE_STREAK`: Gamification (push)
- `MSG_GET_LEADERBOARD` / `MSG_RES_LEADERBOARD`: Rankings
- `MSG_GET_PROFILE` / `MSG_RES_PROFILE`: User stats

## Prerequisites

### Required Tools:
1. **MinGW-w64 GCC Compiler** (for Windows)
   ```powershell
   # Install via Chocolatey
   choco install mingw
   
   # Or download from: https://www.mingw-w64.org/
   ```

2. **Webview Library** (single-header)
   - Download `webview.h` from: https://github.com/webview/webview
   - Place in `FocusApp/client/` directory
   ```powershell
   # Download with PowerShell
   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/webview/webview/master/webview.h" -OutFile "client/webview.h"
   ```

3. **Server Running**
   - FocusApp Server must be running on `localhost:8080`
   - See `../server/README.md` for server setup

## Building

```powershell
cd FocusApp/client

# Build the executable
make

# Output: FocusApp.exe
```

**Compile Flags:**
- `-lws2_32`: Winsock2 library
- `-lole32 -loleaut32 -luuid`: COM libraries for Webview
- `-lgdi32 -lcomctl32`: Windows GUI libraries
- `-mwindows`: Hide console window (GUI mode)

## Running

```powershell
# Start the server first (in another terminal)
cd ../server
./FocusServer.exe

# Then run the client
cd ../client
./FocusApp.exe

# Or use Makefile:
make run
```

**Startup Flow:**
1. Client connects to `localhost:8080`
2. Webview window opens with Login page
3. User logs in → redirected to Study page
4. Background thread listens for server push messages

## Project Structure

```
FocusApp/
├── common/                # Shared code between Client & Server
│   ├── protocol.h         # Message types, packet structure
│   ├── config.h           # Configuration constants
│   └── utils.c            # Logging utilities
│
├── client/                # Client application
│   ├── main.c             # Entry point, Webview init
│   ├── bridge.c           # JS ↔ C binding layer
│   ├── bridge.h           # Bridge API
│   ├── network.c          # TCP socket communication
│   ├── network.h          # Network API
│   ├── webview.h          # Webview library (download required)
│   ├── Makefile           # Build script
│   └── README.md          # This file
│
└── (UI removed from client runtime; optional for future GUI)
```

## Console Operations

- Login/Register with username/password
- Start/End study session
- Send a frame by providing an image file path (encoded as base64 data URL)
- Get leaderboard and profile data

## Receiving Server Push Notifications

Server can send push messages (focus warnings, score updates, coins). The background receiver thread prints these to the console in real-time.

## Features

1. **Authentication**
   - Login/Register with username/password
   - Session management
   - Logout

2. **Pomodoro Timer**
   - 25-minute focus sessions
   - 5-minute breaks
   - Task list with localStorage

3. **Frame Streaming (Manual)**
  - Load image from disk (PNG/JPEG)
  - Base64 encoding and send as data URL
  - Useful for testing server pipeline without a GUI

4. **Focus Detection**
   - Server analyzes frames with ONNX model
   - Sends warnings if distracted
   - Updates focus score in real-time

5. **Gamification**
   - Earn coins for completed sessions
   - Daily streak tracking
   - Leaderboard rankings

6. **Profile**
   - View study history
   - Total focus time
   - Average focus score
   - Coins and pet status

## Troubleshooting

**Issue**: `webview.h not found`
- **Solution**: Download webview.h to `client/` directory

**Issue**: `cannot connect to server`
- **Solution**: Start server first with `./FocusServer.exe`

**Issue**: `undefined reference to 'pthread_create'`
- **Solution**: Add `-lpthread` to Makefile LDFLAGS

**Issue**: `UI not loading`
- **Solution**: Check file path in `main.c`, ensure UI folder is in correct location

**Issue**: `Camera not working`
- **Solution**: Check browser permissions, HTTPS required for getUserMedia() (use `file://` works in some browsers)

## Development

**Add new JS function:**
1. Add prototype to `bridge.h`
2. Implement in `bridge.c`
3. Register with `webview_bind()` in `bridge_register_callbacks()`
4. Call from JavaScript with `window.your_function(JSON.stringify(args))`

**Add new message type:**
1. Add enum to `common/protocol.h`
2. Add handler in `client/bridge.c` or receiver thread
3. Update server handler

**Debug logging:**
- Logs output to console
- Use `log_message("INFO", "message")` in C code
- Check `console.log()` in browser DevTools (right-click Webview → Inspect)

## License

Educational project for LTM course (Network Programming).

## Contact

For issues or questions, contact the development team.
