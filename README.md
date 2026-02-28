# University Management System Backend

A production-ready Node.js + Express backend for a University Management System with comprehensive authentication, role-based access control, and MongoDB integration.

## Features

✅ **MVC Architecture** - Clean separation of concerns with controllers, models, routes  
✅ **MongoDB + Mongoose** - Robust database layer with schema validation  
✅ **JWT Authentication** - Secure token-based authentication  
✅ **Role-Based Access Control** - Admin, Faculty, and Student roles with permissions  
✅ **Password Security** - Bcrypt hashing for password encryption  
✅ **Error Handling** - Centralized error handling middleware  
✅ **Environment Configuration** - Dotenv for secure configuration management  
✅ **Security Headers** - Helmet for HTTP header security  
✅ **CORS** - Cross-origin requests handling  

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Token-based authentication
- **Bcryptjs** - Password hashing
- **Helmet** - Security middleware
- **CORS** - Cross-origin middleware
- **Dotenv** - Environment configuration

## Project Structure

```
ums-backend/
├── config/              # Configuration files
│   ├── database.js      # MongoDB connection
│   └── constants.js     # Application constants
├── controllers/         # Request handlers
│   ├── authController.js
│   └── userController.js
├── models/             # Database models
│   └── User.js
├── middleware/         # Custom middleware
│   ├── authMiddleware.js    # JWT verification
│   ├── errorHandler.js      # Error handling
│   └── roleMiddleware.js    # Role-based access
├── routes/            # API routes
│   ├── authRoutes.js
│   └── userRoutes.js
├── utils/             # Utility functions
│   ├── passwordUtils.js
│   └── tokenUtils.js
├── .env.example       # Environment variables template
├── .gitignore         # Git ignore file
├── app.js             # Express app setup
├── server.js          # Server entry point
├── package.json       # Dependencies
└── README.md          # This file
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Setup Steps

1. **Clone/Download the project**
   ```bash
   cd UMS\ WEBPAGE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file** from template
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   ```

4. **Configure environment variables**
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ums-db
   JWT_SECRET=your_secure_secret_key_here
   JWT_EXPIRE=7d
   ```

5. **Start the server**
   ```bash
   # Production
   npm start

   # Development with nodemon
   npm run dev
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "student",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "student",
      "createdAt": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <JWT_TOKEN>
```

### User Routes (`/api/users`)

#### Get All Users (Admin Only)
```http
GET /api/users
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

#### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <JWT_TOKEN>
```

#### Update User
```http
PATCH /api/users/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+0987654321",
  "department": "Computer Science"
}
```

#### Delete User (Admin Only)
```http
DELETE /api/users/:id
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

## User Roles & Permissions

### Admin
- Can manage all users
- Can read, create, update, delete all resources
- Can manage user roles and permissions

### Faculty
- Can read all resources
- Can create and update their own content
- Can view all students
- Cannot manage other faculty or admins

### Student
- Can read public resources
- Can only view their own profile
- Can only update their own information
- Cannot access admin or faculty-only endpoints

## Error Handling

The API uses a consistent error response format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Authentication

### How JWT Works

1. **Login** - User provides credentials
2. **Token Generation** - Server generates JWT token
3. **Token Storage** - Client stores token (localStorage, sessionStorage, or HttpOnly cookie)
4. **API Requests** - Client sends token in Authorization header
5. **Token Verification** - Server verifies token for protected routes

### Using the API with JWT

Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Password Security

- Passwords are hashed using bcryptjs with 10 salt rounds
- Passwords are never returned in API responses
- Passwords are selected explicitly using `.select('+password')` when needed
- Password validation is handled by Mongoose schema validators

## Database Schema

### User Model
```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  phone: String,
  role: String (admin, faculty, student),
  isActive: Boolean (default: true),
  lastLogin: Date,
  studentId: String (unique for students),
  facultyId: String (unique for faculty),
  department: String,
  timestamps: true (createdAt, updatedAt)
}
```

## Development Tips

### Using Postman

1. **Register** → Get token from response
2. **Copy token** → Use in Authorization header as `Bearer <token>`
3. **Make authenticated requests** with the token

### Debugging

Set `LOG_LEVEL=debug` in .env for detailed logging in development

### Testing Locally

```bash
# Use curl
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Or use Postman, Insomnia, etc.
```

## Security Best Practices

✅ Use HTTPS in production  
✅ Keep JWT_SECRET secure and unique  
✅ Regularly rotate JWT secrets  
✅ Use environment variables for sensitive data  
✅ Validate all user inputs  
✅ Implement rate limiting  
✅ Use CSRF protection  
✅ Keep dependencies updated  

## Future Enhancements

- [ ] Email verification
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] Refresh token mechanism
- [ ] Rate limiting
- [ ] Request logging and monitoring
- [ ] Unit and integration tests
- [ ] API documentation with Swagger
- [ ] Caching layer (Redis)
- [ ] Pagination and filtering

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running locally or connection string is correct
- Check `MONGODB_URI` in .env file
- Verify network connectivity for cloud databases

### JWT Token Errors
- Ensure `JWT_SECRET` is set in .env
- Check token expiration with JWT debugger
- Verify token format in Authorization header

### Port Already in Use
- Change `PORT` in .env file
- Or kill the process using the current port

## License

MIT License - Feel free to use this project for personal and commercial purposes.

## Support

For issues, questions, or suggestions, please create an issue in the repository.

---

**Built with ❤️ for University Management**
