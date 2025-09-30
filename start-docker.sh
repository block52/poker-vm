#!/bin/bash

# Poker VM Docker Startup Script
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🎰 Poker VM Docker Setup${NC}"
echo "=================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    if ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not available. Please install Docker Compose.${NC}"
        exit 1
    fi
fi

# Check if .env exists, if not copy from .env.example
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}📝 Please edit .env file with your configuration before proceeding.${NC}"
    echo -e "${YELLOW}   You can continue with defaults for local development.${NC}"
    read -p "Continue with default configuration? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}✅ Please edit .env file and run this script again.${NC}"
        exit 0
    fi
fi

echo -e "${GREEN}🚀 Starting Poker VM...${NC}"

# Start services
echo -e "${GREEN}🔧 Starting services...${NC}"
docker compose up -d --build

# Wait for services to start
echo -e "${GREEN}⏳ Waiting for services to start...${NC}"
sleep 10

# Check service health
echo -e "${GREEN}🔍 Checking service health...${NC}"

# Check if services are running
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Services are running!${NC}"
    
    echo -e "${GREEN}📍 Access your services:${NC}"
    echo "   🎰 Frontend: http://localhost:5173"
    echo "   🔧 PVM API: http://localhost:8545"
    echo "   🗄️  MongoDB: mongodb://localhost:27017"
    echo "   🔄 Redis: redis://localhost:6379"
    echo "   🔧 API Health: http://localhost:8545/health"
    
    echo -e "${GREEN}📋 Useful commands:${NC}"
    echo "   make logs    - View logs"
    echo "   make status  - Check status"
    echo "   make health  - Health check"
    echo "   make down    - Stop services"
    
else
    echo -e "${RED}❌ Some services failed to start. Check logs with: make logs${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Poker VM is ready!${NC}"