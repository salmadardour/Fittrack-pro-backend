const rateLimit = require('express-rate-limit');
const { HTTP_STATUS, ERROR_CODES, RATE_LIMITS } = require('../Utilities/Constants');

// General rate limiting for all API endpoints
const generalLimiter = rateLimit({
    windowMs: RATE_LIMITS.GENERAL.WINDOW_MS,
    max: RATE_LIMITS.GENERAL.MAX_REQUESTS,
    message: {
        success: false,
        error: {
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil(RATE_LIMITS.GENERAL.WINDOW_MS / 1000)
        },
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
            success: false,
            error: {
                code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
                message: 'Too many requests from this IP, please try again later.',
                retryAfter: Math.ceil(RATE_LIMITS.GENERAL.WINDOW_MS / 1000),
                limit: RATE_LIMITS.GENERAL.MAX_REQUESTS,
                windowMs: RATE_LIMITS.GENERAL.WINDOW_MS
            },
            timestamp: new Date().toISOString()
        });
    }
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: RATE_LIMITS.AUTH.WINDOW_MS,
    max: RATE_LIMITS.AUTH.MAX_REQUESTS,
    message: {
        success: false,
        error: {
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: 'Too many authentication attempts, please try again later.',
            retryAfter: Math.ceil(RATE_LIMITS.AUTH.WINDOW_MS / 1000)
        },
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler: (req, res) => {
        res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
            success: false,
            error: {
                code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
                message: 'Too many authentication attempts, please try again later.',
                retryAfter: Math.ceil(RATE_LIMITS.AUTH.WINDOW_MS / 1000),
                limit: RATE_LIMITS.AUTH.MAX_REQUESTS,
                windowMs: RATE_LIMITS.AUTH.WINDOW_MS
            },
            timestamp: new Date().toISOString()
        });
    }
});

// Password reset rate limiting
const passwordResetLimiter = rateLimit({
    windowMs: RATE_LIMITS.PASSWORD_RESET.WINDOW_MS,
    max: RATE_LIMITS.PASSWORD_RESET.MAX_REQUESTS,
    message: {
        success: false,
        error: {
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: 'Too many password reset attempts, please try again later.',
            retryAfter: Math.ceil(RATE_LIMITS.PASSWORD_RESET.WINDOW_MS / 1000)
        },
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
            success: false,
            error: {
                code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
                message: 'Too many password reset attempts, please try again later.',
                retryAfter: Math.ceil(RATE_LIMITS.PASSWORD_RESET.WINDOW_MS / 1000),
                limit: RATE_LIMITS.PASSWORD_RESET.MAX_REQUESTS,
                windowMs: RATE_LIMITS.PASSWORD_RESET.WINDOW_MS
            },
            timestamp: new Date().toISOString()
        });
    }
});

// File upload rate limiting
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 uploads per window
    message: {
        success: false,
        error: {
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: 'Too many file uploads, please try again later.',
            retryAfter: 900
        },
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Workout creation rate limiting
const workoutLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 workouts per 5 minutes
    message: {
        success: false,
        error: {
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: 'Too many workout operations, please slow down.',
            retryAfter: 300
        },
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false
});

// User profile update rate limiting
const profileUpdateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // 5 profile updates per 10 minutes
    message: {
        success: false,
        error: {
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: 'Too many profile updates, please try again later.',
            retryAfter: 600
        },
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Custom rate limiter factory
const createRateLimiter = (options = {}) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        message: {
            success: false,
            error: {
                code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
                message: 'Too many requests, please try again later.'
            },
            timestamp: new Date().toISOString()
        },
        standardHeaders: true,
        legacyHeaders: false
    };

    return rateLimit({ ...defaultOptions, ...options });
};

// Dynamic rate limiter based on user authentication
const dynamicRateLimiter = (authenticatedMax = 200, unauthenticatedMax = 50) => {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        max: (req) => {
            // Higher limits for authenticated users
            if (req.user) {
                return authenticatedMax;
            }
            return unauthenticatedMax;
        },
        message: {
            success: false,
            error: {
                code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
                message: 'Rate limit exceeded. Consider logging in for higher limits.'
            },
            timestamp: new Date().toISOString()
        },
        standardHeaders: true,
        legacyHeaders: false
    });
};

// IP-based rate limiting with whitelist
const createIPRateLimiter = (whitelist = []) => {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        skip: (req) => {
            // Skip rate limiting for whitelisted IPs
            const clientIP = req.ip || req.connection.remoteAddress;
            return whitelist.includes(clientIP);
        },
        message: {
            success: false,
            error: {
                code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
                message: 'Too many requests from this IP address.'
            },
            timestamp: new Date().toISOString()
        }
    });
};

// Endpoint-specific rate limiting
const endpointRateLimiter = (endpoint, config) => {
    const limiters = {
        auth: authLimiter,
        passwordReset: passwordResetLimiter,
        upload: uploadLimiter,
        workout: workoutLimiter,
        profile: profileUpdateLimiter,
        general: generalLimiter
    };

    return limiters[endpoint] || createRateLimiter(config);
};

// Rate limit info middleware (adds headers)
const rateLimitInfo = (req, res, next) => {
    res.set({
        'X-RateLimit-Remaining': res.get('X-RateLimit-Remaining') || 'Unknown',
        'X-RateLimit-Reset': res.get('X-RateLimit-Reset') || 'Unknown',
        'X-RateLimit-Limit': res.get('X-RateLimit-Limit') || 'Unknown'
    });
    next();
};

// Rate limit bypass for development
const developmentBypass = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        return next();
    }

    // Apply rate limiting in production
    return generalLimiter(req, res, next);
};

// Progressive rate limiting (increases limits over time for good behavior)
const progressiveRateLimiter = () => {
    const store = new Map();

    return rateLimit({
        windowMs: 15 * 60 * 1000,
        max: (req) => {
            const key = req.ip;
            const userStats = store.get(key) || { violations: 0, goodBehavior: 0 };

            // Base limit
            let limit = 100;

            // Reduce limit for users with violations
            if (userStats.violations > 0) {
                limit = Math.max(20, limit - (userStats.violations * 10));
            }

            // Increase limit for users with good behavior
            if (userStats.goodBehavior > 10) {
                limit = Math.min(300, limit + (userStats.goodBehavior * 2));
            }

            return limit;
        },
        onLimitReached: (req) => {
            const key = req.ip;
            const userStats = store.get(key) || { violations: 0, goodBehavior: 0 };
            userStats.violations += 1;
            store.set(key, userStats);
        }
    });
};

module.exports = {
    generalLimiter,
    authLimiter,
    passwordResetLimiter,
    uploadLimiter,
    workoutLimiter,
    profileUpdateLimiter,
    createRateLimiter,
    dynamicRateLimiter,
    createIPRateLimiter,
    endpointRateLimiter,
    rateLimitInfo,
    developmentBypass,
    progressiveRateLimiter
};