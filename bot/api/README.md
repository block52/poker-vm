# Poker Bot API

A simple REST API for managing poker bots using Go, Gin, and MongoDB.

## Prerequisites

-   Go 1.18+
-   MongoDB instance (local or remote)

## Setup

1. Copy `.env.example` to `.env` and update the values if needed:
    ```sh
    cp .env.example .env
    # Edit .env as needed
    ```
2. Install dependencies:
    ```sh
    go get ./...
    go get github.com/joho/godotenv
    ```

## Running the API

### With Go

```sh
go run main.go
```

### With Makefile

If you prefer, use the provided Makefile:

```sh
make run
```

The API will be available at [http://localhost:8080/bots](http://localhost:8080/bots)
