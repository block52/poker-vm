.PHONY: build run dev clean test deps

# Binary name
BINARY_NAME=telegram-chat

# Build the application
build:
	go build -o bin/$(BINARY_NAME) ./cmd/server

# Run the application
run: build
	./bin/$(BINARY_NAME)

# Run in development mode with hot reload (requires air)
dev:
	air

# Install dependencies
deps:
	go mod download
	go mod tidy

# Clean build artifacts
clean:
	rm -rf bin/
	go clean

# Run tests
test:
	go test -v ./...

# Format code
fmt:
	go fmt ./...

# Lint code (requires golangci-lint)
lint:
	golangci-lint run

# Build for Docker
docker-build:
	docker build -t telegram-chat .

# Run with Docker
docker-run:
	docker run -p 8080:8080 --env-file .env telegram-chat
