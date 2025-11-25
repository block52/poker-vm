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

## Services Overview

### PVM (Poker Virtual Machine)

-   **Port**: 8545
-   **Description**: Core blockchain node and poker engine
-   **Technology**: Node.js + TypeScript + Express
-   **Health Check**: `/health` endpoint

### Frontend UI

-   **Port**: 5173
-   **Description**: React-based poker interface
-   **Technology**: React + Vite + TypeScript
-   **Mode**: Development server with hot reload

## Development Workflow

### Starting Services

```bash
# Start all services
make up

# Start with logs visible
docker compose up

# Build and start
make build && make up
```

### Viewing Logs

```bash
# All services
make logs

# Specific service logs
docker compose logs -f pvm
docker compose logs -f frontend
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
# Frontend Configuration
VITE_PROJECT_ID=your_project_id
VITE_MAINNET_RPC_URL=https://mainnet.infura.io/v3/your_key
VITE_CLUB_NAME="Your Club Name"
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**

    ```bash
    # Check what's using the ports
    lsof -i :8545 -i :5173

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

## Available Commands

| Command       | Description                     |
| ------------- | ------------------------------- |
| `make build`  | Build all Docker images         |
| `make up`     | Start all services              |
| `make down`   | Stop all services               |
| `make logs`   | View logs from all services     |
| `make clean`  | Clean up containers and volumes |
| `make health` | Check service health            |

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │       PVM       │
│   (React/Vite)  │◄──►│  (Node.js/TS)   │
│   Port: 5173    │    │   Port: 8545    │
└─────────────────┘    └─────────────────┘
```

## Security Notes

-   🔒 Default passwords should be changed in production
-   🔒 Environment variables should be properly secured
-   🔒 Consider using Docker secrets for sensitive data
