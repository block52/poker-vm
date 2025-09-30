#!/bin/bash

# Nginx configuration update script with safety checks
# This script safely updates nginx configuration with backup and validation

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get pwd
PWD_DIR=$(pwd)
echo -e "${GREEN}Current working directory: $PWD_DIR${NC}"

# Configuration paths
NGINX_CONF_DIR="/etc/nginx"
SITES_AVAILABLE="$NGINX_CONF_DIR/sites-available"
SITES_ENABLED="$NGINX_CONF_DIR/sites-enabled"
DEFAULT_CONF="$SITES_AVAILABLE/default"
SOURCE_CONF="$PWD_DIR/nginx/default"
BACKUP_DIR="/etc/nginx/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Function to log messages
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
   exit 1
fi

# Check if source configuration exists
if [[ ! -f "$SOURCE_CONF" ]]; then
    error "Source configuration file not found: $SOURCE_CONF"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log "Starting nginx configuration update..."

# Create backup of current configuration
if [[ -f "$DEFAULT_CONF" ]]; then
    log "Creating backup of current configuration..."
    cp "$DEFAULT_CONF" "$BACKUP_DIR/default_$TIMESTAMP.bak"
    log "Backup created: $BACKUP_DIR/default_$TIMESTAMP.bak"
else
    warning "No existing default configuration found"
fi

# Test nginx syntax before stopping service
log "Testing current nginx configuration..."
nginx -t
if [[ $? -ne 0 ]]; then
    error "Current nginx configuration has syntax errors. Please fix before updating."
    exit 1
fi

# Copy new configuration
log "Copying new configuration..."
cp "$SOURCE_CONF" "$DEFAULT_CONF"

# Set correct permissions and ownership
log "Setting correct permissions..."
chmod 644 "$DEFAULT_CONF"
chown root:root "$DEFAULT_CONF"

# Test new configuration syntax
log "Testing new nginx configuration syntax..."
nginx -t
if [[ $? -ne 0 ]]; then
    error "New configuration has syntax errors. Restoring backup..."
    if [[ -f "$BACKUP_DIR/default_$TIMESTAMP.bak" ]]; then
        cp "$BACKUP_DIR/default_$TIMESTAMP.bak" "$DEFAULT_CONF"
        log "Backup restored"
    fi
    exit 1
fi

# Check if nginx is running
if systemctl is-active --quiet nginx; then
    log "Nginx is running. Performing graceful reload..."
    systemctl reload nginx
    if [[ $? -eq 0 ]]; then
        log "Nginx configuration reloaded successfully"
    else
        error "Failed to reload nginx. Restoring backup..."
        if [[ -f "$BACKUP_DIR/default_$TIMESTAMP.bak" ]]; then
            cp "$BACKUP_DIR/default_$TIMESTAMP.bak" "$DEFAULT_CONF"
            systemctl reload nginx
            log "Backup restored and nginx reloaded"
        fi
        exit 1
    fi
else
    log "Nginx is not running. Starting nginx..."
    systemctl start nginx
    if [[ $? -eq 0 ]]; then
        log "Nginx started successfully"
    else
        error "Failed to start nginx. Check configuration and logs."
        exit 1
    fi
fi

# Verify nginx is running properly
sleep 2
if systemctl is-active --quiet nginx; then
    log "✅ Nginx is running and configuration update completed successfully"
    log "Configuration backup saved as: $BACKUP_DIR/default_$TIMESTAMP.bak"
else
    error "❌ Nginx failed to start properly after configuration update"
    exit 1
fi

log "🎉 Nginx configuration update completed successfully!"
log "Remember to:"
log "  - Update DNS records for new domains"
log "  - Generate SSL certificates with: sudo certbot --nginx -d botapi.block52.xyz"
log "  - Monitor nginx logs: sudo tail -f /var/log/nginx/error.log"