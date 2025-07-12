# Skill Swap Platform - Backend

A robust backend API for the Skill Swap Platform built with Node.js, Express, and MySQL.

## Features

- **User Management**: Registration, authentication, profile management
- **Skill Swapping**: Create, manage, and track skill exchange requests
- **Feedback System**: Rate and review completed swaps
- **Admin Panel**: User moderation, analytics, and platform management
- **Notifications**: Real-time updates for user activities
- **Security**: JWT authentication, rate limiting, input validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT tokens
- **Security**: Helmet, CORS, Rate limiting
- **Validation**: Sequelize validators

## Project Structure

```
skill-swap-backend/
├── config/
│   └── database.js        # Database configuration
├── controllers/           # Request handlers
│   ├── authController.js
│   ├── userController.js
│   ├── swapController.js
│   └── feedbackController.js
├── middleware/
│   └── authMiddleware.js  # Authentication & authorization
├── models/                # Database models
│   ├── User.js
│   ├── Swap.js
│   ├── Feedback.js
│   ├── Notification.js
│   └── index.js
├── routes/                # API routes
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── swapRoutes.js
│   ├── feedbackRoutes.js
│   ├── adminRoutes.js
│   └── notificationRoutes.js
├── .env                   # Environment variables
├── server.js              # Main server file
└── package.json
```

## Installation

1. **Clone the repository**
   ```bash
   cd skill-swap-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env` file and update with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   
   # Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=skill_swap_db
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   
   # JWT
   JWT_SECRET=your_jwt_secret_key
   
   # Admin
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=admin123
   ```

4. **Set up MySQL database**
   ```sql
   CREATE DATABASE skill_swap_db;
   ```

   See `MYSQL-SETUP.md` for detailed MySQL installation guide.

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password

### Users (`/api/users`)
- `GET /` - Get all users (with search/filter)
- `GET /search` - Search users by skills
- `GET /:id` - Get user by ID
- `PUT /:id/ban` - Ban/unban user (admin)
- `GET /admin/stats` - User statistics (admin)

### Swaps (`/api/swaps`)
- `POST /` - Create swap request
- `GET /my-swaps` - Get user's swaps
- `GET /:id` - Get swap details
- `PUT /:id/status` - Accept/reject swap
- `PUT /:id/cancel` - Cancel swap
- `PUT /:id/complete` - Mark swap as completed
- `GET /admin/all` - All swaps (admin)

### Feedback (`/api/feedback`)
- `POST /` - Create feedback
- `GET /user/:userId` - Get user's received feedback
- `GET /by-user/:userId` - Get user's given feedback
- `PUT /:id` - Update feedback
- `DELETE /:id` - Delete feedback
- `GET /admin/stats` - Feedback statistics (admin)

### Notifications (`/api/notifications`)
- `GET /` - Get user notifications
- `PUT /:id/read` - Mark notification as read
- `PUT /mark-all-read` - Mark all as read
- `GET /unread-count` - Get unread count
- `DELETE /:id` - Delete notification

### Admin (`/api/admin`)
- `GET /dashboard` - Dashboard statistics
- `POST /notifications/broadcast` - Send platform notification
- `GET /reports/users` - User reports
- `GET /reports/swaps` - Swap reports
- `GET /reports/feedback` - Feedback reports
- `PUT /moderate/user/:id` - Moderate user

## Database Schema

### Users
- id (UUID, Primary Key)
- name, email, hashedPassword
- location, avatarURL, bio
- skillsOffered[], skillsWanted[]
- availability, isPublic, isBanned, isAdmin
- rating, totalRatings

### Swaps
- id (UUID, Primary Key)
- requesterId, recipientId (Foreign Keys)
- requesterSkill, recipientSkill
- status (pending/accepted/rejected/cancelled/completed)
- message, scheduledDate, duration, notes

### Feedback
- id (UUID, Primary Key)
- swapId, raterId, ratedUserId (Foreign Keys)
- rating (1-5), comment, isPublic

### Notifications
- id (UUID, Primary Key)
- userId (Foreign Key, nullable for platform-wide)
- message, type, isRead, relatedId, priority

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Rate Limiting**: Express-rate-limit for API protection
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **Input Validation**: Sequelize model validation

## Development

```bash
# Install development dependencies
npm install --include=dev

# Run in development mode
npm run dev

# Database reset (development only)
# Set force: true in sequelize.sync() in server.js
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| NODE_ENV | Environment (development/production) | No |
| PORT | Server port | No (default: 5000) |
| DB_HOST | Database host | Yes |
| DB_PORT | Database port | Yes |
| DB_NAME | Database name | Yes |
| DB_USER | Database user | Yes |
| DB_PASSWORD | Database password | Yes |
| JWT_SECRET | JWT signing secret | Yes |
| ADMIN_EMAIL | Admin user email | No |
| ADMIN_PASSWORD | Admin user password | No |
| FRONTEND_URL | Frontend URL for CORS | No |

## Error Handling

The API includes comprehensive error handling:
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)

All responses follow this format:
```json
{
  "success": boolean,
  "message": "string",
  "data": object (optional),
  "errors": array (optional)
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.
