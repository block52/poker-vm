#!/bin/bash

set -e  # Exit on any error

# Check if we're in the correct directory
if [[ ! "$(pwd)" == *"poker-vm" ]]; then
    echo "❌ Please run this script from the poker-vm directory"
    exit 1
fi

# Configuration
BOT_DIR="$(pwd)/bot/ts"
BOT_NAME="poker-bot"
LOG_DIR="$(pwd)/logs"

echo "Starting poker bot with PM2..."
echo "Bot directory: $BOT_DIR"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Please install it first:"
    echo "npm install -g pm2"
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Navigate to bot directory
if [ ! -d "$BOT_DIR" ]; then
    echo "❌ Bot directory not found: $BOT_DIR"
    exit 1
fi

cd "$BOT_DIR"

# Remove existing node_modules and install fresh dependencies
if [ -d "node_modules" ]; then
    echo "Removing existing node_modules..."
    rm -rf node_modules
fi

echo "Installing bot dependencies with yarn..."
yarn install

# Stop existing bot process if running
if pm2 list | grep -q "$BOT_NAME"; then
    echo "Stopping existing bot process..."
    pm2 stop "$BOT_NAME"
    pm2 delete "$BOT_NAME"
fi

# Start the bot with PM2
echo "Starting bot with PM2..."
pm2 start "npx ts-node index.ts" --name "$BOT_NAME" --log "$LOG_DIR/$BOT_NAME.log" --error "$LOG_DIR/$BOT_NAME-error.log"

# Save PM2 configuration
pm2 save

# Show bot status
echo "✅ Bot started successfully!"
pm2 show "$BOT_NAME"

