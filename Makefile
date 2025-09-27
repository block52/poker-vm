# Poker VM Docker Management
.PHONY: help build up down logs restart clean dev prod status health

# Default target
help:
	@echo "Available commands:"
	@echo "  build     - Build all Docker images"
	@echo "  up        - Start all services (development mode)"
	@echo "  down      - Stop all services"
	@echo "  logs      - View logs from all services"
	@echo "  restart   - Restart all services"
	@echo "  clean     - Clean up containers, images, and volumes"
	@echo "  dev       - Start in development mode with hot reload"
	@echo "  prod      - Start in production mode"
	@echo "  status    - Show status of all containers"
	@echo "  health    - Check health of all services"

# Build all images
build:
	@echo "Building Docker images..."
	docker compose build --no-cache

# Start services in development mode (default)
up:
	@echo "Starting services in development mode..."
	docker compose up -d

# Start services and show logs
up-logs:
	@echo "Starting services with logs..."
	docker compose up

# Stop all services
down:
	@echo "Stopping all services..."
	docker compose down

# View logs from all services
logs:
	@echo "Showing logs from all services..."
	docker compose logs -f

# Restart all services
restart:
	@echo "Restarting all services..."
	docker compose restart

# Clean up everything
clean:
	@echo "Cleaning up containers, networks, and volumes..."
	docker compose down -v --remove-orphans
	docker system prune -f
	@echo "Cleanup completed"

# Development mode with hot reload
dev: export NODE_ENV=development
dev:
	@echo "Starting in development mode with hot reload..."
	docker compose up -d
	@echo "Services started. Access:"
	@echo "  PVM API: http://localhost:8545"
	@echo "  Frontend: http://localhost:5173"
	@echo "  MongoDB: mongodb://localhost:27017"

# Production mode
prod: export NODE_ENV=production
prod:
	@echo "Starting in production mode..."
	docker compose up -d --build
	@echo "Production services started"

# Show container status
status:
	@echo "Container status:"
	docker compose ps

# Health check for all services
health:
	@echo "Checking service health..."
	@echo "\n🔍 PVM Health Check:"
	@curl -s http://localhost:8545/health | jq . || echo "❌ PVM not responding"
	@echo "\n🔍 Frontend Health Check:"
	@curl -s http://localhost:5173 >/dev/null && echo "✅ Frontend is healthy" || echo "❌ Frontend not responding"
	@echo "\n🔍 MongoDB Health Check:"
	@docker compose exec mongo mongosh --quiet --eval "db.adminCommand('ping').ok" >/dev/null && echo "✅ MongoDB is healthy" || echo "❌ MongoDB not responding"
	@echo "\n🔍 Redis Health Check:"
	@docker compose exec redis redis-cli --raw incr ping >/dev/null && echo "✅ Redis is healthy" || echo "❌ Redis not responding"

# Individual service management
up-mongo:
	docker compose up -d mongo

up-redis:
	docker compose up -d redis

up-pvm:
	docker compose up -d pvm

up-frontend:
	docker compose up -d frontend

# Logs for individual services
logs-mongo:
	docker compose logs -f mongo

logs-redis:
	docker compose logs -f redis

logs-pvm:
	docker compose logs -f pvm

logs-frontend:
	docker compose logs -f frontend

# Database management
mongo-shell:
	@echo "Connecting to MongoDB shell..."
	docker compose exec mongo mongosh -u node1 -p Passw0rd123 --authenticationDatabase admin pvm

redis-cli:
	@echo "Connecting to Redis CLI..."
	docker compose exec redis redis-cli -a Passw0rd123

# Reset data
reset-data:
	@echo "⚠️  This will delete all data! Are you sure? (y/N)"
	@read -r confirm && [ "$$confirm" = "y" ] || exit 1
	docker compose down -v
	docker volume rm poker-vm_mongodb_data poker-vm_redis_data 2>/dev/null || true
	@echo "Data reset completed"