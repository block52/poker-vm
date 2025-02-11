const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const logger = require("./config/logger");
const pvmService = require('./services/pvm.service');
const { BlockDTO, TransactionDTO } = require('@bitcoinbrisbane/block52');

dotenv.config();

const PORT = process.env.PORT || 3800;

// Middleware to log all requests
app.use((req, res, next) => {
  logger.info(`Incoming ${req.method} request to ${req.url}`, {
    method: req.method,
    url: req.url,
    query: req.query,
    params: req.params,
    ip: req.ip
  });
  next();
});

// Connect to MongoDB with detailed logging
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  logger.info('Successfully connected to MongoDB', {
    dbUrl: process.env.DB_URL.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://***:***@') // Hide credentials in logs
  });
})
.catch((err) => {
  logger.error('MongoDB connection error:', { 
    error: err.message, 
    stack: err.stack,
    dbUrl: process.env.DB_URL.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://***:***@')
  });
  process.exit(1);
});

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

// Hello World GET route
app.get("/", (req, res) => {
  logger.debug('Processing root route request');
  res.send("Hello World!");
});

app.get("/block/:id", async (req, res) => {
  try {
    logger.info('Fetching block by ID', { blockId: req.params.id });
    // TODO: Implement block fetching logic
    res.send(response.data);
  } catch (error) {
    logger.error('Error fetching block:', { 
      blockId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get("/blocks", (req, res) => {
  try {
    logger.info('Fetching blocks list', { query: req.query });
    res.send("Blocks route");
  } catch (error) {
    logger.error('Error fetching blocks:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
app.listen(PORT, async () => {
  logger.info(`B52 Explorer server started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });

  // Start block synchronization
  pvmService.startBlockSync();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    reason: reason,
    stack: reason.stack
  });
});
