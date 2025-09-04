const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const securityConfig = { // creates a configuration object to store security settings
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        crossOriginEmbedderPolicy: false,
    },

    rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: {
            error: 'Too many requests, please try again later.'
        }
    }
};

module.exports = securityConfig;