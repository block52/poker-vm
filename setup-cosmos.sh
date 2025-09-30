#!/bin/bash

# Cosmos SDK Setup Script for Poker VM
# This script sets up a private Cosmos SDK blockchain using Ignite CLI
# with 52 million tokens in the genesis block

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHAIN_ID="poker-vm-1"
CHAIN_NAME="poker"
TOKEN_DENOM="upvm"
GENESIS_AMOUNT="52000000000000" # 52 million tokens with 6 decimals (52,000,000 * 1,000,000)
VALIDATOR_NAME="validator"
KEY_NAME="alice"
MONIKER="poker-validator"
HOME_DIR="$HOME/.poker"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Check if Ignite CLI is installed
check_ignite() {
    if ! command -v ignite &> /dev/null; then
        print_error "Ignite CLI is not installed. Please install it first:"
        echo "curl https://get.ignite.com/cli@v0.27.2! | bash"
        echo "or visit: https://docs.ignite.com/guide/install"
        exit 1
    fi
    
    local version=$(ignite version 2>/dev/null | head -n1 || echo "unknown")
    print_status "Ignite CLI found: $version"
}

# Check if Go is installed
check_go() {
    if ! command -v go &> /dev/null; then
        print_error "Go is not installed. Please install Go 1.19+ first:"
        echo "https://golang.org/doc/install"
        exit 1
    fi
    
    local version=$(go version)
    print_status "Go found: $version"
}

# Clean up existing chain data
cleanup() {
    print_header "Cleaning Up Previous Installation"
    
    if [ -d "$HOME_DIR" ]; then
        print_warning "Removing existing chain data at $HOME_DIR"
        rm -rf "$HOME_DIR"
    fi
    
    # Kill any running poker chain processes
    pkill -f "pokerd" || true
    
    print_status "Cleanup completed"
}

# Create new blockchain
create_blockchain() {
    print_header "Creating New Blockchain"
    
    # Remove existing project directory if it exists
    if [ -d "./poker" ]; then
        print_warning "Removing existing poker project directory"
        rm -rf "./poker"
    fi
    
    print_status "Creating new blockchain project with Ignite..."
    ignite scaffold chain poker --no-module
    
    cd poker
    print_status "Blockchain project created successfully"
}

# Configure genesis
configure_genesis() {
    print_header "Configuring Genesis"
    
    # Initialize the chain
    print_status "Initializing chain with ID: $CHAIN_ID"
    ./pokerd init $MONIKER --chain-id $CHAIN_ID --home $HOME_DIR
    
    # Create a key for the validator
    print_status "Creating validator key: $KEY_NAME"
    ./pokerd keys add $KEY_NAME --home $HOME_DIR --keyring-backend test
    
    # Add genesis account with 52 million tokens
    print_status "Adding genesis account with $GENESIS_AMOUNT $TOKEN_DENOM tokens"
    ./pokerd add-genesis-account $KEY_NAME ${GENESIS_AMOUNT}${TOKEN_DENOM} --home $HOME_DIR --keyring-backend test
    
    # Create genesis transaction
    print_status "Creating genesis transaction"
    ./pokerd gentx $KEY_NAME 1000000${TOKEN_DENOM} --chain-id $CHAIN_ID --home $HOME_DIR --keyring-backend test
    
    # Collect genesis transactions
    print_status "Collecting genesis transactions"
    ./pokerd collect-gentxs --home $HOME_DIR
    
    # Validate genesis
    print_status "Validating genesis file"
    ./pokerd validate-genesis --home $HOME_DIR
}

# Configure chain settings
configure_chain() {
    print_header "Configuring Chain Settings"
    
    # Configure app.toml
    local app_toml="$HOME_DIR/config/app.toml"
    if [ -f "$app_toml" ]; then
        print_status "Configuring app.toml"
        
        # Enable API
        sed -i.bak 's/enable = false/enable = true/' "$app_toml"
        sed -i.bak 's/swagger = false/swagger = true/' "$app_toml"
        
        # Configure GRPC
        sed -i.bak 's/address = "0.0.0.0:9090"/address = "0.0.0.0:9090"/' "$app_toml"
    fi
    
    # Configure config.toml
    local config_toml="$HOME_DIR/config/config.toml"
    if [ -f "$config_toml" ]; then
        print_status "Configuring config.toml"
        
        # Enable RPC
        sed -i.bak 's/laddr = "tcp:\/\/127.0.0.1:26657"/laddr = "tcp:\/\/0.0.0.0:26657"/' "$config_toml"
        
        # Configure CORS
        sed -i.bak 's/cors_allowed_origins = \[\]/cors_allowed_origins = ["*"]/' "$config_toml"
        
        # Faster blocks for development
        sed -i.bak 's/timeout_commit = "5s"/timeout_commit = "1s"/' "$config_toml"
    fi
    
    print_status "Chain configuration completed"
}

# Create systemd service (optional)
create_service() {
    print_header "Creating Systemd Service"
    
    local service_file="/etc/systemd/system/pokerd.service"
    
    if [ "$EUID" -eq 0 ]; then
        print_status "Creating systemd service file"
        
        cat > "$service_file" << EOF
[Unit]
Description=Poker VM Daemon
After=network-online.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME
ExecStart=$(pwd)/pokerd start --home $HOME_DIR
Restart=on-failure
RestartSec=3
LimitNOFILE=4096

[Install]
WantedBy=multi-user.target
EOF
        
        systemctl daemon-reload
        systemctl enable pokerd
        print_status "Systemd service created and enabled"
    else
        print_warning "Not running as root, skipping systemd service creation"
        print_status "To create the service later, run this script with sudo"
    fi
}

# Start the chain
start_chain() {
    print_header "Starting Blockchain"
    
    print_status "Starting poker daemon..."
    print_warning "This will run in the foreground. Use Ctrl+C to stop, or run in background with &"
    print_status "RPC endpoint will be available at: http://localhost:26657"
    print_status "REST API will be available at: http://localhost:1317"
    print_status "GRPC endpoint will be available at: localhost:9090"
    
    echo ""
    print_status "Chain ID: $CHAIN_ID"
    print_status "Token Denom: $TOKEN_DENOM"
    print_status "Genesis Amount: $GENESIS_AMOUNT $TOKEN_DENOM"
    print_status "Validator Key: $KEY_NAME"
    print_status "Home Directory: $HOME_DIR"
    echo ""
    
    # Get the validator address
    local validator_address=$(./pokerd keys show $KEY_NAME --address --home $HOME_DIR --keyring-backend test)
    print_status "Validator Address: $validator_address"
    
    echo ""
    print_status "Starting chain..."
    ./pokerd start --home $HOME_DIR
}

# Show chain info
show_info() {
    print_header "Chain Information"
    
    echo -e "${BLUE}Chain Configuration:${NC}"
    echo "  Chain ID: $CHAIN_ID"
    echo "  Token Denom: $TOKEN_DENOM"
    echo "  Genesis Amount: $GENESIS_AMOUNT $TOKEN_DENOM (52 million tokens)"
    echo "  Validator Name: $VALIDATOR_NAME"
    echo "  Key Name: $KEY_NAME"
    echo "  Home Directory: $HOME_DIR"
    echo ""
    
    echo -e "${BLUE}Endpoints:${NC}"
    echo "  RPC: http://localhost:26657"
    echo "  REST API: http://localhost:1317"
    echo "  GRPC: localhost:9090"
    echo ""
    
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "  Check balance: ./pokerd query bank balances \$(./pokerd keys show $KEY_NAME --address --home $HOME_DIR --keyring-backend test) --home $HOME_DIR"
    echo "  Send tokens: ./pokerd tx bank send $KEY_NAME <recipient> 1000000$TOKEN_DENOM --chain-id $CHAIN_ID --home $HOME_DIR --keyring-backend test"
    echo "  Query status: ./pokerd status --home $HOME_DIR"
    echo ""
    
    if [ -f "./pokerd" ]; then
        echo -e "${BLUE}Validator Address:${NC}"
        ./pokerd keys show $KEY_NAME --address --home $HOME_DIR --keyring-backend test 2>/dev/null || echo "Run this script first to get the address"
    fi
}

# Main execution
main() {
    print_header "Poker VM Cosmos SDK Setup"
    
    # Parse command line arguments
    case "${1:-setup}" in
        "setup")
            check_ignite
            check_go
            cleanup
            create_blockchain
            configure_genesis
            configure_chain
            show_info
            echo ""
            print_status "Setup completed! Run './setup-cosmos.sh start' to start the chain"
            ;;
        "start")
            if [ ! -f "./poker/pokerd" ]; then
                print_error "Chain not found. Run './setup-cosmos.sh setup' first"
                exit 1
            fi
            cd poker
            start_chain
            ;;
        "restart")
            cd poker 2>/dev/null || { print_error "Chain not found. Run setup first"; exit 1; }
            pkill -f "pokerd" || true
            sleep 2
            start_chain
            ;;
        "stop")
            print_status "Stopping poker daemon..."
            pkill -f "pokerd" || true
            print_status "Poker daemon stopped"
            ;;
        "status")
            if [ -f "./poker/pokerd" ]; then
                cd poker
                ./pokerd status --home $HOME_DIR 2>/dev/null || print_warning "Chain is not running"
            else
                print_error "Chain not found. Run setup first"
            fi
            ;;
        "clean")
            cleanup
            if [ -d "./poker" ]; then
                rm -rf "./poker"
            fi
            print_status "All chain data cleaned"
            ;;
        "info")
            show_info
            ;;
        "service")
            if [ -f "./poker/pokerd" ]; then
                cd poker
                create_service
            else
                print_error "Chain not found. Run setup first"
            fi
            ;;
        "help"|"--help"|"-h")
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  setup     - Set up the blockchain (default)"
            echo "  start     - Start the blockchain"
            echo "  restart   - Restart the blockchain"
            echo "  stop      - Stop the blockchain"
            echo "  status    - Check blockchain status"
            echo "  clean     - Clean all data and start fresh"
            echo "  info      - Show chain information"
            echo "  service   - Create systemd service (requires sudo)"
            echo "  help      - Show this help message"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"