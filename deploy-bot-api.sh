#!/bin/bash

set -e  # Exit on any error

# Configuration
PWD_DIR=$(pwd)
SERVICE_NAME="api.service"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}"
WORKING_DIR="/opt/bot-api"
REPO_DIR="~/poker-vm"
USER="apiuser"
GROUP="apiuser"

echo "Starting deployment of bot API service..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root or with sudo"
    exit 1
fi

# Create user and group if they don't exist
if ! id "$USER" &>/dev/null; then
    echo "Creating user $USER..."
    useradd --system --no-create-home --shell /bin/false "$USER"
fi

# Stash any local changes
echo "Stashing local changes..."
git stash push -m "Auto-stash before deploy $(date)"

# Switch to main branch and pull latest
echo "Pulling latest from main..."
git checkout main
git pull origin main


# Navigate to the bot/api subdirectory
cd "$PWD_DIR/bot/api"

# Build the application
echo "Building application..."
go mod tidy
go mod download
go build -o api .

# Stop the service if it's running
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "Stopping $SERVICE_NAME..."
    systemctl stop "$SERVICE_NAME"
fi

# Create working directory if it doesn't exist
mkdir -p "$WORKING_DIR"
mkdir -p "$WORKING_DIR/logs"
mkdir -p "$WORKING_DIR/data"

# Copy the built binary
echo "Copying binary to $WORKING_DIR..."
cp api "$WORKING_DIR/"
chmod +x "$WORKING_DIR/api"

# Set proper ownership
chown -R "$USER:$GROUP" "$WORKING_DIR"

# Copy service file if it doesn't exist
# if [ ! -f "$SERVICE_FILE" ]; then
    echo "Copying service file..."
    cp "$PWD_DIR/bot/api/$SERVICE_NAME" "$SERVICE_FILE"
    chmod 644 "$SERVICE_FILE"
# fi

# Reload systemd and start the service
echo "Reloading systemd daemon..."
systemctl daemon-reload

echo "Starting $SERVICE_NAME..."
systemctl start "$SERVICE_NAME"

# Enable service to start on boot
systemctl enable "$SERVICE_NAME"

# Check service status
sleep 2
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✅ Deployment successful! Service is running."
    systemctl status "$SERVICE_NAME" --no-pager -l
else
    echo "❌ Deployment failed! Service is not running."
    systemctl status "$SERVICE_NAME" --no-pager -l
    exit 1
fi

# Clean up
rm -rf "$REPO_DIR"

echo "Deployment completed successfully!"