const app = require('./App');
const connectDB = require('./Configuration/Database');
const config = require('./Configuration/Environment');

// Connect to database
connectDB();

// Start server
const server = app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
    console.log(`Health check: http://localhost:${config.PORT}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

module.exports = server;