#!/bin/bash

################################################################################
# Proto Type Regeneration Script for SDK
#
# This script regenerates TypeScript proto types from Pokerchain and updates
# the SDK with the latest types. It ensures correct encoding, decoding, and
# signing for Cosmos transactions.
#
# Usage:
#   ./regenerate-proto-types.sh [--skip-backup] [--skip-rebuild]
#
# Options:
#   --skip-backup    Skip creating backup of current types
#   --skip-rebuild   Skip rebuilding SDK after copying types
#   --help           Show this help message
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SDK_DIR="$SCRIPT_DIR"
POKERCHAIN_DIR="$SDK_DIR/../../pokerchain"
TS_CLIENT_DIR="$POKERCHAIN_DIR/ts-client"

# Directories to sync
POKER_MODULE="pokerchain.poker.v1"
COSMOS_MODULES=(
    "cosmos.auth.v1beta1"
    "cosmos.bank.v1beta1"
    "cosmos.tx.v1beta1"
)

# Parse command line arguments
SKIP_BACKUP=false
SKIP_REBUILD=false

for arg in "$@"; do
    case $arg in
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --skip-rebuild)
            SKIP_REBUILD=true
            shift
            ;;
        --help)
            head -n 15 "$0" | tail -n 13
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $arg${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_directory() {
    if [ ! -d "$1" ]; then
        print_error "Directory not found: $1"
        exit 1
    fi
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_error "Required command not found: $1"
        print_info "Please install $1 and try again"
        exit 1
    fi
}

################################################################################
# Pre-flight Checks
################################################################################

print_header "Proto Type Regeneration - Pre-flight Checks"

# Check required directories exist
print_info "Checking directories..."
check_directory "$SDK_DIR"
check_directory "$POKERCHAIN_DIR"

# Check required commands
print_info "Checking required tools..."
check_command "ignite"
check_command "yarn"
check_command "git"

# Check we're in the right directory
if [ ! -f "$SDK_DIR/package.json" ]; then
    print_error "Not in SDK directory (package.json not found)"
    exit 1
fi

print_success "All pre-flight checks passed"

################################################################################
# Create Backup
################################################################################

if [ "$SKIP_BACKUP" = false ]; then
    print_header "Creating Backup of Current Types"

    BACKUP_DIR="$SDK_DIR/.backup/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    if [ -d "$SDK_DIR/src/$POKER_MODULE" ]; then
        cp -r "$SDK_DIR/src/$POKER_MODULE" "$BACKUP_DIR/"
        print_success "Backed up $POKER_MODULE to $BACKUP_DIR"
    else
        print_warning "No existing $POKER_MODULE to backup"
    fi

    # Save backup location for potential rollback
    echo "$BACKUP_DIR" > "$SDK_DIR/.last_backup"
else
    print_warning "Skipping backup (--skip-backup flag set)"
fi

################################################################################
# Generate TypeScript Client from Pokerchain
################################################################################

print_header "Generating TypeScript Client from Pokerchain"

cd "$POKERCHAIN_DIR"

print_info "Running: ignite generate ts-client --yes"
print_info "This may take a minute..."

if ignite generate ts-client --yes; then
    print_success "TypeScript client generated successfully"
else
    print_error "Failed to generate TypeScript client"
    exit 1
fi

# Verify ts-client directory was created
if [ ! -d "$TS_CLIENT_DIR" ]; then
    print_error "ts-client directory not found after generation"
    exit 1
fi

# Verify poker module was generated
if [ ! -d "$TS_CLIENT_DIR/$POKER_MODULE" ]; then
    print_error "Poker module not found in generated client: $TS_CLIENT_DIR/$POKER_MODULE"
    exit 1
fi

print_success "Generated files found in $TS_CLIENT_DIR"

################################################################################
# Copy Generated Types to SDK
################################################################################

print_header "Copying Generated Types to SDK"

cd "$SDK_DIR"

# Remove old poker module
if [ -d "src/$POKER_MODULE" ]; then
    print_info "Removing old $POKER_MODULE..."
    rm -rf "src/$POKER_MODULE"
fi

# Copy new poker module
print_info "Copying new $POKER_MODULE..."
cp -r "$TS_CLIENT_DIR/$POKER_MODULE" "src/"

if [ -d "src/$POKER_MODULE" ]; then
    print_success "Copied $POKER_MODULE to SDK"
else
    print_error "Failed to copy $POKER_MODULE"
    exit 1
fi

# Optional: Update standard Cosmos modules if they exist in ts-client
print_info "Checking for Cosmos module updates..."
for module in "${COSMOS_MODULES[@]}"; do
    if [ -d "$TS_CLIENT_DIR/$module" ]; then
        print_info "Updating $module..."
        rm -rf "src/$module" 2>/dev/null || true
        cp -r "$TS_CLIENT_DIR/$module" "src/"
        print_success "Updated $module"
    fi
done

################################################################################
# Verify Generated Types
################################################################################

print_header "Verifying Generated Types"

# Check key files exist
KEY_FILES=(
    "src/$POKER_MODULE/module.ts"
    "src/$POKER_MODULE/registry.ts"
    "src/$POKER_MODULE/types/pokerchain/poker/v1/tx.ts"
    "src/$POKER_MODULE/types/pokerchain/poker/v1/query.ts"
)

for file in "${KEY_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "Found: $file"
    else
        print_error "Missing: $file"
        exit 1
    fi
done

# Check for expected message types
print_info "Checking for message types..."
if grep -q "MsgCreateGame" "src/$POKER_MODULE/module.ts"; then
    print_success "Found MsgCreateGame"
else
    print_warning "MsgCreateGame not found in module.ts"
fi

if grep -q "MsgJoinGame" "src/$POKER_MODULE/module.ts"; then
    print_success "Found MsgJoinGame"
else
    print_warning "MsgJoinGame not found in module.ts"
fi

if grep -q "MsgMint" "src/$POKER_MODULE/module.ts"; then
    print_success "Found MsgMint (bridge message)"
else
    print_warning "MsgMint not found - may not be implemented yet"
fi

################################################################################
# Rebuild SDK
################################################################################

if [ "$SKIP_REBUILD" = false ]; then
    print_header "Rebuilding SDK"

    print_info "Running: yarn build"

    if yarn build; then
        print_success "SDK built successfully"
    else
        print_error "SDK build failed"
        print_warning "You may need to fix import errors manually"

        # Offer to rollback
        if [ -f "$SDK_DIR/.last_backup" ]; then
            LAST_BACKUP=$(cat "$SDK_DIR/.last_backup")
            echo ""
            print_warning "Would you like to rollback to the backup? (y/n)"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                rm -rf "src/$POKER_MODULE"
                cp -r "$LAST_BACKUP/$POKER_MODULE" "src/"
                print_success "Rolled back to previous types"
                yarn build
            fi
        fi
        exit 1
    fi
else
    print_warning "Skipping rebuild (--skip-rebuild flag set)"
    print_info "Don't forget to run 'yarn build' manually!"
fi

################################################################################
# Display Summary
################################################################################

print_header "Summary"

echo ""
echo -e "${GREEN}Proto type regeneration completed successfully!${NC}"
echo ""
echo "Changes made:"
echo "  • Generated fresh TypeScript types from Pokerchain"
echo "  • Updated SDK poker module: src/$POKER_MODULE"
if [ "$SKIP_BACKUP" = false ]; then
    echo "  • Created backup: $BACKUP_DIR"
fi
if [ "$SKIP_REBUILD" = false ]; then
    echo "  • Rebuilt SDK successfully"
fi
echo ""

print_header "Next Steps"

echo ""
echo "1. Review the changes:"
echo "   ${BLUE}git diff src/$POKER_MODULE${NC}"
echo ""
echo "2. Update PVM dependencies:"
echo "   ${BLUE}cd ../pvm/ts && rm -rf node_modules/@bitcoinbrisbane/block52 && yarn install${NC}"
echo ""
echo "3. Update UI dependencies:"
echo "   ${BLUE}cd ../../ui && rm -rf node_modules/@bitcoinbrisbane/block52 && yarn install${NC}"
echo ""
echo "4. Test the SDK:"
echo "   ${BLUE}cd ../sdk && yarn test${NC}"
echo ""
echo "5. Test in PVM:"
echo "   ${BLUE}cd ../pvm/ts && yarn build${NC}"
echo ""
echo "6. Test in UI:"
echo "   ${BLUE}cd ../../ui && yarn dev${NC}"
echo ""

if [ "$SKIP_BACKUP" = false ]; then
    print_info "If something goes wrong, restore from backup:"
    echo "   ${BLUE}rm -rf src/$POKER_MODULE${NC}"
    echo "   ${BLUE}cp -r $BACKUP_DIR/$POKER_MODULE src/${NC}"
    echo "   ${BLUE}yarn build${NC}"
fi

echo ""
print_success "All done! 🎉"
echo ""
