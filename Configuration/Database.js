const mongoose = require('mongoose');
const config = require('./Environment');

const connectDB = async () => {
    try { // starts the error handeling block, these optimize performance and handle network issues
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
        };

        const conn = await mongoose.connect(config.MONGODB_URI, options); // connects to MongoDB using URI and options

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
        });

        process.on('SIGINT', async () => { // listens for app shutdown
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0); 
        }); 

    } catch (error) { // catches any connection errors
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;