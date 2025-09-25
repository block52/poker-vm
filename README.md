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
-   Node.js 18+ (for local development)
-   Yarn

### Setup

1. **Clone the repository:**

    ```bash
    git clone https://github.com/block52/poker-vm.git
    cd poker-vm
    ```

2. **Start services:**

    ```bash
    docker compose up
    ```

3. **Access services:**
    - PVM RPC: http://localhost:8545
    - API Documentation: http://localhost:8545/docs
    - MongoDB: localhost:27017

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

## Game Features

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
