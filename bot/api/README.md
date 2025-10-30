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
go run .
```

### With Makefile

If you prefer, use the provided Makefile:

```sh
make run
```

Or build the binary (includes all Go files):

```sh
make build
```

Or directly with Go:

```sh
go build -o api .
```

The API will be available at [http://localhost:8080/bots](http://localhost:8080/bots)

## Install API

````sh
sudo useradd -r -s /bin/false apiuser
sudo mkdir -p /opt/bot-api/{logs,data}
sudo chown -R apiuser:apiuser /opt/bot-api
make build
sudo cp api /opt/bot-api/api
sudo chown apiuser:apiuser /opt/bot-api/api
sudo chmod +x /opt/bot-api/api

sudo cp api.service /etc/systemd/system/
sudo systemctl daemon-reload
``sh

## Starting service

```sh
sudo systemctl enable api
sudo systemctl start api
````
