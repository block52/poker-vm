#!/bin/bash

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
NODE_VERSION="22.12.0"
PROJECT_DIR="$HOME/poker-vm/pvm/ts"
DIST_DIR="$PROJECT_DIR/dist/src"
PM2_APP_NAME="node"
HEALTH_CHECK_URL="http://localhost:8545"
EXPECTED_RESPONSE="PVM RPC Server v0.1.1"
MAX_RETRIES=30
RETRY_INTERVAL=2

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to cleanup PM2 process
cleanup_pm2() {
    log_info "Cleaning up existing PM2 processes..."
    if pm2 list | grep -q "$PM2_APP_NAME"; then
        pm2 stop "$PM2_APP_NAME" || log_warn "Failed to stop PM2 process"
        pm2 delete "$PM2_APP_NAME" || log_warn "Failed to delete PM2 process"
    else
        log_info "No existing PM2 process found"
    fi
}

# Function to setup Node.js version
setup_node() {
    log_info "Setting up Node.js version $NODE_VERSION..."
    if command_exists nvm; then
        nvm use "$NODE_VERSION" || {
            log_error "Failed to switch to Node.js version $NODE_VERSION"
            exit 1
        }
    else
        log_warn "NVM not found, assuming correct Node.js version is installed"
    fi
}

# Function to prepare project directory
prepare_project() {
    log_info "Preparing project directory..."
    cd "$PROJECT_DIR" || {
        log_error "Failed to change to project directory: $PROJECT_DIR"
        exit 1
    }
    
    # Clean up previous build
    if [ -d "dist" ]; then
        log_info "Removing previous build..."
        rm -rf dist
    fi
}

# Function to stop Docker services
stop_docker() {
    log_info "Stopping Docker services..."
    docker compose down || log_warn "Failed to stop Docker services"
}

# Function to update code
update_code() {
    log_info "Updating code from repository..."
    git stash || log_warn "No changes to stash"
    git pull || {
        log_error "Failed to pull latest changes"
        exit 1
    }
}

# Function to setup nginx
setup_nginx() {
    log_info "Setting up nginx..."
    if [ -f "nginx.sh" ]; then
        bash nginx.sh || {
            log_error "Failed to setup nginx"
            exit 1
        }
    else
        log_warn "nginx.sh not found, skipping nginx setup"
    fi
}

# Function to build project
build_project() {
    log_info "Installing dependencies..."
    yarn install || {
        log_error "Failed to install dependencies"
        exit 1
    }
    
    log_info "Building project..."
    yarn build || {
        log_error "Failed to build project"
        exit 1
    }
    
    log_info "Copying environment file..."
    if [ -f ".env" ]; then
        cp .env dist/src/ || {
            log_error "Failed to copy .env file"
            exit 1
        }
    else
        log_warn ".env file not found"
    fi
}

# Function to start Docker services
start_docker() {
    log_info "Starting Docker services..."
    docker compose up -d || {
        log_error "Failed to start Docker services"
        exit 1
    }
}

# Function to start PM2 service
start_pm2() {
    log_info "Starting PM2 service..."
    cd "$DIST_DIR" || {
        log_error "Failed to change to dist/src directory: $DIST_DIR"
        exit 1
    }
    
    if [ -f "index.js" ]; then
        pm2 start index.js --name "$PM2_APP_NAME" || {
            log_error "Failed to start PM2 service"
            exit 1
        }
    else
        log_error "index.js not found in $DIST_DIR"
        exit 1
    fi
}

# Function to perform health check
health_check() {
    log_info "Performing health check on $HEALTH_CHECK_URL..."
    
    local retry_count=0
    while [ $retry_count -lt $MAX_RETRIES ]; do
        log_info "Health check attempt $((retry_count + 1))/$MAX_RETRIES..."
        
        # Perform the curl request and capture the response
        local response=$(curl -s "$HEALTH_CHECK_URL" 2>/dev/null || echo "CURL_FAILED")
        
        if [ "$response" = "$EXPECTED_RESPONSE" ]; then
            log_info "Health check passed! Server is responding correctly."
            log_info "Response: $response"
            return 0
        elif [ "$response" = "CURL_FAILED" ]; then
            log_warn "Health check failed: Unable to connect to server"
        else
            log_warn "Health check failed: Unexpected response"
            log_warn "Expected: '$EXPECTED_RESPONSE'"
            log_warn "Received: '$response'"
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $MAX_RETRIES ]; then
            log_info "Retrying in $RETRY_INTERVAL seconds..."
            sleep $RETRY_INTERVAL
        fi
    done
    
    log_error "Health check failed after $MAX_RETRIES attempts"
    log_error "Server may not be running correctly"
    return 1
}

# Main execution
main() {
    log_info "Starting poker-vm installation/deployment..."
    
    # Verify required commands exist
    for cmd in yarn docker pm2 git curl; do
        if ! command_exists "$cmd"; then
            log_error "Required command '$cmd' not found"
            exit 1
        fi
    done
    
    # Execute deployment steps
    cleanup_pm2
    setup_node
    prepare_project
    # stop_docker
    update_code
    # setup_nginx
    build_project
    # start_docker
    start_pm2
    
    # Wait a moment for PM2 to fully start the service
    log_info "Waiting for service to start..."
    sleep 5
    
    # Perform health check
    if health_check; then
        log_info "Deployment completed successfully!"
        log_info "Server is healthy and responding correctly."
    else
        log_error "Deployment completed but health check failed!"
        log_error "Please check the server logs for issues."
        exit 1
    fi
    
    log_info "PM2 status:"
    pm2 status
}

# Run main function
main "$@"