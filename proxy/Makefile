.PHONY: build up down logs restart clean

# Build the Docker images
build:
	docker compose build

# Start the Docker containers
up:
	docker compose up -d

# Stop the Docker containers
down:
	docker compose down

# View the Docker logs
logs:
	docker compose logs -f

# Restart the Docker containers
restart:
	docker compose restart

# Clean up Docker resources
clean:
	docker compose down -v
	docker system prune -f