# Skill Swap Platform API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

Most endpoints require authentication via JWT tokens in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Response Format

All API responses follow this format:
```json
{
  "success": boolean,
  "message": "string",
  "data": object (optional),
  "errors": array (optional)
}
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "location": "New York, NY",
  "skillsOffered": ["JavaScript", "React"],
  "skillsWanted": ["Python", "Django"],
  "availability": "Weekends",
  "bio": "Software developer passionate about learning new skills"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      ...
    }
  }
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET /auth/profile
Get current user profile. Requires authentication.

#### PUT /auth/profile
Update user profile. Requires authentication.

**Request Body:**
```json
{
  "name": "John Smith",
  "location": "Los Angeles, CA",
  "skillsOffered": ["JavaScript", "React", "Node.js"],
  "skillsWanted": ["Python", "Django", "Machine Learning"],
  "availability": "Evenings and weekends",
  "bio": "Updated bio",
  "isPublic": true
}
```

#### PUT /auth/change-password
Change user password. Requires authentication.

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Users

#### GET /users
Get all public users with optional search and filtering.

**Query Parameters:**
- `search` - Search in name or bio
- `skill` - Filter by skill (offered or wanted)
- `location` - Filter by location
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Example:** `/users?search=javascript&page=1&limit=10`

#### GET /users/search
Search users by specific skills.

**Query Parameters:**
- `skill` - Required. Skill to search for
- `type` - "offered" or "wanted" (default: "offered")

**Example:** `/users/search?skill=React&type=offered`

#### GET /users/:id
Get user profile by ID.

### Swaps

#### POST /swaps
Create a new swap request. Requires authentication.

**Request Body:**
```json
{
  "recipientId": "uuid",
  "requesterSkill": "JavaScript",
  "recipientSkill": "Python",
  "message": "I'd love to learn Python from you!",
  "scheduledDate": "2024-02-15T14:00:00.000Z",
  "duration": 120
}
```

#### GET /swaps/my-swaps
Get current user's swaps. Requires authentication.

**Query Parameters:**
- `status` - Filter by status: pending, accepted, rejected, cancelled, completed
- `type` - Filter by type: sent, received, all (default: all)
- `page` - Page number
- `limit` - Items per page

#### GET /swaps/:id
Get swap details by ID. Requires authentication.

#### PUT /swaps/:id/status
Accept or reject a swap request. Requires authentication (recipient only).

**Request Body:**
```json
{
  "status": "accepted", // or "rejected"
  "notes": "Looking forward to our session!"
}
```

#### PUT /swaps/:id/cancel
Cancel a pending swap request. Requires authentication (requester only).

#### PUT /swaps/:id/complete
Mark an accepted swap as completed. Requires authentication.

### Feedback

#### POST /feedback
Create feedback for a completed swap. Requires authentication.

**Request Body:**
```json
{
  "swapId": "uuid",
  "rating": 5,
  "comment": "Great session! John is an excellent teacher.",
  "isPublic": true
}
```

#### GET /feedback/user/:userId
Get feedback received by a user.

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page

#### GET /feedback/by-user/:userId
Get feedback given by a user. Requires authentication.

#### PUT /feedback/:id
Update feedback. Requires authentication (original author only).

#### DELETE /feedback/:id
Delete feedback. Requires authentication (original author or admin).

### Notifications

#### GET /notifications
Get user notifications. Requires authentication.

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `unreadOnly` - true/false (default: false)

#### PUT /notifications/:id/read
Mark notification as read. Requires authentication.

#### PUT /notifications/mark-all-read
Mark all notifications as read. Requires authentication.

#### GET /notifications/unread-count
Get count of unread notifications. Requires authentication.

#### DELETE /notifications/:id
Delete a personal notification. Requires authentication.

### Admin (Requires Admin Role)

#### GET /admin/dashboard
Get admin dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 150,
      "active": 145,
      "banned": 5,
      "newThisMonth": 23
    },
    "swaps": {
      "total": 89,
      "pending": 12,
      "accepted": 34,
      "completed": 31,
      "thisMonth": 15
    },
    "feedback": {
      "total": 67,
      "thisMonth": 8
    }
  }
}
```

#### POST /admin/notifications/broadcast
Send platform-wide notification.

**Request Body:**
```json
{
  "message": "Platform maintenance scheduled for tonight.",
  "type": "platform_update"
}
```

#### GET /admin/reports/users
Export user data for reports.

#### GET /admin/reports/swaps
Export swap data for reports.

#### GET /admin/reports/feedback
Export feedback data for reports.

#### PUT /admin/moderate/user/:id
Moderate a user (warn, ban, unban).

**Request Body:**
```json
{
  "action": "ban", // "warn", "ban", "unban"
  "reason": "Inappropriate skill descriptions"
}
```

#### PUT /users/:id/ban
Ban or unban a user. (Admin only)

**Request Body:**
```json
{
  "banned": true,
  "reason": "Violation of terms"
}
```

#### GET /users/admin/stats
Get user statistics. (Admin only)

#### GET /swaps/admin/all
Get all swaps. (Admin only)

#### GET /feedback/admin/stats
Get feedback statistics. (Admin only)

## Error Codes

- `400` - Bad Request (validation errors, invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limits

- General API: 100 requests per 15 minutes per IP
- Authentication endpoints: 5 requests per 15 minutes per IP

## Example Usage

### Complete User Flow

1. **Register**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Smith",
    "email": "alice@example.com",
    "password": "password123",
    "skillsOffered": ["React", "JavaScript"],
    "skillsWanted": ["Python", "Data Science"]
  }'
```

2. **Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

3. **Search for users with Python skills**
```bash
curl -X GET "http://localhost:5000/api/users/search?skill=Python&type=offered" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

4. **Create swap request**
```bash
curl -X POST http://localhost:5000/api/swaps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "recipientId": "recipient-user-id",
    "requesterSkill": "React",
    "recipientSkill": "Python",
    "message": "Would love to learn Python from you!"
  }'
```

5. **Accept swap (as recipient)**
```bash
curl -X PUT http://localhost:5000/api/swaps/SWAP_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "accepted",
    "notes": "Sounds great! Looking forward to it."
  }'
```

6. **Complete swap**
```bash
curl -X PUT http://localhost:5000/api/swaps/SWAP_ID/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

7. **Leave feedback**
```bash
curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "swapId": "SWAP_ID",
    "rating": 5,
    "comment": "Excellent teacher! Very patient and knowledgeable."
  }'
```

## Postman Collection

For easier testing, you can create a Postman collection with these endpoints. Remember to:

1. Set up environment variables for `baseUrl` and `authToken`
2. Use the auth token from login response in subsequent requests
3. Test the complete user flow from registration to feedback

## Database Schema Reference

### User Model
```javascript
{
  id: UUID (Primary Key),
  name: String (required),
  email: String (required, unique),
  hashedPassword: String (required),
  location: String (optional),
  avatarURL: String (optional),
  skillsOffered: Array of Strings,
  skillsWanted: Array of Strings,
  availability: String (optional),
  isPublic: Boolean (default: true),
  isBanned: Boolean (default: false),
  isAdmin: Boolean (default: false),
  bio: Text (optional),
  rating: Decimal (0-5),
  totalRatings: Integer,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Swap Model
```javascript
{
  id: UUID (Primary Key),
  requesterId: UUID (Foreign Key to User),
  recipientId: UUID (Foreign Key to User),
  status: Enum (pending, accepted, rejected, cancelled, completed),
  requesterSkill: String (required),
  recipientSkill: String (required),
  message: Text (optional),
  scheduledDate: DateTime (optional),
  duration: Integer (minutes, optional),
  notes: Text (optional),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Feedback Model
```javascript
{
  id: UUID (Primary Key),
  swapId: UUID (Foreign Key to Swap),
  raterId: UUID (Foreign Key to User),
  ratedUserId: UUID (Foreign Key to User),
  rating: Integer (1-5, required),
  comment: Text (optional),
  isPublic: Boolean (default: true),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Notification Model
```javascript
{
  id: UUID (Primary Key),
  userId: UUID (Foreign Key to User, nullable for platform-wide),
  message: Text (required),
  type: Enum (swap_request, swap_accepted, swap_rejected, feedback_received, platform_update, system_alert),
  isRead: Boolean (default: false),
  relatedId: UUID (optional),
  priority: Enum (low, medium, high),
  createdAt: DateTime,
  updatedAt: DateTime
}
```
