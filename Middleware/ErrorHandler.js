const { HTTP_STATUS, ERROR_CODES } = require('../Utilities/Constants');
const Helpers = require('../Utilities/Helpers');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('Error Details:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Invalid resource ID format';
        error = {
            message,
            statusCode: HTTP_STATUS.BAD_REQUEST,
            code: ERROR_CODES.INVALID_INPUT
        };
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        const message = `Duplicate value for ${field}: ${value}. Please use a different value.`;
        error = {
            message,
            statusCode: HTTP_STATUS.CONFLICT,
            code: ERROR_CODES.VALIDATION_ERROR
        };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = {
            message,
            statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
            code: ERROR_CODES.VALIDATION_ERROR,
            details: Object.values(err.errors).map(val => ({
                field: val.path,
                message: val.message,
                value: val.value
            }))
        };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid authentication token';
        error = {
            message,
            statusCode: HTTP_STATUS.UNAUTHORIZED,
            code: ERROR_CODES.INVALID_TOKEN
        };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Authentication token has expired';
        error = {
            message,
            statusCode: HTTP_STATUS.UNAUTHORIZED,
            code: ERROR_CODES.TOKEN_EXPIRED
        };
    }

    // MongoDB connection errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
        const message = 'Database connection error. Please try again later.';
        error = {
            message,
            statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
            code: ERROR_CODES.DATABASE_ERROR
        };
    }

    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'File size too large. Maximum size allowed is 5MB.';
        error = {
            message,
            statusCode: HTTP_STATUS.BAD_REQUEST,
            code: ERROR_CODES.INVALID_INPUT
        };
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
        const message = 'Too many files. Maximum 5 files allowed per request.';
        error = {
            message,
            statusCode: HTTP_STATUS.BAD_REQUEST,
            code: ERROR_CODES.INVALID_INPUT
        };
    }

    // CORS errors
    if (err.message && err.message.includes('CORS')) {
        const message = 'Cross-origin request not allowed';
        error = {
            message,
            statusCode: HTTP_STATUS.FORBIDDEN,
            code: 'CORS_ERROR'
        };
    }

    // Rate limiting errors
    if (err.message && err.message.includes('rate limit')) {
        const message = 'Too many requests. Please try again later.';
        error = {
            message,
            statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED
        };
    }

    // Custom application errors
    if (err.statusCode && err.code) {
        error = {
            message: err.message,
            statusCode: err.statusCode,
            code: err.code
        };
    }

    // Build error response
    const errorResponse = {
        success: false,
        error: {
            code: error.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Internal server error'
        },
        timestamp: new Date().toISOString()
    };

    // Add request ID for tracking
    if (req.id) {
        errorResponse.requestId = req.id;
    }

    // Add validation details if available
    if (error.details) {
        errorResponse.error.details = error.details;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && err.stack) {
        errorResponse.error.stack = err.stack;
    }

    // Add helpful hints for common errors
    if (error.code === ERROR_CODES.INVALID_TOKEN) {
        errorResponse.error.hint = 'Please log in again to get a new authentication token';
    }

    if (error.code === ERROR_CODES.VALIDATION_ERROR) {
        errorResponse.error.hint = 'Please check your input data and try again';
    }

    if (error.code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
        errorResponse.error.hint = 'Please wait before making another request';
        errorResponse.error.retryAfter = 60; // seconds
    }

    // Send error response
    res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
};

// 404 Not Found handler
const notFoundHandler = (req, res, next) => {
    const message = `Route ${req.originalUrl} not found with method ${req.method}`;

    res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
            code: ERROR_CODES.NOT_FOUND || 'NOT_FOUND',
            message,
            availableRoutes: {
                auth: '/api/v1/auth',
                users: '/api/v1/users',
                workouts: '/api/v1/workouts',
                health: '/health'
            }
        },
        timestamp: new Date().toISOString()
    });
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
class AppError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Unhandled promise rejection handler
const handleUnhandledRejection = (err) => {
    console.error('Unhandled Promise Rejection:', err);

    // In production, you might want to restart the process
    if (process.env.NODE_ENV === 'production') {
        console.log('Shutting down server due to unhandled promise rejection...');
        process.exit(1);
    }
};

// Uncaught exception handler
const handleUncaughtException = (err) => {
    console.error('Uncaught Exception:', err);
    console.log('Shutting down server due to uncaught exception...');
    process.exit(1);
};

// Request timeout handler
const timeoutHandler = (timeout = 30000) => {
    return (req, res, next) => {
        const timer = setTimeout(() => {
            if (!res.headersSent) {
                res.status(HTTP_STATUS.REQUEST_TIMEOUT).json({
                    success: false,
                    error: {
                        code: 'REQUEST_TIMEOUT',
                        message: 'Request timeout - the server took too long to respond'
                    },
                    timestamp: new Date().toISOString()
                });
            }
        }, timeout);

        // Clear timeout when response is sent
        res.on('finish', () => {
            clearTimeout(timer);
        });

        next();
    };
};

// Security error handler
const securityErrorHandler = (err, req, res, next) => {
    // Handle security-related errors
    if (err.type === 'entity.too.large') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: {
                code: 'PAYLOAD_TOO_LARGE',
                message: 'Request payload too large'
            },
            timestamp: new Date().toISOString()
        });
    }

    if (err.type === 'charset.unsupported') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: {
                code: 'CHARSET_UNSUPPORTED',
                message: 'Unsupported charset'
            },
            timestamp: new Date().toISOString()
        });
    }

    next(err);
};

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    AppError,
    handleUnhandledRejection,
    handleUncaughtException,
    timeoutHandler,
    securityErrorHandler
};