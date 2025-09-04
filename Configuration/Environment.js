require('dotenv').config(); // loads variables from my .env files into my process.env (keeps secrets out of my code)

module.exports = {
    PORT: process.env.PORT || 5000, // will try to use PORT from .env file first, otherwise 5000
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/fittrack-dev', // database connection from .env of MongoDB

    JWT: { //groups all the JWT settings together
        SECRET: process.env.JWT_SECRET || 'fallback-secret-key',
        REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
        EXPIRE: process.env.JWT_EXPIRE || '15m',
        REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d'
    },

    RATE_LIMIT: { // this prevents spam and abuse of my API
        WINDOW_MS: 15 * 60 * 1000,
        MAX_REQUESTS: 100
    }
};