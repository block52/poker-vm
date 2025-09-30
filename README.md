# Poker VM

[![PVM UnitTests](https://github.com/block52/poker-vm/actions/workflows/main.yml/badge.svg)](https://github.com/block52/poker-vm/actions/workflows/main.yml)

The Layer 2 poker game virtual machine for the Block52 network.

![image](https://github.com/user-attachments/assets/29412b57-3419-4177-b265-1e74e7c7c2e9)

## Architecture

### CVM (Card Virtual Machine)

The CVM is a virtual card game machine that runs on the Block52 network, responsible for executing card game logic.

### PVM (Poker Virtual Machine)

The PVM runs inside the CVM and handles poker-specific game logic.

## Quick Start

### Prerequisites

-   Docker and Docker Compose
-   Git
-   Node.js 20+ (for local development)
-   Yarn

### Docker Setup (Recommended)

1. **Clone the repository:**

    ```bash
    git clone https://github.com/block52/poker-vm.git
    cd poker-vm
    ```

2. **Start with Docker (one command):**

    ```bash
    ./start-docker.sh
    ```

    Or manually:

    ```bash
    # Copy environment template
    cp .env.example .env

    # Start all services
    make up
    # OR
    docker compose up -d
    ```

3. **Access services:**
    - 🎰 **Poker UI**: http://localhost:5173
    - 🔧 **PVM API**: http://localhost:8545
    - 🔧 **API Health**: http://localhost:8545/health
    - 🗄️ **MongoDB**: mongodb://localhost:27017

### Manual Setup (Development)

## Development

### Local PVM Development

1. **Navigate to PVM directory:**

    ```bash
    cd pvm/ts
    ```

2. **Start local MongoDB:**

    ```bash
    docker compose up
    ```

3. **Start PVM application:**

    ```bash
    yarn install
    yarn run dev
    ```

4. **Local services:**
    - API: http://localhost:8545
    - MongoDB: `mongodb://node1:Passw0rd123@localhost:27017`

### Testing

Run unit tests:

```bash
cd pvm/ts
yarn test
```

### Building for Production

```bash
cd pvm/ts
yarn build
```

## Docker Deployment

### Quick Docker Setup

The easiest way to run the entire stack:

```bash
# One-command setup
./start-docker.sh

# Or step by step
cp .env.example .env  # Configure as needed
make up               # Start all services
make health           # Check service health
```

### Docker Services

| Service      | Port  | Description                                  |
| ------------ | ----- | -------------------------------------------- |
| **PVM**      | 8545  | Poker Virtual Machine (Node.js + TypeScript) |
| **Frontend** | 5173  | React UI with hot reload                     |
| **MongoDB**  | 27017 | Game state database                          |
| **Redis**    | 6379  | Caching and sessions                         |

### Docker Commands

```bash
# Service management
make build          # Build all images
make up             # Start services
make down           # Stop services
make logs           # View logs
make restart        # Restart services

# Environment-specific
make dev            # Development mode
make prod           # Production mode

# Utilities
make health         # Check service health
make clean          # Clean up containers/volumes
make mongo-shell    # Connect to MongoDB
make redis-cli      # Connect to Redis
```

### Production Deployment

```bash
# Production mode with Nginx + optimized builds
NODE_ENV=production make prod

# Or manually
docker-compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d
```

For detailed Docker documentation, see [DOCKER.md](./DOCKER.md).

## Game Features

### Player Status

The PVM tracks various player states throughout the game:

| Status        | Description                          | Can Act | Receives Cards | Notes                                |
| ------------- | ------------------------------------ | ------- | -------------- | ------------------------------------ |
| `SEATED`      | Player has joined but not yet active | ❌      | ❌             | Waiting for next hand to start       |
| `ACTIVE`      | Player is actively participating     | ✅      | ✅             | Default status for joined players    |
| `BUSTED`      | Player has no chips left             | ❌      | ❌             | Eliminated from tournament/cash game |
| `FOLDED`      | Player has folded their hand         | ❌      | ❌             | Cannot act until next hand           |
| `ALL_IN`      | Player has bet all their chips       | ❌      | ✅             | Eligible for side pots               |
| `SITTING_OUT` | Player is temporarily away           | ❌      | ❌             | Preserves seat, skipped in dealing   |
| `SITTING_IN`  | Player is returning from sitting out | ✅      | ✅             | Transitioning back to active         |
| `SHOWING`     | Player is showing cards at showdown  | ❌      | ✅             | Cards revealed to table              |

**Status Transitions:**

-   `SEATED` → `ACTIVE` (when hand begins)
-   `ACTIVE` → `FOLDED` (fold action)
-   `ACTIVE` → `ALL_IN` (bet all chips)
-   `ACTIVE` → `SITTING_OUT` (sit out action)
-   `SITTING_OUT` → `SITTING_IN` (sit in action)
-   `SITTING_IN` → `ACTIVE` (next hand starts)
-   `ACTIVE` → `SHOWING` (showdown phase)
-   `ACTIVE` → `BUSTED` (lose all chips)

### Countdown Timer

Coordinate synchronized game starts using the `gameStart` URL parameter:

```
http://localhost:8545/table/0x123abc?gameStart=2025-06-16T15:30:00Z
```

**Parameter formats:**

-   ISO 8601: `2025-06-16T15:30:00Z`
-   With timezone: `2025-06-16T15:30:00%2B10:00` (URL encoded)
-   Unix timestamp: `1718524200000`

**Features:**

-   Screen lock until countdown completes
-   Live countdown display
-   Auto-cleanup when complete
-   Dev skip button (development mode only)

### Bitcoin Payments

Enable Bitcoin payments by setting in `.env`:

```
BTC_PAY_SERVER_URL=http://localhost:3001
```

## SDK

### Publishing

```bash
cd sdk
nvm use 20.18
yarn prepare && yarn publish
```

## Blockchain Integration

### Smart Contracts

| Contract | Description                 | Address                                      | Network |
| -------- | --------------------------- | -------------------------------------------- | ------- |
| Bridge   | Deposit stables to poker VM | `0x092eEA7cE31C187Ff2DC26d0C250B011AEC1a97d` | mainnet |
| Vault    | Validator staking           | `0x893c26846d7cE76445230B2b6285a663BF4C3BF5` | mainnet |

### Test Accounts

-   Alice: `0x7f99ad0e59b90eab7e776cefcdae7a920ee1864c`
-   Bob: `0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8`

### Genesis Block

Genesis account: `0x7f99ad0e59b90eab7e776cefcdae7a920ee1864c`

```json
{
    "index": 0,
    "hash": "24f7acd3b289b5dc7eaf96e9f119fecb7a24a3626c5b26602792d0d1ee8571b7",
    "previousHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "merkleRoot": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "timestamp": 0,
    "validator": "0x7f99aD0e59b90EAB7e776cefcdaE7a920ee1864c",
    "transactions": []
}
```

## Node Architecture

### Transaction Processing

1. Transactions sent to node
2. Node validates signature, nonce, and balance
3. Transaction added to mempool

### Block Creation

1. Nodes selected in round-robin fashion
2. Transactions pulled from mempool
3. Transactions replayed by order and nonce
4. Account state updated
5. Block created and signed
6. Block broadcast to network

### Block Validation

1. Block received by nodes
2. Validated using public key, merkle root, and signature
3. Block added to blockchain state

## Docker

### Building Image

```bash
cd pvm/ts
docker build -t poker-vm .
docker run -p 8545:8545 poker-vm
```

## License

[License information needed]
