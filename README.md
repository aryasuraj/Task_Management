# Task Management API

A comprehensive RESTful API for a task management system built with Node.js, Express, and MongoDB.

## Features

- ✅ User Authentication (Register, Login, Logout)
- ✅ Role-Based Access Control (Admin, Manager, User)
- ✅ Task Management (CRUD operations)
- ✅ Task Assignment
- ✅ Real-time Updates (WebSocket)
- ✅ Analytics & Statistics
- ✅ Caching (Redis)
- ✅ Rate Limiting
- ✅ Search & Filtering
- ✅ API Documentation (Swagger/OpenAPI)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- Redis (Optional, for caching)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Task
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/task_management
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
REDIS_HOST=localhost
REDIS_PORT=6379
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:4000
```

4. Start MongoDB and Redis (if using):
```bash
# MongoDB
mongod

# Redis (optional)
redis-server
```

5. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:4000`

## API Documentation

Once the server is running, access the interactive API documentation at:
- Swagger UI: `http://localhost:4000/api-docs`
- OpenAPI JSON: `http://localhost:4000/api-docs.json`

## API Endpoints

### Authentication
- `POST /api/v1/user/signup` - Register a new user
- `POST /api/v1/user/login` - Login user
- `POST /api/v1/user/logout` - Logout user

### Users
- `GET /api/v1/user/user-profile` - Get user profile
- `PUT /api/v1/user/update-user-profile` - Update user profile
- `GET /api/v1/user/get-all-users` - Get all users (Admin/Manager only)

### Tasks
- `POST /api/v1/user/create-task` - Create a new task
- `GET /api/v1/user/get-tasks` - Get all tasks (with filtering, sorting, pagination)
- `GET /api/v1/user/get-task-by-id` - Get a single task
- `PUT /api/v1/user/update-task` - Update a task
- `DELETE /api/v1/user/delete-task` - Delete a task

### Assignments
- `POST /api/v1/user/assign-task` - Assign a task to a user
- `PUT /api/v1/user/update-assignment` - Update task assignment
- `GET /api/v1/user/get-assigned-tasks` - Get assigned tasks

### Analytics
- `GET /api/v1/user/get-task-analytics` - Get task analytics
- `GET /api/v1/user/get-user-statistics` - Get user statistics
- `GET /api/v1/user/get-team-statistics` - Get team statistics

## Usage Examples

### Register a User
```bash
curl -X POST http://localhost:4000/api/v1/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Create a Task
```bash
curl -X POST http://localhost:4000/api/v1/user/create-task \
  -H "Content-Type: application/json" \
  -H "authorization: YOUR_JWT_TOKEN" \
  -d '{
    "title": "Complete API Documentation",
    "description": "Write comprehensive API documentation",
    "dueDate": "2024-12-31T23:59:59Z",
    "priority": "high",
    "status": "pending"
  }'
```

## Role-Based Access Control

- **Admin**: Full access to all endpoints
- **Manager**: Can manage tasks and view users within their team
- **User**: Can manage their own tasks and view their profile

## Real-time Updates

The API uses WebSocket (Socket.io) for real-time updates. Connect to the server and join user-specific rooms to receive updates about task assignments and changes.

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "code": 400,
  "message": "Error message"
}
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on login endpoint
- Helmet.js for security headers
- CORS configuration
- Input validation

## Testing

Run tests (when implemented):
```bash
npm test
```

## Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure MongoDB Atlas or a production MongoDB instance
4. Set up Redis for caching
5. Configure email service
6. Deploy to cloud provider (Heroku, AWS, GCP, etc.)

## License

ISC

## Author

Suraj Arya
