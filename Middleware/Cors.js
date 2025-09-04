const cors = require('cors');

// CORS configuration for different environments
const getCorsOptions = () => {
    const corsOptions = {
        // Origins that are allowed to access the API
        origin: function (origin, callback) {
            const allowedOrigins = [
                'http://localhost:3000',    // React dev server
                'http://localhost:5173',    // Vite dev server
                'http://localhost:3001',    // Alternative React port
                'http://127.0.0.1:3000',    // Alternative localhost
                'https://your-frontend-domain.netlify.app', // Production frontend
                'https://fittrack-pro.netlify.app'  // Your actual domain
            ];

            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
                callback(new Error(msg), false);
            }
        },

        // Allow credentials (cookies, authorization headers)
        credentials: true,

        // Allowed HTTP methods
        methods: [
            'GET',
            'POST',
            'PUT',
            'DELETE',
            'OPTIONS',
            'HEAD',
            'PATCH'
        ],

        // Allowed headers
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
            'Cache-Control',
            'X-HTTP-Method-Override'
        ],

        // Headers exposed to the client
        exposedHeaders: [
            'X-Total-Count',
            'X-Page-Count',
            'Link'
        ],

        // How long the browser should cache preflight requests
        maxAge: 86400, // 24 hours

        // Handle preflight requests
        preflightContinue: false,

        // Provide success status for OPTIONS requests
        optionsSuccessStatus: 204
    };

    // In development, be more permissive
    if (process.env.NODE_ENV === 'development') {
        corsOptions.origin = true; // Allow all origins in development
    }

    return corsOptions;
};

// Create CORS middleware
const corsMiddleware = cors(getCorsOptions());

// Custom CORS handler for specific routes
const customCors = (allowedOrigins = []) => {
    return cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'), false);
            }
        },
        credentials: true
    });
};

// CORS error handler
const handleCorsError = (err, req, res, next) => {
    if (err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            error: {
                code: 'CORS_ERROR',
                message: 'Cross-origin request not allowed',
                origin: req.get('Origin') || 'unknown'
            },
            timestamp: new Date().toISOString()
        });
    }
    next(err);
};

module.exports = {
    corsMiddleware,
    customCors,
    handleCorsError,
    getCorsOptions
};