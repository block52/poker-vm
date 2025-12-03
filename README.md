# Poker VM

[![PVM UnitTests](https://github.com/block52/poker-vm/actions/workflows/main.yml/badge.svg)](https://github.com/block52/poker-vm/actions/workflows/main.yml)
[![UI Build](https://github.com/block52/poker-vm/actions/workflows/ui-build.yml/badge.svg)](https://github.com/block52/poker-vm/actions/workflows/ui-build.yml)
[![UI Tests](https://github.com/block52/poker-vm/actions/workflows/ui-test.yml/badge.svg)](https://github.com/block52/poker-vm/actions/workflows/ui-test.yml)

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

## Email

pitboss at block 52 dot xyz

```text
-----BEGIN PGP PUBLIC KEY BLOCK-----
Comment: 406F D0E4 4DC5 B26E F121  58C4 36F2 5F29 0099 78F4
Comment: Pit Boss <pitboss@block52.xyz>

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
1MIHZBpp/rvs
=XIiJ
-----END PGP PUBLIC KEY BLOCK-----
```

## Contributing

Contributions are welcome! Please see our contributing guidelines for more information.

## License

MIT License - see [LICENSE](./LICENSE) for details.
