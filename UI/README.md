# Optimind UI - Client-side HTML/CSS/JS

## Cấu trúc thư mục

```
UI/
├── home/           # Trang chủ
├── login/          # Đăng nhập
├── register/       # Đăng ký
├── chat/           # Chat với bạn bè
├── study/          # Phòng học với Pomodoro timer
├── tasks/          # Quản lý công việc (Kanban)
├── rooms/          # Danh sách phòng học nhóm
├── calendar/       # Lịch và kế hoạch học tập
├── gamification/   # Thú cưng và game hóa
├── profile/        # Hồ sơ người dùng
├── ranking/        # Bảng xếp hạng
├── history/        # Lịch sử học tập
├── setting/        # Cài đặt
└── test/           # Test mô hình ONNX
```

## Mỗi trang gồm 3 file:

- **index.html** - Cấu trúc trang
- **style.css** - Styles riêng cho trang
- **script.js** - Logic JavaScript

## Yêu cầu Backend (C)

Chương trình C của bạn cần cung cấp các endpoint sau trên `http://127.0.0.1:8080`:

### Authentication
- `POST /login` - Đăng nhập
  - Body: `{"email": "...", "password": "..."}`
  - Response: `{"user": {...}, "token": "..."}`

- `POST /signup` - Đăng ký
  - Body: `{"email": "...", "password": "...", "username": "..."}`
  - Response: `{"user": {...}}`

- `POST /logout` - Đăng xuất
  - Response: `{"success": true}`

- `GET /me` - Lấy thông tin user hiện tại
  - Headers: `Authorization: Bearer <token>`
  - Response: `{"user": {...}}`

### Các endpoint khác (tùy chọn):
- Chat: WebSocket hoặc REST API cho tin nhắn
- Rooms: CRUD operations cho phòng học
- Tasks: CRUD cho công việc
- Profile: Cập nhật thông tin user
- Ranking: Lấy bảng xếp hạng
- History: Lấy lịch sử học tập

## Cách chạy

1. **Khởi động backend C** của bạn trên cổng 8080
2. **Mở trình duyệt** và truy cập file HTML:
   ```
   file:///path/to/UI/home/index.html
   ```
   hoặc dùng một web server đơn giản:
   ```powershell
   # Python 3
   cd UI
   python -m http.server 3000
   ```
   Sau đó truy cập: `http://localhost:3000/home/`

## File ONNX Model

Trang **test** cần file mô hình ONNX:
- Copy file `best_engagement_model.onnx` vào thư mục `public/` của dự án gốc
- Hoặc đặt đường dẫn tuyệt đối trong `UI/test/script.js` (biến `MODEL_PATH`)

## Navigation

Tất cả các trang đều có header navigation giống nhau để di chuyển giữa các trang.

## Mock Data

Hiện tại các trang đang sử dụng dữ liệu giả (mock data) từ Next.js project. Bạn cần:
1. Thay thế các `fetch()` call trong `script.js` để gọi backend C
2. Cập nhật localStorage logic nếu cần lưu trữ phía client
3. Implement WebSocket cho real-time features (chat, rooms)

## Browser Support

- Chrome/Edge (khuyến nghị)
- Firefox
- Safari (có thể cần điều chỉnh CSS)

## Notes

- CORS: Backend C phải cho phép CORS từ origin của frontend
- LocalStorage: Token được lưu trong `localStorage.auth_token`
- Camera/Mic: Trang test và rooms cần quyền truy cập thiết bị