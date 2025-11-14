###############################################
# ENVIRONMENT & SYSTEM SETUP (from setup.sh)
###############################################

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if Docker is installed
check_docker() {
    echo -e "${BLUE}Checking for Docker installation...${NC}"
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
        echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
        exit 1
    fi
    echo -e "${GREEN}Docker is installed!${NC}"
}

# Function to generate an Ethereum private key using openssl
generate_eth_key() {
    openssl rand -hex 32
}

# Function to validate URL format
validate_url() {
    local url=$1
    if [[ $url =~ ^https?:// ]]; then
        return 0
    else
        return 1
    fi
}

# Function to validate Ethereum private key format
validate_eth_key() {
    local key=$1
    if [[ ${#key} -eq 64 && "$key" =~ ^[0-9a-fA-F]+$ ]]; then
        return 0
    else
        return 1
    fi
}

# Main environment setup
echo -e "${BLUE}Starting environment setup...${NC}"
check_docker

# Handle Ethereum private key
echo -e "\n${BLUE}Ethereum Private Key Setup${NC}"
echo "Do you want to:"
echo "1. Enter an existing private key"
echo "2. Generate a new private key"
read -p "Enter your choice (1 or 2): " key_choice

VALIDATOR_KEY=""
case $key_choice in
    1)
        while true; do
            read -p "Enter your Ethereum private key (64 hex characters): " input_key
            if validate_eth_key "$input_key"; then
                VALIDATOR_KEY=$input_key
                break
            else
                echo -e "${RED}Invalid private key format. Please enter a valid 32-byte hex string.${NC}"
            fi
        done
        ;;
    2)
        VALIDATOR_KEY=$(generate_eth_key)
        echo -e "${GREEN}Generated new private key: ${VALIDATOR_KEY}${NC}"
        echo -e "${RED}IMPORTANT: Save this private key in a secure location!${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac




# Accept domain as argument or prompt if not provided
if [ -n "$1" ]; then
    MAIN_DOMAIN="$1"
    echo -e "${BLUE}Domain provided as argument: $MAIN_DOMAIN${NC}"
else
    echo -e "\n${BLUE}Domain Setup${NC}"
    while true; do
        read -p "Enter your main domain (e.g., example.com): " MAIN_DOMAIN
        if [[ "$MAIN_DOMAIN" =~ ^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
            break
        else
            echo -e "${RED}Invalid domain format. Please enter a valid domain (e.g., example.com).${NC}"
        fi
    done
fi

# Set subdomains
APP_DOMAIN="app.$MAIN_DOMAIN"
NODE_DOMAIN="node.$MAIN_DOMAIN"

# Set URLs for .env
PUBLIC_URL="https://$APP_DOMAIN"
RPC_URL="https://$NODE_DOMAIN"

# Generate nginx/default config for app. and node. subdomains (HTTP only, no SSL)
NGINX_CONF="nginx/default"
cat > "$NGINX_CONF" <<EOL
server {
    listen 80;
    index index.html;
    server_name $NODE_DOMAIN;
    location / {
        proxy_pass http://127.0.0.1:8545/;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    index index.html;
    server_name $APP_DOMAIN;
    location / {
        proxy_pass http://127.0.0.1:5173/;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOL


# Create .env file with all required fields (no SEED)
ENV_PATH="pvm/ts/.env"
cat > "$ENV_PATH" <<EOL
PORT=8545
DB_URL=mongodb://user:password@localhost:27017/
VALIDATOR_KEY=$VALIDATOR_KEY
RPC_URL="$RPC_URL"
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password
TOKEN_CONTRACT_ADDRESS=0x7D9aAe2950a2c703159Bc42d2D28882904029130
VAULT_CONTRACT_ADDRESS=0x687e526CE88a3E2aB889b3F110cF1C3cCfebafd7
BRIDGE_CONTRACT_ADDRESS=0x0B6052D3951b001E4884eD93a6030f92B1d76cf0
PUBLIC_URL=$PUBLIC_URL
PK=
MONGO_INITDB_ROOT_USERNAME=node1
MONGO_INITDB_ROOT_PASSWORD=Passw0rd123
MONGO_INITDB_DATABASE=pvm
EOL

echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "Your configuration has been saved to $ENV_PATH."
echo -e "${RED}REMINDER: Keep your private key secure and never share it with anyone!${NC}"
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
        bash nginx.sh "$MAIN_DOMAIN" || {
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

    # Prompt for Docker or bare metal
    echo -e "\n${BLUE}Select installation mode:${NC}"
    echo "1. Docker (recommended)"
    echo "2. Bare metal (PM2/Node.js)"
    read -p "Enter your choice (1 or 2): " install_mode

    if [ "$install_mode" = "1" ]; then
        log_info "Docker mode selected."
        # Check Docker
        if ! command_exists docker; then
            log_error "Docker is not installed. Please install Docker first."
            exit 1
        fi
        # Setup nginx
        setup_nginx
        # Build and start Docker containers
        log_info "Building Docker images..."
        docker compose build --no-cache || {
            log_error "Failed to build Docker images."
            exit 1
        }
        log_info "Starting Docker containers..."
        docker compose up -d --remove-orphans || {
            log_error "Failed to start Docker containers."
            exit 1
        }
        log_info "Waiting for containers to start..."
        sleep 5
        # Health check
        if health_check; then
            log_info "Docker deployment completed successfully!"
            log_info "Server is healthy and responding correctly."
        else
            log_error "Docker deployment completed but health check failed!"
            log_error "Please check the container logs for issues."
            exit 1
        fi
        return 0
    elif [ "$install_mode" = "2" ]; then
        log_info "Bare metal (PM2/Node.js) mode selected."
        # Verify required commands exist
        for cmd in yarn pm2 git curl; do
            if ! command_exists "$cmd"; then
                log_error "Required command '$cmd' not found"
                exit 1
            fi
        done
        # Execute deployment steps
        cleanup_pm2
        setup_node
        prepare_project
        update_code
        build_project
        start_pm2
        log_info "Waiting for service to start..."
        sleep 5
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
        return 0
    else
        log_error "Invalid choice. Exiting."
        exit 1
    fi
}

# Run main function
main "$@"