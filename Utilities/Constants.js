// HTTP Status Codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

// Error Codes
const ERROR_CODES = {
    // Authentication Errors
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    NO_TOKEN: 'NO_TOKEN',
    USER_EXISTS: 'USER_EXISTS',
    USER_NOT_FOUND: 'USER_NOT_FOUND',

    // Validation Errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',

    // Workout Errors
    WORKOUT_NOT_FOUND: 'WORKOUT_NOT_FOUND',
    INVALID_WORKOUT_DATA: 'INVALID_WORKOUT_DATA',

    // Rate Limiting
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

    // General Errors
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    PERMISSION_DENIED: 'PERMISSION_DENIED'
};

// Exercise Categories
const EXERCISE_CATEGORIES = [
    'chest',
    'back',
    'shoulders',
    'arms',
    'legs',
    'core',
    'cardio',
    'other'
];

// Fitness Levels
const FITNESS_LEVELS = [
    'beginner',
    'intermediate',
    'advanced'
];

// Unit Systems
const UNIT_SYSTEMS = [
    'metric',
    'imperial'
];

// Privacy Settings
const PRIVACY_SETTINGS = [
    'public',
    'private'
];

// Gender Options
const GENDER_OPTIONS = [
    'male',
    'female',
    'other'
];

// Workout Template Types
const WORKOUT_TYPES = [
    'strength',
    'cardio',
    'flexibility',
    'sports',
    'rehabilitation',
    'custom'
];

// Time Periods for Analytics
const TIME_PERIODS = {
    WEEK: 7,
    MONTH: 30,
    QUARTER: 90,
    YEAR: 365
};

// Validation Limits
const VALIDATION_LIMITS = {
    PASSWORD_MIN_LENGTH: 6,
    PASSWORD_MAX_LENGTH: 128,
    NAME_MAX_LENGTH: 50,
    EMAIL_MAX_LENGTH: 255,
    WORKOUT_NAME_MAX_LENGTH: 100,
    NOTES_MAX_LENGTH: 500,
    GOALS_MAX_COUNT: 10,
    SETS_MAX_COUNT: 50,
    EXERCISES_MAX_COUNT: 20
};

// Rate Limiting
const RATE_LIMITS = {
    GENERAL: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 100
    },
    AUTH: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes  
        MAX_REQUESTS: 5
    },
    PASSWORD_RESET: {
        WINDOW_MS: 60 * 60 * 1000, // 1 hour
        MAX_REQUESTS: 3
    }
};

// JWT Configuration
const JWT_CONFIG = {
    ACCESS_TOKEN_EXPIRE: '15m',
    REFRESH_TOKEN_EXPIRE: '7d',
    RESET_TOKEN_EXPIRE: '1h'
};

// File Upload Limits
const UPLOAD_LIMITS = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    MAX_FILES_PER_REQUEST: 5
};

// Database Configuration
const DB_CONFIG = {
    MAX_POOL_SIZE: 10,
    SERVER_SELECTION_TIMEOUT: 5000,
    SOCKET_TIMEOUT: 45000
};

// Success Messages
const SUCCESS_MESSAGES = {
    USER_REGISTERED: 'User registered successfully',
    LOGIN_SUCCESSFUL: 'Login successful',
    LOGOUT_SUCCESSFUL: 'Logout successful',
    PROFILE_UPDATED: 'Profile updated successfully',
    WORKOUT_CREATED: 'Workout created successfully',
    WORKOUT_UPDATED: 'Workout updated successfully',
    WORKOUT_DELETED: 'Workout deleted successfully',
    GOALS_UPDATED: 'Goals updated successfully',
    PASSWORD_RESET: 'Password reset successfully',
    ACCOUNT_DELETED: 'Account deleted successfully'
};

// Default User Settings
const DEFAULT_USER_SETTINGS = {
    FITNESS_LEVEL: 'beginner',
    UNITS: 'metric',
    PRIVACY: 'private',
    EMAIL_VERIFIED: false,
    ACTIVE: true,
    GOALS: []
};

// Workout Metrics
const WORKOUT_METRICS = {
    RPE_MIN: 1,
    RPE_MAX: 10,
    WEIGHT_MIN: 0,
    REPS_MIN: 0,
    DURATION_MIN: 0,
    REST_TIME_MIN: 0
};

// API Response Format
const API_RESPONSE_FORMAT = {
    SUCCESS: {
        SUCCESS: true,
        MESSAGE: '',
        DATA: null
    },
    ERROR: {
        SUCCESS: false,
        ERROR: {
            CODE: '',
            MESSAGE: ''
        },
        TIMESTAMP: new Date().toISOString()
    }
};

module.exports = {
    HTTP_STATUS,
    ERROR_CODES,
    EXERCISE_CATEGORIES,
    FITNESS_LEVELS,
    UNIT_SYSTEMS,
    PRIVACY_SETTINGS,
    GENDER_OPTIONS,
    WORKOUT_TYPES,
    TIME_PERIODS,
    VALIDATION_LIMITS,
    RATE_LIMITS,
    JWT_CONFIG,
    UPLOAD_LIMITS,
    DB_CONFIG,
    SUCCESS_MESSAGES,
    DEFAULT_USER_SETTINGS,
    WORKOUT_METRICS,
    API_RESPONSE_FORMAT
};