# FitTrack Pro - Backend API

A comprehensive fitness tracking application backend built with Node.js, Express, and MongoDB. This API powers the FitTrack Pro web application, providing user authentication, workout tracking, progress analytics, and measurement management.

## Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Secure password hashing
  - User registration and login
  - Password reset functionality

- **Workout Management**
  - Create, read, update, delete workouts
  - Exercise tracking with sets, reps, and weights
  - Workout duration and volume calculations
  - Personal record tracking

- **Progress Analytics**
  - Real-time workout statistics
  - Progress tracking over time
  - Performance insights and trends
  - Goal setting and monitoring

- **User Profile Management**
  - Personal information management
  - Fitness level tracking
  - Goal setting and preferences
  - Body measurements tracking

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt for password hashing
- **Validation**: Express validator
- **Environment**: dotenv for configuration

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/salmadardour/Fittrack-pro-backend.git
   cd Fittrack-pro-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/fittrack-pro
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=30d
   JWT_COOKIE_EXPIRE=30
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/forgot-password` - Password reset request
- `PUT /api/v1/auth/reset-password/:token` - Reset password

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `PUT /api/v1/users/password` - Change password

### Workouts
- `GET /api/v1/workouts` - Get user workouts
- `POST /api/v1/workouts` - Create new workout
- `GET /api/v1/workouts/:id` - Get specific workout
- `PUT /api/v1/workouts/:id` - Update workout
- `DELETE /api/v1/workouts/:id` - Delete workout

### Analytics
- `GET /api/v1/analytics/stats` - Get workout statistics
- `GET /api/v1/analytics/progress` - Get progress data
- `GET /api/v1/analytics/records` - Get personal records

### Measurements
- `GET /api/v1/measurements` - Get user measurements
- `POST /api/v1/measurements` - Add new measurement
- `PUT /api/v1/measurements/:id` - Update measurement
- `DELETE /api/v1/measurements/:id` - Delete measurement

## Database Schema

### User Model
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  fitnessLevel: String,
  goals: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Workout Model
```javascript
{
  user: ObjectId (ref: User),
  name: String,
  date: Date,
  duration: Number,
  exercises: [{
    name: String,
    category: String,
    sets: [{
      reps: Number,
      weight: Number,
      duration: Number
    }]
  }],
  notes: String,
  totalVolume: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Deployment

### Railway Deployment

1. **Push to GitHub** (already completed)
2. **Connect to Railway**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub repo
   - Select this repository

3. **Environment Variables**
   Add the following variables in Railway:
   ```
   NODE_ENV=production
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-production-jwt-secret
   PORT=3000
   ```

4. **Deploy**
   Railway will automatically build and deploy the application

## Security Features

- Password encryption using bcrypt
- JWT token authentication
- Request rate limiting
- Input validation and sanitization
- CORS protection
- Environment variable protection

## Error Handling

The API includes comprehensive error handling with:
- Custom error classes
- Centralized error middleware
- Detailed error logging
- User-friendly error messages

## Contributing

This is a dissertation project. For educational purposes only.

## License

This project is for academic use as part of a university dissertation.

## Author

Salma Dardour - University Dissertation Project

## Live Demo

- **Frontend**: [https://hellofittrackpro.netlify.app/](https://hellofittrackpro.netlify.app/)
- **Backend API**: [Deployed on Railway]

## Contact

For questions about this dissertation project, please contact through the university system.

---

**Note**: This is an academic project developed as part of a university dissertation on modern web application development and fitness tracking systems.
