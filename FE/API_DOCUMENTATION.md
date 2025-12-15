# API Documentation

## Authentication

### Signup
```
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

Response: 200 OK
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "level": 1,
    "coins": 100
  }
}
```

### Logout
```
POST /api/auth/logout

Response: 200 OK
{
  "message": "Logged out"
}
```

### Get Current User
```
GET /api/auth/me

Response: 200 OK
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "level": 5,
    "exp": 250,
    "coins": 500
  }
}
```

---

## Study Sessions

### Start Session
```
POST /api/sessions
Content-Type: application/json

{
  "duration": 3600,
  "tags": ["math", "homework"]
}

Response: 200 OK
{
  "session": {
    "id": "uuid",
    "userId": "uuid",
    "startTime": "2024-01-01T10:00:00Z",
    "duration": 3600,
    "tags": ["math", "homework"]
  }
}
```

### Log Focus Data
```
POST /api/sessions/{sessionId}/focus-log
Content-Type: application/json

{
  "focusScore": 85,
  "distractionCount": 2
}

Response: 200 OK
{
  "log": {
    "id": "uuid",
    "sessionId": "uuid",
    "timestamp": "2024-01-01T10:30:00Z",
    "focusScore": 85,
    "distractionCount": 2
  }
}
```

### End Session
```
PUT /api/sessions/{sessionId}/end

Response: 200 OK
{
  "session": {
    "id": "uuid",
    "endTime": "2024-01-01T11:00:00Z",
    "focusScore": 82,
    "coinsEarned": 120,
    "expEarned": 82
  },
  "user": {
    "coins": 620,
    "level": 5,
    "exp": 332
  }
}
```

### Get Session History
```
GET /api/sessions/history?limit=10&offset=0

Response: 200 OK
{
  "sessions": [
    {
      "id": "uuid",
      "startTime": "2024-01-01T10:00:00Z",
      "endTime": "2024-01-01T11:00:00Z",
      "duration": 3600,
      "focusScore": 82,
      "coinsEarned": 120,
      "expEarned": 82
    }
  ]
}
```

### Get Analytics
```
GET /api/sessions/analytics?startDate=2024-01-01&endDate=2024-01-31

Response: 200 OK
{
  "totalSessions": 20,
  "totalMinutes": 1200,
  "averageFocusScore": 78,
  "coinsEarned": 2400,
  "expEarned": 1560,
  "byDate": {
    "2024-01-01": {
      "sessions": 2,
      "minutes": 120,
      "avgFocus": 80
    }
  }
}
```

---

## Tasks

### Get Tasks
```
GET /api/tasks?status=todo&date=2024-01-01

Response: 200 OK
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Complete homework",
      "description": "Math exercises",
      "status": "todo",
      "priority": "high",
      "dueDate": "2024-01-02T00:00:00Z",
      "tags": ["math", "homework"]
    }
  ]
}
```

### Create Task
```
POST /api/tasks
Content-Type: application/json

{
  "title": "Study for exam",
  "description": "Review chapters 1-5",
  "priority": "high",
  "dueDate": "2024-01-15T00:00:00Z",
  "tags": ["exam", "review"]
}

Response: 200 OK
{
  "task": {
    "id": "uuid",
    "title": "Study for exam",
    "status": "todo",
    "priority": "high",
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

### Update Task
```
PUT /api/tasks/{taskId}
Content-Type: application/json

{
  "status": "completed",
  "completedAt": "2024-01-02T10:00:00Z"
}

Response: 200 OK
{
  "task": {
    "id": "uuid",
    "title": "Study for exam",
    "status": "completed",
    "completedAt": "2024-01-02T10:00:00Z"
  }
}
```

### Delete Task
```
DELETE /api/tasks/{taskId}

Response: 200 OK
{
  "message": "Task deleted"
}
```

---

## Rooms

### Get Rooms
```
GET /api/rooms?type=study&isPublic=true

Response: 200 OK
{
  "rooms": [
    {
      "id": "uuid",
      "name": "Study Group",
      "description": "Join us for focused studying",
      "type": "study",
      "isPublic": true,
      "currentMembers": 5,
      "maxMembers": 10
    }
  ]
}
```

### Create Room
```
POST /api/rooms
Content-Type: application/json

{
  "name": "Math Study Session",
  "description": "Let's study math together",
  "type": "study",
  "maxMembers": 8,
  "isPublic": true,
  "password": "optional-password"
}

Response: 200 OK
{
  "room": {
    "id": "uuid",
    "name": "Math Study Session",
    "creatorId": "uuid",
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

### Get Room Details
```
GET /api/rooms/{roomId}

Response: 200 OK
{
  "room": {
    "id": "uuid",
    "name": "Math Study Session",
    "members": [
      {
        "user": {
          "id": "uuid",
          "name": "John Doe",
          "level": 5
        },
        "role": "admin",
        "joinedAt": "2024-01-01T10:00:00Z"
      }
    ],
    "messages": [
      {
        "id": "uuid",
        "content": "Hello!",
        "user": {
          "name": "John Doe",
          "avatar": "url"
        },
        "createdAt": "2024-01-01T10:05:00Z"
      }
    ]
  }
}
```

### Join Room
```
POST /api/rooms/{roomId}/join
Content-Type: application/json

{
  "password": "optional-password"
}

Response: 200 OK
{
  "member": {
    "roomId": "uuid",
    "userId": "uuid",
    "role": "member",
    "joinedAt": "2024-01-01T10:10:00Z"
  }
}
```

---

## Gamification

### Get Pet
```
GET /api/gamification/pet

Response: 200 OK
{
  "pet": {
    "id": "uuid",
    "name": "Buddy",
    "type": "dog",
    "hunger": 80,
    "happiness": 90,
    "energy": 70,
    "lastFed": "2024-01-01T09:00:00Z"
  }
}
```

### Interact with Pet
```
POST /api/gamification/pet/interact
Content-Type: application/json

{
  "action": "feed",
  "itemId": "uuid"
}

Response: 200 OK
{
  "pet": {
    "id": "uuid",
    "hunger": 100,
    "happiness": 90,
    "energy": 70,
    "lastFed": "2024-01-01T10:00:00Z"
  }
}
```

### Get Shop Items
```
GET /api/gamification/shop?category=food

Response: 200 OK
{
  "items": [
    {
      "id": "uuid",
      "name": "Apple",
      "description": "A fresh apple",
      "price": 10,
      "category": "food",
      "imageUrl": "/items/apple.png"
    }
  ]
}
```

### Buy Item
```
POST /api/gamification/shop/buy
Content-Type: application/json

{
  "itemId": "uuid",
  "quantity": 2
}

Response: 200 OK
{
  "message": "Purchase successful",
  "inventory": {
    "id": "uuid",
    "itemId": "uuid",
    "quantity": 2
  },
  "balance": 480
}
```

### Get Inventory
```
GET /api/gamification/inventory

Response: 200 OK
{
  "inventory": [
    {
      "id": "uuid",
      "quantity": 3,
      "acquiredAt": "2024-01-01T10:00:00Z",
      "item": {
        "id": "uuid",
        "name": "Apple",
        "category": "food",
        "imageUrl": "/items/apple.png"
      }
    }
  ]
}
```

---

## Social & Leaderboards

### Get Leaderboard
```
GET /api/leaderboards?type=global&limit=50

Response: 200 OK
{
  "leaderboard": [
    {
      "rank": 1,
      "id": "uuid",
      "name": "Top Player",
      "level": 10,
      "exp": 1500,
      "coins": 5000,
      "avatar": "url"
    }
  ]
}
```

### Get Friends
```
GET /api/friends?status=accepted

Response: 200 OK
{
  "friends": [
    {
      "id": "uuid",
      "status": "accepted",
      "createdAt": "2024-01-01T10:00:00Z",
      "friend": {
        "id": "uuid",
        "name": "Jane Doe",
        "level": 8,
        "avatar": "url"
      },
      "isRequester": true
    }
  ]
}
```

### Send Friend Request
```
POST /api/friends
Content-Type: application/json

{
  "friendId": "uuid"
}

Response: 200 OK
{
  "friendship": {
    "id": "uuid",
    "status": "pending",
    "createdAt": "2024-01-01T10:00:00Z",
    "friend": {
      "id": "uuid",
      "name": "Jane Doe"
    }
  }
}
```

### Accept/Reject Friend Request
```
PUT /api/friends/{friendshipId}
Content-Type: application/json

{
  "action": "accept"
}

Response: 200 OK
{
  "friendship": {
    "id": "uuid",
    "status": "accepted"
  }
}
```

### Remove Friend
```
DELETE /api/friends/{friendshipId}

Response: 200 OK
{
  "message": "Friend removed"
}
```

---

## Messages

### Get Messages
```
GET /api/messages?roomId=uuid&limit=50

Response: 200 OK
{
  "messages": [
    {
      "id": "uuid",
      "content": "Hello everyone!",
      "createdAt": "2024-01-01T10:00:00Z",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "avatar": "url"
      }
    }
  ]
}
```

### Send Message
```
POST /api/messages
Content-Type: application/json

{
  "roomId": "uuid",
  "content": "Hello world!"
}

Response: 200 OK
{
  "message": {
    "id": "uuid",
    "content": "Hello world!",
    "createdAt": "2024-01-01T10:00:00Z",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "avatar": "url"
    }
  }
}
```

---

## Error Responses

All endpoints may return these error responses:

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 403 Forbidden
```json
{
  "error": "Permission denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Server error message"
}
```

---

## Authentication

All API routes (except `/api/auth/*`) require authentication via cookies. The login endpoint sets httpOnly cookies that are automatically sent with subsequent requests.

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting in production.

## CORS

API routes are configured to work with same-origin requests. For cross-origin requests, configure CORS in `next.config.ts`.
