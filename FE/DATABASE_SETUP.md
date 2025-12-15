# Database Setup Guide

## Bước 1: Cài đặt Dependencies

```powershell
cd FE
npm install prisma @prisma/client bcryptjs
npm install -D @types/bcryptjs
```

## Bước 2: Cấu hình Database

Tạo file `.env.local` trong thư mục `FE`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/optimind?schema=public"
JWT_SECRET="your-secret-key-change-this-in-production"
```

**Chỉnh sửa DATABASE_URL:**
- `username`: PostgreSQL username của bạn
- `password`: PostgreSQL password 
- `localhost:5432`: Host và port của PostgreSQL
- `optimind`: Tên database (tạo database này trước)

## Bước 3: Tạo Database

Mở PostgreSQL và chạy:

```sql
CREATE DATABASE optimind;
```

## Bước 4: Chạy Migration

```powershell
# Generate Prisma Client
npx prisma generate

# Tạo và áp dụng migration
npx prisma migrate dev --name init

# Mở Prisma Studio để xem database (optional)
npx prisma studio
```

## Bước 5: Seed Database (Optional)

Tạo một số dữ liệu mẫu cho shop items:

```powershell
# Tạo file seed
New-Item -Path "prisma\seed.ts" -ItemType File
```

Thêm script vào `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Chạy seed:

```powershell
npm install -D ts-node
npx prisma db seed
```

## Bước 6: Upgrade Auth Security

### Cập nhật Signup Route

File: `app/api/auth/signup/route.ts`

```typescript
import bcrypt from 'bcryptjs';

// Thay đổi:
const passwordHash = await bcrypt.hash(password, 10);

const user = await prisma.user.create({
  data: {
    email,
    name,
    passwordHash, // thay vì password
  },
});
```

### Cập nhật Login Route

File: `app/api/auth/login/route.ts`

```typescript
import bcrypt from 'bcryptjs';

// Thay đổi:
const user = await prisma.user.findUnique({
  where: { email },
});

if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
```

## Bước 7: Implement JWT (Optional)

```powershell
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

Tạo JWT helper trong `lib/jwt.ts`:

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

export function signToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
```

## Bước 8: Test API

Khởi động server:

```powershell
npm run dev
```

Test endpoints với Postman hoặc curl:

```powershell
# Signup
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/signup" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@example.com","password":"password123"}'
```

## API Endpoints Đã Tạo

### Authentication
- `POST /api/auth/signup` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Study Sessions
- `POST /api/sessions` - Bắt đầu session
- `POST /api/sessions/[id]/focus-log` - Log focus data
- `PUT /api/sessions/[id]/end` - Kết thúc session
- `GET /api/sessions/history` - Lịch sử sessions
- `GET /api/sessions/analytics` - Thống kê học tập

### Tasks
- `GET /api/tasks` - Lấy danh sách tasks
- `POST /api/tasks` - Tạo task mới
- `PUT /api/tasks/[id]` - Cập nhật task
- `DELETE /api/tasks/[id]` - Xóa task

### Rooms
- `GET /api/rooms` - Danh sách rooms
- `POST /api/rooms` - Tạo room
- `GET /api/rooms/[id]` - Chi tiết room
- `POST /api/rooms/[id]/join` - Tham gia room

### Gamification
- `GET /api/gamification/pet` - Lấy thông tin pet
- `POST /api/gamification/pet/interact` - Tương tác với pet
- `GET /api/gamification/shop` - Danh sách shop items
- `POST /api/gamification/shop/buy` - Mua items
- `GET /api/gamification/inventory` - Inventory của user

### Social
- `GET /api/leaderboards` - Bảng xếp hạng
- `GET /api/friends` - Danh sách bạn bè
- `POST /api/friends` - Gửi lời mời kết bạn
- `PUT /api/friends/[id]` - Chấp nhận/từ chối lời mời
- `DELETE /api/friends/[id]` - Xóa bạn

### Messages
- `GET /api/messages?roomId=` - Lấy tin nhắn trong room
- `POST /api/messages` - Gửi tin nhắn

## Troubleshooting

### Lỗi "Can't reach database server"
- Kiểm tra PostgreSQL đang chạy
- Kiểm tra DATABASE_URL đúng
- Kiểm tra firewall không block port 5432

### Lỗi Migration
```powershell
# Reset database (XÓA HẾT DỮ LIỆU!)
npx prisma migrate reset

# Hoặc push schema không cần migration
npx prisma db push
```

### Lỗi Type Error
```powershell
# Regenerate Prisma Client
npx prisma generate
```

## Next Steps

1. Implement WebSocket cho real-time chat/rooms
2. Add rate limiting cho API routes
3. Add input validation với zod
4. Implement email verification
5. Add Redis cho caching
6. Deploy to production (Vercel + Supabase/Railway)
