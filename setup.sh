# Check Docker installation and prompt to install if missing
echo -e "${BLUE}Checking for Docker installation...${NC}"
if ! command -v docker > /dev/null; then
    echo -e "${YELLOW}Docker is not installed.${NC}"
    read -p "Would you like to install Docker now? (y/n): " install_docker
    if [ "$install_docker" = "y" ]; then
        if [ -f "install-docker.sh" ]; then
            echo -e "${BLUE}Running install-docker.sh...${NC}"
            bash install-docker.sh
        elif command -v apt-get > /dev/null; then
            sudo apt-get update && sudo apt-get install -y docker.io
        elif command -v brew > /dev/null; then
            brew install --cask docker
        else
            echo -e "${RED}Automatic install not supported on this OS. Please install Docker manually.${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}Skipping Docker installation. Some features may not work until Docker is installed.${NC}"
    fi
else
    echo -e "${GREEN}Docker is already installed.${NC}"
fi
# Check nginx installation and prompt to install if missing
echo -e "${BLUE}Checking for nginx installation...${NC}"
if ! command -v nginx > /dev/null; then
    echo -e "${YELLOW}nginx is not installed.${NC}"
    read -p "Would you like to install nginx now? (y/n): " install_nginx
    if [ "$install_nginx" = "y" ]; then
        if command -v apt-get > /dev/null; then
            sudo apt-get update && sudo apt-get install -y nginx
        elif command -v brew > /dev/null; then
            brew install nginx
        else
            echo -e "${RED}Automatic install not supported on this OS. Please install nginx manually.${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}Skipping nginx installation. Some features may not work until nginx is installed.${NC}"
    fi
else
    echo -e "${GREEN}nginx is already installed.${NC}"
fi
# Prompt for domain and update nginx config
echo -e "\n${BLUE}Nginx Domain Setup${NC}"
read -p "Enter the main domain for this machine (e.g. poker.example.com): " MAIN_DOMAIN

# Update nginx/default with the provided domain
NGINX_DEFAULT_PATH="nginx/default"
if [ -f "$NGINX_DEFAULT_PATH" ]; then
    echo -e "${BLUE}Configuring nginx/default for domain: $MAIN_DOMAIN${NC}"
    # Replace all server_name and SSL cert paths with the new domain
    sed -i.bak \
        -e "s/server_name [^;]*;/server_name $MAIN_DOMAIN;/g" \
        -e "s|/etc/letsencrypt/live/[^/]*/|/etc/letsencrypt/live/$MAIN_DOMAIN/|g" \
        "$NGINX_DEFAULT_PATH"
    echo -e "${GREEN}nginx/default updated. Backup saved as nginx/default.bak${NC}"
else
    echo -e "${YELLOW}nginx/default not found. Skipping nginx config update.${NC}"
fi
# UFW (Uncomplicated Firewall) setup
echo -e "${BLUE}Checking for UFW (Uncomplicated Firewall)...${NC}"
if ! command -v ufw > /dev/null; then
    echo -e "${YELLOW}UFW is not installed.${NC}"
    read -p "Would you like to install UFW and set up a basic firewall? (y/n): " install_ufw
    if [ "$install_ufw" = "y" ]; then
        if command -v apt-get > /dev/null; then
            sudo apt-get update && sudo apt-get install -y ufw
        elif command -v brew > /dev/null; then
            brew install ufw
        else
            echo -e "${RED}Automatic install not supported on this OS. Please install ufw manually.${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}Skipping UFW setup.${NC}"
    fi
fi

if command -v ufw > /dev/null; then
    echo -e "${BLUE}Configuring UFW...${NC}"
    # Always allow SSH (port 22) for safety
    sudo ufw allow OpenSSH
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw status | grep -q inactive && {
        read -p "UFW is inactive. Would you like to enable it now? (y/n): " enable_ufw
        if [ "$enable_ufw" = "y" ]; then
            sudo ufw enable
            echo -e "${GREEN}UFW enabled and basic rules applied.${NC}"
        else
            echo -e "${YELLOW}UFW remains inactive.${NC}"
        fi
    }
fi
#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if Docker is installed
check_docker() {
    echo -e "${BLUE}Checking for Docker installation...${NC}"
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
# Check nginx status and set up if not running
echo -e "${BLUE}Checking if nginx is running...${NC}"
if ! pgrep nginx > /dev/null; then
  echo -e "${YELLOW}nginx is not running. Setting up and starting nginx.${NC}"
  bash ./nginx.sh
  if command -v systemctl > /dev/null; then
    sudo systemctl start nginx
  else
    sudo service nginx start
  fi
else
  echo -e "${GREEN}nginx is already running.${NC}"
fi
        echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
        exit 1
    fi
    echo -e "${GREEN}Docker is installed!${NC}"
}

# Function to generate an Ethereum private key using openssl
generate_eth_key() {
    # Generate a random 32-byte (256-bit) private key
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
    # Check if key is 64 characters long (32 bytes in hex) and contains only hex characters
    if [[ ${#key} -eq 64 && "$key" =~ ^[0-9a-fA-F]+$ ]]; then
        return 0
    else
        return 1
    fi
}

# Main setup process
echo -e "${BLUE}Starting local setup process...${NC}"

# Check for Docker
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

# Create .env from .env.example and update with user values
ENV_EXAMPLE_PATH="pvm/ts/.env.example"
ENV_PATH="pvm/ts/.env"

echo -e "\n${BLUE}Creating .env file from .env.example...${NC}"
if [ ! -f "$ENV_EXAMPLE_PATH" ]; then
    echo -e "${RED}.env.example not found at $ENV_EXAMPLE_PATH. Exiting.${NC}"
    exit 1
fi

cp "$ENV_EXAMPLE_PATH" "$ENV_PATH"

# Prompt for SEED if not already set
if [ -z "$SEED" ]; then
    read -p "Enter SEED phrase (or leave blank to generate): " SEED
fi

# Prompt for RPC_URL if not already set
if [ -z "$RPC_URL" ]; then
    echo -e "\n${BLUE}Node RPC URL Setup${NC}"
    echo "Please enter your Ethereum node RPC URL (e.g., from Infura, Alchemy, etc.)"
    while true; do
        read -p "Enter RPC URL: " RPC_URL
        if validate_url "$RPC_URL"; then
            break
        else
            echo -e "${RED}Invalid URL format. URL must start with http:// or https://${NC}"
        fi
    done
fi

# Prompt for VALIDATOR_KEY if not already set
if [ -z "$VALIDATOR_KEY" ]; then
    read -p "Enter Validator Private Key (or leave blank to generate): " VALIDATOR_KEY
    if [ -z "$VALIDATOR_KEY" ]; then
        VALIDATOR_KEY=$(generate_eth_key)
        echo -e "${GREEN}Generated new private key: ${VALIDATOR_KEY}${NC}"
        echo -e "${RED}IMPORTANT: Save this private key in a secure location!${NC}"
    fi
fi

# Update .env with user values
sed -i "s|^SEED=.*$|SEED=\"$SEED\"|" "$ENV_PATH"
sed -i "s|^RPC_URL=.*$|RPC_URL=\"$RPC_URL\"|" "$ENV_PATH"
sed -i "s|^VALIDATOR_KEY=.*$|VALIDATOR_KEY=$VALIDATOR_KEY|" "$ENV_PATH"

echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "Your configuration has been saved to $ENV_PATH."
echo -e "${RED}REMINDER: Keep your private key secure and never share it with anyone!${NC}"

# Build Docker images
echo -e "\n${BLUE}Building Docker images...${NC}"
if [ -f Makefile ]; then
    make build
else
    docker compose build --no-cache
fi

# Start Docker containers
echo -e "\n${BLUE}Starting Docker containers...${NC}"
if [ -f Makefile ]; then
    make up
else
    docker compose up -d
fi
echo -e "${GREEN}Docker containers are up and running!${NC}"