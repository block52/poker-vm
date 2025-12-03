#!/bin/bash

# Block52 Poker Desktop Build Script
# This script builds the UI and packages it as a desktop application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$DESKTOP_DIR")"
UI_DIR="$ROOT_DIR/ui"
APP_DIR="$DESKTOP_DIR/app"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Block52 Poker Desktop Builder${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Parse arguments
BUILD_TARGET=""
SKIP_UI_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --mac)
            BUILD_TARGET="mac"
            shift
            ;;
        --win)
            BUILD_TARGET="win"
            shift
            ;;
        --linux)
            BUILD_TARGET="linux"
            shift
            ;;
        --all)
            BUILD_TARGET="all"
            shift
            ;;
        --skip-ui)
            SKIP_UI_BUILD=true
            shift
            ;;
        --help)
            echo "Usage: ./build.sh [options]"
            echo ""
            echo "Options:"
            echo "  --mac      Build for macOS"
            echo "  --win      Build for Windows"
            echo "  --linux    Build for Linux"
            echo "  --all      Build for all platforms"
            echo "  --skip-ui  Skip UI build (use existing)"
            echo "  --help     Show this help message"
            echo ""
            echo "If no target is specified, only the UI will be built and copied."
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Step 1: Build UI
if [ "$SKIP_UI_BUILD" = false ]; then
    echo -e "${YELLOW}Step 1: Building UI...${NC}"
    echo "  UI directory: $UI_DIR"

    if [ ! -d "$UI_DIR" ]; then
        echo -e "${RED}Error: UI directory not found at $UI_DIR${NC}"
        exit 1
    fi

    cd "$UI_DIR"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}  Installing UI dependencies...${NC}"
        yarn install
    fi

    # Build UI
    echo -e "${YELLOW}  Running yarn build...${NC}"
    yarn build

    if [ ! -d "build" ]; then
        echo -e "${RED}Error: UI build failed - build directory not found${NC}"
        exit 1
    fi

    echo -e "${GREEN}  UI build complete!${NC}"
else
    echo -e "${YELLOW}Step 1: Skipping UI build (--skip-ui flag)${NC}"
fi

# Step 2: Copy UI build to desktop app directory
echo ""
echo -e "${YELLOW}Step 2: Copying UI build to desktop app...${NC}"

# Remove old app directory
if [ -d "$APP_DIR" ]; then
    echo "  Removing old app directory..."
    rm -rf "$APP_DIR"
fi

# Copy UI build
echo "  Copying from: $UI_DIR/build"
echo "  Copying to: $APP_DIR"
cp -r "$UI_DIR/build" "$APP_DIR"

echo -e "${GREEN}  UI copied successfully!${NC}"

# Step 3: Install desktop dependencies
echo ""
echo -e "${YELLOW}Step 3: Installing desktop dependencies...${NC}"

cd "$DESKTOP_DIR"

if [ ! -d "node_modules" ]; then
    yarn install
else
    echo "  Dependencies already installed"
fi

echo -e "${GREEN}  Dependencies ready!${NC}"

# Step 4: Build desktop app (if target specified)
if [ -n "$BUILD_TARGET" ]; then
    echo ""
    echo -e "${YELLOW}Step 4: Building desktop application...${NC}"

    case $BUILD_TARGET in
        mac)
            echo "  Building for macOS..."
            yarn dist:mac
            ;;
        win)
            echo "  Building for Windows..."
            yarn dist:win
            ;;
        linux)
            echo "  Building for Linux..."
            yarn dist:linux
            ;;
        all)
            echo "  Building for all platforms..."
            yarn dist
            ;;
    esac

    echo -e "${GREEN}  Desktop build complete!${NC}"
    echo ""
    echo -e "${GREEN}Build artifacts are in: $DESKTOP_DIR/dist${NC}"
else
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Build Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "To run the desktop app in development mode:"
    echo -e "  ${BLUE}cd desktop && yarn start:dev${NC}"
    echo ""
    echo "To build for distribution:"
    echo -e "  ${BLUE}./scripts/build.sh --mac${NC}     # macOS"
    echo -e "  ${BLUE}./scripts/build.sh --win${NC}     # Windows"
    echo -e "  ${BLUE}./scripts/build.sh --linux${NC}   # Linux"
    echo -e "  ${BLUE}./scripts/build.sh --all${NC}     # All platforms"
fi
