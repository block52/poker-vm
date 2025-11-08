#!/bin/bash

################################################################################
# Update SDK Dependencies in PVM and UI
#
# This script updates the local SDK dependency in PVM and UI projects after
# regenerating proto types. It ensures both projects use the latest SDK.
#
# Usage:
#   ./update-dependencies.sh [--pvm-only] [--ui-only]
#
# Options:
#   --pvm-only    Only update PVM dependencies
#   --ui-only     Only update UI dependencies
#   --help        Show this help message
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
PVM_DIR="$SDK_DIR/../pvm/ts"
UI_DIR="$SDK_DIR/../ui"

# Parse command line arguments
UPDATE_PVM=true
UPDATE_UI=true

for arg in "$@"; do
    case $arg in
        --pvm-only)
            UPDATE_UI=false
            shift
            ;;
        --ui-only)
            UPDATE_PVM=false
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

update_project() {
    local project_name=$1
    local project_dir=$2

    print_header "Updating $project_name Dependencies"

    if [ ! -d "$project_dir" ]; then
        print_error "Directory not found: $project_dir"
        return 1
    fi

    cd "$project_dir"

    # Remove existing SDK symlink/files
    print_info "Removing existing SDK link in node_modules..."
    rm -rf node_modules/@bitcoinbrisbane/block52

    # Also remove lockfile for clean install
    if [ -f "yarn.lock" ]; then
        print_info "Removing yarn.lock for clean install..."
        rm yarn.lock
    fi

    # Reinstall dependencies
    print_info "Running yarn install..."
    if yarn install; then
        print_success "$project_name dependencies updated successfully"

        # Verify SDK was linked
        if [ -d "node_modules/@bitcoinbrisbane/block52" ]; then
            print_success "SDK linked successfully in $project_name"

            # Check if dist exists in linked SDK
            if [ -d "node_modules/@bitcoinbrisbane/block52/dist" ]; then
                print_success "SDK dist/ directory found (SDK is built)"
            else
                print_warning "SDK dist/ directory not found - SDK may not be built"
            fi
        else
            print_error "SDK not found in node_modules after install"
            return 1
        fi
    else
        print_error "Failed to update $project_name dependencies"
        return 1
    fi

    return 0
}

################################################################################
# Main Execution
################################################################################

print_header "SDK Dependency Update"

# Check SDK is built
if [ ! -d "$SDK_DIR/dist" ]; then
    print_warning "SDK dist/ directory not found"
    print_info "Building SDK first..."
    cd "$SDK_DIR"
    yarn build
fi

# Update PVM
if [ "$UPDATE_PVM" = true ]; then
    if update_project "PVM" "$PVM_DIR"; then
        print_success "PVM updated successfully"
    else
        print_error "Failed to update PVM"
        exit 1
    fi
else
    print_info "Skipping PVM (--ui-only flag set)"
fi

# Update UI
if [ "$UPDATE_UI" = true ]; then
    if update_project "UI" "$UI_DIR"; then
        print_success "UI updated successfully"
    else
        print_error "Failed to update UI"
        exit 1
    fi
else
    print_info "Skipping UI (--pvm-only flag set)"
fi

################################################################################
# Display Summary
################################################################################

print_header "Summary"

echo ""
echo -e "${GREEN}All dependencies updated successfully!${NC}"
echo ""
echo "Projects updated:"
if [ "$UPDATE_PVM" = true ]; then
    echo "  ✅ PVM (poker-vm/pvm/ts)"
fi
if [ "$UPDATE_UI" = true ]; then
    echo "  ✅ UI (poker-vm/ui)"
fi
echo ""

print_header "Verification Steps"

echo ""
if [ "$UPDATE_PVM" = true ]; then
    echo "1. Test PVM build:"
    echo "   ${BLUE}cd $PVM_DIR && yarn build${NC}"
    echo ""
fi

if [ "$UPDATE_UI" = true ]; then
    echo "2. Test UI dev server:"
    echo "   ${BLUE}cd $UI_DIR && yarn dev${NC}"
    echo ""
fi

echo "3. Verify SDK types are correct:"
echo "   ${BLUE}cd $PVM_DIR${NC}"
echo "   ${BLUE}node -e \"const sdk = require('@bitcoinbrisbane/block52'); console.log(sdk.COSMOS_CONSTANTS);\"${NC}"
echo ""

print_success "All done! 🎉"
echo ""
