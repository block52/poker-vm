#!/bin/bash

# Nginx configuration update script with safety checks
# This script safely updates nginx configuration with backup and validation

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color


# Require main domain as argument (no prompt)
if [ -z "$1" ]; then
    echo -e "${RED}[ERROR] Main domain must be provided as an argument (e.g., bash nginx.sh example.com)${NC}"
    exit 1
fi
MAIN_DOMAIN="$1"

APP_DOMAIN="app.$MAIN_DOMAIN"
NODE_DOMAIN="node1.$MAIN_DOMAIN"

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


# Remove any config files in /etc/nginx/sites-enabled/ and /etc/nginx/conf.d/ with SSL/certbot/letsencrypt/443 lines
for f in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*; do
    if [ -f "$f" ] && grep -qE 'ssl_|letsencrypt|certbot|443' "$f"; then
        log "Removing old nginx config with SSL/certbot: $f"
        rm -f "$f"
    fi
done

# Copy new configuration
log "Copying new configuration..."
cp "$SOURCE_CONF" "$DEFAULT_CONF"

# Replace placeholder server_name with actual node domain
log "Setting server_name to $NODE_DOMAIN..."
sed -i "s/server_name _;/server_name $NODE_DOMAIN;/g" "$DEFAULT_CONF"

# Create new symlink to our config
log "Linking $DEFAULT_CONF to /etc/nginx/sites-enabled/default..."
ln -s "$DEFAULT_CONF" /etc/nginx/sites-enabled/default

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


# Setup SSL certificates with certbot for node subdomain
log "Setting up SSL certificates with certbot for $NODE_DOMAIN..."
certbot --nginx -d "$NODE_DOMAIN" --non-interactive --agree-tos -m admin@$MAIN_DOMAIN || warning "Certbot may require manual intervention. Check certbot output."

# Final nginx config test and restart
log "Final nginx configuration test..."
nginx -t
if [[ $? -ne 0 ]]; then
    error "Nginx configuration failed after certbot. Please check manually."
    exit 1
fi

log "Restarting nginx service..."
systemctl restart nginx
if systemctl is-active --quiet nginx; then
    log "✅ Nginx is running and configuration update completed successfully"
    log "Configuration backup saved as: $BACKUP_DIR/default_$TIMESTAMP.bak"
else
    error "❌ Nginx failed to start properly after configuration update"
    exit 1
fi

log "🎉 Nginx configuration update completed successfully!"
log "Monitor nginx logs: sudo tail -f /var/log/nginx/error.log"