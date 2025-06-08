#!/bin/bash
#!/bin/bash

# MongoDB Collection Drop Script
# Drops the 'transactions' collection from a specified database

# Configuration
DB_NAME="pvm"  # Replace with your actual database name

TX_COLLECTION_NAME="transactions"
BLOCK_COLLECTION_NAME="blocks"
ACCOUNT_COLLECTION_NAME="accounts"
GAMESTATE_COLLECTION_NAME="gamestates"

MONGO_HOST="localhost"
MONGO_PORT="27017"

# Optional: MongoDB authentication (uncomment and configure if needed)
# MONGO_USER="username"
# MONGO_PASS="password"
# AUTH_DB="admin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check if mongosh is available (modern MongoDB shell)
if command -v mongosh &> /dev/null; then
    MONGO_CMD="mongosh"
    print_status "Using mongosh (modern MongoDB shell)"
elif command -v mongo &> /dev/null; then
    MONGO_CMD="mongo"
    print_status "Using mongo (legacy MongoDB shell)"
else
    print_error "Neither mongosh nor mongo command found. Please install MongoDB shell."
    exit 1
fi

# Confirmation prompt
print_warning "This will permanently delete the transactions collection from database '$DB_NAME'"
# Build connection string
CONNECTION_STRING="$MONGO_HOST:$MONGO_PORT/$DB_NAME"

# Build authentication parameters if needed
AUTH_PARAMS=""
if [[ -n "$MONGO_USER" ]] && [[ -n "$MONGO_PASS" ]]; then
    AUTH_PARAMS="--username $MONGO_USER --password $MONGO_PASS"
    if [[ -n "$AUTH_DB" ]]; then
        AUTH_PARAMS="$AUTH_PARAMS --authenticationDatabase $AUTH_DB"
    fi
fi

# Create the MongoDB command to drop the collection
TX_SCRIPT="db.${TX_COLLECTION_NAME}.drop()"
BLOCK_SCRIPT="db.'${BLOCK_COLLECTION_NAME}'.drop()"
ACCOUNT_SCRIPT="db.'${ACCOUNT_COLLECTION_NAME}'.drop()"
GAMESTATE_SCRIPT="db.'${GAMESTATE_COLLECTION_NAME}'.drop()"

print_status "Connecting to MongoDB at $CONNECTION_STRING..."
print_status "Dropping collection '$TX_COLLECTION_NAME'..."

# Execute the drop command
if $MONGO_CMD $AUTH_PARAMS $CONNECTION_STRING --eval "$TX_SCRIPT" --quiet; then
    print_status "Collection '$COLLECTION_NAME' has been successfully dropped from database '$DB_NAME'"
else
    print_error "Failed to drop collection '$TX_COLLECTION_NAME'"
    exit 1
fi

# Drop other collections
if $MONGO_CMD $AUTH_PARAMS $CONNECTION_STRING --eval "$BLOCK_SCRIPT" --quiet; then
    print_status "Collection '$BLOCK_COLLECTION_NAME' has been successfully dropped from database '$DB_NAME'"
else
    print_error "Failed to drop collection '$BLOCK_COLLECTION_NAME'"
fi

if $MONGO_CMD $AUTH_PARAMS $CONNECTION_STRING --eval "$ACCOUNT_SCRIPT" --quiet; then
    print_status "Collection '$ACCOUNT_COLLECTION_NAME' has been successfully dropped from database '$DB_NAME'"
else
    print_error "Failed to drop collection '$ACCOUNT_COLLECTION_NAME'"
fi

if $MONGO_CMD $AUTH_PARAMS $CONNECTION_STRING --eval "$GAMESTATE_SCRIPT" --quiet; then
    print_status "Collection '$GAMESTATE_COLLECTION_NAME' has been successfully dropped from database '$DB_NAME'"
else
    print_error "Failed to drop collection '$GAMESTATE_COLLECTION_NAME'"
fi

print_status "Operation completed successfully!"