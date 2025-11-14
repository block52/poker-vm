# Poker VM Docker Management
.PHONY: help build up down logs restart clean status health

# Default target
help:
	@echo "Available commands:"
	@echo "  build     - Build all Docker images"
	@echo "  up        - Start all services"
	@echo "  down      - Stop all services"
	@echo "  logs      - View logs from all services"
	@echo "  restart   - Restart all services"
	@echo "  clean     - Clean up containers, images, and volumes"
	@echo "  status    - Show status of all containers"
	@echo "  health    - Check health of all services"

# Build all images
build:
	@echo "Building Docker images..."
	docker compose build --no-cache

# Start services
up:
	@echo "Starting services..."
	docker compose up -d --remove-orphans

# Start services and show logs
up-logs:
	@echo "Starting services with logs..."
	docker compose up --remove-orphans

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