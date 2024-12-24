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

ETH_PRIVATE_KEY=""

case $key_choice in
    1)
        while true; do
            read -p "Enter your Ethereum private key (64 hex characters): " input_key
            if validate_eth_key "$input_key"; then
                ETH_PRIVATE_KEY=$input_key
                break
            else
                echo -e "${RED}Invalid private key format. Please enter a valid 32-byte hex string.${NC}"
            fi
        done
        ;;
    2)
        ETH_PRIVATE_KEY=$(generate_eth_key)
        echo -e "${GREEN}Generated new private key: ${ETH_PRIVATE_KEY}${NC}"
        echo -e "${RED}IMPORTANT: Save this private key in a secure location!${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

# Create .env file
echo -e "\n${BLUE}Creating .env file...${NC}"
if [ -f .env ]; then
    read -p ".env file already exists. Do you want to overwrite it? (y/n): " overwrite
    if [ "$overwrite" != "y" ]; then
        echo -e "${RED}Setup cancelled. Existing .env file was not modified.${NC}"
        exit 1
    fi
fi

cat > .env << EOL
# Generated on $(date)
ETH_PRIVATE_KEY=${ETH_PRIVATE_KEY}
RPC_URL=${RPC_URL}
VAULT_CONTRACT_ADDRESS=0x893c26846d7cE76445230B2b6285a663BF4C3BF5
BRIDGE_CONTRACT_ADDRESS=0x859329813d8e500F4f6Be0fc934E53AC16670fa0
EOL

# Handle Node RPC URL
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

mv .env poker-vm/pvm/ts/.env

echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "Your configuration has been saved to .env file."
echo -e "${RED}REMINDER: Keep your private key secure and never share it with anyone!${NC}"