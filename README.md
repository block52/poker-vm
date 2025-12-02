# Poker VM

[![PVM UnitTests](https://github.com/block52/poker-vm/actions/workflows/main.yml/badge.svg)](https://github.com/block52/poker-vm/actions/workflows/main.yml)

A stateless execution layer for poker game logic on the Block52 blockchain network.

![image](https://github.com/user-attachments/assets/29412b57-3419-4177-b265-1e74e7c7c2e9)

## Architecture

The Poker VM (PVM) is a **pure execution layer** that processes poker game logic without maintaining persistent state. All game state is stored on the blockchain, making the PVM stateless, horizontally scalable, and fault-tolerant.

### Key Principles

-   **Stateless Execution**: PVM reads state from blockchain, executes game logic, returns results
-   **No Database**: No MongoDB, Redis, or external storage - blockchain is the single source of truth
-   **Pure Functions**: Game logic is deterministic and side-effect free
-   **Horizontal Scaling**: Multiple PVM instances can run in parallel
-   **Real-time Updates**: WebSocket connections for live game state synchronization

### Components

-   **PVM Core**: TypeScript-based poker game logic engine
-   **RPC Interface**: JSON-RPC endpoint for transaction submission and queries
-   **WebSocket Server**: Real-time game state updates for connected clients
-   **REST API**: Health checks and utility endpoints

### Benefits

-   ✅ **No Data Migration**: Spin up new PVM instances without data sync
-   ✅ **Instant Failover**: Any instance can handle any request
-   ✅ **Global Distribution**: Deploy PVM nodes globally for low latency
-   ✅ **Cost Efficient**: No database hosting or maintenance costs
-   ✅ **Deterministic**: Same input always produces same output
-   ✅ **Testable**: Pure functions make testing straightforward

## Quick Start

### Prerequisites

-   Node.js 20+
-   Yarn
-   A running Block52 blockchain node (for production use)

### Local Development

1. **Clone the repository:**

    ```bash
    git clone https://github.com/block52/poker-vm.git
    cd poker-vm
    ```

2. **Start the PVM server:**

    ```bash
    cd pvm/ts
    yarn install
    yarn dev
    ```

3. **Start the UI (optional):**

    ```bash
    cd ui
    yarn install
    yarn dev
    ```

4. **Access services:**
    - 🔧 **PVM RPC**: http://localhost:8545
    - 🔧 **Health Check**: http://localhost:8545/health
    - 🎰 **Poker UI**: http://localhost:5173 (if running)
    - � **WebSocket**: ws://localhost:8545/ws

### Production Setup

The PVM connects to a Block52 blockchain node for state storage:

```bash
# Set blockchain node endpoint (optional, defaults to localhost:26657)
export BLOCKCHAIN_RPC=https://node1.block52.xyz/rpc/

cd pvm/ts
yarn build
yarn start
```

### Network Endpoints

| Network        | RPC                            | REST                       | gRPC                           | WebSocket                  |
| -------------- | ------------------------------ | -------------------------- | ------------------------------ | -------------------------- |
| **Localhost**  | http://localhost:26657         | http://localhost:1317      | http://localhost:9090          | ws://localhost:26657/ws    |
| **Texas Hodl** | https://texashodl.net/rpc      | https://node.texashodl.net | grpcs://texashodl.net:9443     | wss://texashodl.net/ws     |
| **Block52**    | https://node1.block52.xyz/rpc/ | https://node1.block52.xyz  | grpcs://node1.block52.xyz:9443 | wss://node1.block52.xyz/ws |

## Development

### PVM Architecture

The PVM is a stateless execution layer with three main interfaces:

1. **RPC Endpoint** (`http://localhost:8545`):

    - Submit transactions
    - Query game state
    - JSON-RPC 2.0 compatible

2. **WebSocket Server** (`ws://localhost:8545/ws`):

    - Real-time game state updates
    - Connect with `?tableAddress=<table_id>&playerId=<player_address>`
    - Automatic reconnection handling

3. **REST API** (`http://localhost:8545/health`):
    - Health checks
    - Metrics and diagnostics

### Testing

Run unit tests:

```bash
cd pvm/ts
yarn test
```

Run integration tests:

```bash
cd pvm/ts
yarn test:integration
```

### Building for Production

```bash
cd pvm/ts
yarn build
```

The build outputs to `dist/` and can be run with:

```bash
node dist/index.js
```

## Deployment

### Docker Deployment

Build and run the PVM in a container:

```bash
cd pvm/ts
docker build -t poker-vm .
docker run -p 8545:8545 poker-vm
```

### Environment Variables

| Variable         | Default                  | Description                            |
| ---------------- | ------------------------ | -------------------------------------- |
| `PORT`           | `8545`                   | HTTP server port (always used for PVM) |
| `BLOCKCHAIN_RPC` | `http://localhost:26657` | Block52 blockchain RPC endpoint        |
| `NODE_ENV`       | `development`            | Environment mode                       |

### Horizontal Scaling

Since the PVM is stateless, you can run multiple instances behind a load balancer:

```bash
# Instance 1
PORT=8545 node dist/index.js

# Instance 2
PORT=8546 node dist/index.js

# Instance 3
PORT=8547 node dist/index.js
```

Configure your load balancer (nginx, HAProxy, etc.) to distribute requests across instances.

### Health Checks

The PVM provides health check endpoints for monitoring:

```bash
curl http://localhost:8545/health
```

Response:

```json
{
    "status": "healthy",
    "uptime": 12345,
    "version": "1.0.0"
}
```

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

### WebSocket Connection

Connect to a live poker table for real-time updates:

```javascript
const ws = new WebSocket("ws://localhost:8545/ws?tableAddress=<table_id>&playerId=<player_address>");

ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.type === "gameStateUpdate") {
        console.log("Game state updated:", message.gameState);
    }
};
```

**Message Types:**

-   `connected`: WebSocket connection established
-   `gameStateUpdate`: Game state changed (player action, new round, etc.)
-   `error`: Error occurred during processing

### RPC Interface

Submit transactions via JSON-RPC:

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "poker.action",
    "params": {
      "tableId": "0x123...",
      "playerId": "block52...",
      "action": "bet",
      "amount": 100
    },
    "id": 1
  }'
```

## SDK

The Block52 SDK provides TypeScript/JavaScript interfaces for interacting with the PVM:

```typescript
import { Block52Client } from "@bitcoinbrisbane/block52";

const client = new Block52Client({
    rpc: "https://node1.block52.xyz/rpc/",
    rest: "https://node1.block52.xyz",
    grpc: "grpcs://node1.block52.xyz:9443"
});

// Submit a poker action
await client.poker.bet({
    tableId: "0x123...",
    playerId: "block52...",
    amount: 100
});

// Query table state
const tableState = await client.poker.getTableState("0x123...");
```

### Installation

```bash
npm install @bitcoinbrisbane/block52
# or
yarn add @bitcoinbrisbane/block52
```

### Publishing (Maintainers)

```bash
cd sdk
nvm use 20.18
yarn prepare && yarn publish
```

For detailed SDK documentation, see [sdk/README.md](./sdk/README.md).

## Blockchain Integration

The PVM operates as a stateless execution layer on top of the Block52 blockchain:

```text
┌─────────────────────────────────┐
│      Client (UI/Bot/SDK)        │
│   (Submit transactions)         │
└─────────────┬───────────────────┘
              ↓
┌─────────────────────────────────┐
│   PVM (Execution Layer)         │  ← Stateless poker logic
│   - Validate transactions       │
│   - Execute game rules          │
│   - Calculate outcomes          │
└─────────────┬───────────────────┘
              ↓
┌─────────────────────────────────┐
│   Block52 Blockchain            │  ← State storage
│   - Store game state            │
│   - Manage player accounts      │
│   - Handle chip escrow          │
└─────────────────────────────────┘
```

### Data Flow

1. **Client → PVM**: Submit poker action (bet, fold, call, etc.)
2. **PVM → Blockchain**: Read current game state
3. **PVM**: Execute game logic, validate action
4. **PVM → Blockchain**: Write updated state
5. **PVM → Client**: Broadcast update via WebSocket

### Smart Contracts

| Contract | Description                 | Address                                      | Network |
| -------- | --------------------------- | -------------------------------------------- | ------- |
| Bridge   | Deposit stables to poker VM | `0x092eEA7cE31C187Ff2DC26d0C250B011AEC1a97d` | mainnet |
| Vault    | Validator staking           | `0x893c26846d7cE76445230B2b6285a663BF4C3BF5` | mainnet |

## Project Structure

```
poker-vm/
├── pvm/ts/              # PVM execution layer (TypeScript)
│   ├── src/
│   │   ├── core/        # Game logic engine
│   │   ├── rpc.ts       # JSON-RPC interface
│   │   ├── websocket.ts # Real-time connections
│   │   └── index.ts     # Server entry point
│   └── tests/           # Unit and integration tests
├── sdk/                 # TypeScript SDK for clients
├── ui/                  # React-based poker UI
├── contracts/           # Solidity smart contracts
├── bot/                 # Bot implementations
│   ├── ts/              # TypeScript bots
│   └── python/          # Python bot framework
└── tests/               # End-to-end tests
```

## Contributing

Contributions are welcome! Please see our contributing guidelines for more information.

## License

MIT License - see [LICENSE](./LICENSE) for details.
