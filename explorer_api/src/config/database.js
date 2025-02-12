const mongoose = require("mongoose");
const logger = require("./logger");

const connectDatabase = async () => {
    try {
        // Set default connection URL if not provided
        const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/explorer';
        
        logger.info('Attempting to connect to MongoDB...', {
            dbUrl: dbUrl.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://***:***@')
        });

        await mongoose.connect(dbUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            connectTimeoutMS: 10000,        // Give up initial connection after 10s
        });

        logger.info('Successfully connected to MongoDB');

        // Add connection event listeners
        mongoose.connection.on('error', err => {
            logger.error('MongoDB connection error:', { error: err.message });
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });

        return true;

    } catch (err) {
        logger.error('MongoDB connection error:', { 
            error: err.message, 
            stack: err.stack
        });
        return false;
    }
};

module.exports = connectDatabase; 