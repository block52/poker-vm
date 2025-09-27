# Docker Setup Guide

This guide explains how to run the entire Poker VM stack using Docker.

## Quick Start

1. **Clone and navigate to the repository:**

    ```bash
    git clone https://github.com/block52/poker-vm.git
    cd poker-vm
    ```

2. **Set up environment variables:**

    ```bash
    cp .env.example .env
    # Edit .env with your specific configuration
    ```

3. **Start all services:**

    ```bash
    make up
    # OR
    docker compose up -d
    ```

4. **Access the services:**
    - 🎰 **Frontend UI**: http://localhost:5173
    - 🔧 **PVM API**: http://localhost:8545
    - 🔧 **API Health**: http://localhost:8545/health
    - 🗄️ **MongoDB**: mongodb://localhost:27017
    - 🔄 **Redis**: redis://localhost:6379

## Services Overview

### PVM (Poker Virtual Machine)

-   **Port**: 8545
-   **Description**: Core blockchain node and poker engine
-   **Technology**: Node.js + TypeScript + Express
-   **Health Check**: `/health` endpoint

### Frontend UI

-   **Port**: 5173 (development) / 80 (production)
-   **Description**: React-based poker interface
-   **Technology**: React + Vite + TypeScript
-   **Environment**: Development mode with hot reload

### MongoDB Database

-   **Port**: 27017
-   **Description**: Primary database for game state
-   **Credentials**: `node1:Passw0rd123`
-   **Database**: `pvm`

### Redis Cache

-   **Port**: 6379
-   **Description**: Caching and session management
-   **Password**: `Passw0rd123`

## Development Workflow

### Starting Services

```bash
# Start all services in development mode
make dev

# Start with logs visible
docker compose up

# Start specific services
make up-pvm
make up-frontend
```

### Viewing Logs

```bash
# All services
make logs

# Specific service
make logs-pvm
make logs-frontend
```

### Database Access

```bash
# MongoDB shell
make mongo-shell

# Redis CLI
make redis-cli
```

### Health Checks

```bash
# Check all services
make health

# Manual health check
curl http://localhost:8545/health
```

## Environment Configuration

Key environment variables in `.env`:

```bash
# Development/Production mode
NODE_ENV=development

# PVM Configuration
VALIDATOR_KEY=your_validator_key
RPC_URL=https://mainnet.g.alchemy.com/v2/your_key
PK=your_private_key

# Frontend Configuration
VITE_PROJECT_ID=your_project_id
VITE_MAINNET_RPC_URL=https://mainnet.infura.io/v3/your_key
VITE_CLUB_NAME="Your Club Name"
```

## Production Deployment

### Production Build

```bash
# Build for production
NODE_ENV=production make prod

# Or manually
NODE_ENV=production docker compose up -d --build
```

### Production Features

-   ✅ Multi-stage Docker builds
-   ✅ Nginx serving static files
-   ✅ Non-root container users
-   ✅ Health checks for all services
-   ✅ Proper dependency management
-   ✅ Volume persistence

## Troubleshooting

### Common Issues

1. **Port conflicts:**

    ```bash
    # Check what's using the ports
    lsof -i :8545 -i :5173 -i :27017 -i :6379

    # Stop conflicting services or change ports in docker-compose.yaml
    ```

2. **Permission issues:**

    ```bash
    # Reset Docker volumes
    make clean
    make up
    ```

3. **Build failures:**

    ```bash
    # Clean build
    docker compose build --no-cache
    ```

4. **Database connection issues:**

    ```bash
    # Check MongoDB logs
    make logs-mongo

    # Reset database
    make reset-data
    ```

### Health Check Failures

```bash
# Check individual service health
curl -f http://localhost:8545/health
curl -f http://localhost:5173

# Check container status
docker compose ps

# Check logs for errors
make logs
```

### Data Management

```bash
# Reset all data (DESTRUCTIVE)
make reset-data

# Backup database
docker compose exec mongo mongodump --out /data/backup

# View data volumes
docker volume ls | grep poker-vm
```

## Available Commands

| Command        | Description                     |
| -------------- | ------------------------------- |
| `make help`    | Show all available commands     |
| `make build`   | Build all Docker images         |
| `make up`      | Start all services              |
| `make down`    | Stop all services               |
| `make logs`    | View logs from all services     |
| `make restart` | Restart all services            |
| `make clean`   | Clean up containers and volumes |
| `make dev`     | Start in development mode       |
| `make prod`    | Start in production mode        |
| `make status`  | Show container status           |
| `make health`  | Check service health            |

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │       PVM       │
│   (React/Vite)  │◄──►│  (Node.js/TS)   │
│   Port: 5173    │    │   Port: 8545    │
└─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │     MongoDB     │
                    │   Port: 27017   │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │      Redis      │
                    │   Port: 6379    │
                    └─────────────────┘
```

## Security Notes

-   🔒 Default passwords should be changed in production
-   🔒 MongoDB and Redis are not exposed externally in production
-   🔒 Environment variables should be properly secured
-   🔒 Consider using Docker secrets for sensitive data
