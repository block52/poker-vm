# poker-vm

The Layer 2 poker game virtual machine.

# CVM

The CVM is a virtual card game machine that runs on the Block52 network. It is responsible for executing the card game logic.

# PVM

The PVM is a virtual poker game machine that runs inside the CVM. It is responsible for executing the poker game logic.

# Block52 Proxy Server

This repository contains the Block52 proxy server that handles API requests and communicates with the Block52 node.

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your machine
- Git

### Setup and Running

1. Clone the repository:
   ```
   git clone https://github.com/your-org/block52-proxy.git
   cd block52-proxy
   ```

2. Start the services:
   ```
   docker-compose up
   ```

3. The services will be available at:
   - API: http://localhost:8080
   - API Documentation: http://localhost:8080/docs
   - MongoDB: localhost:27017

### Development

The API service is configured with volume mapping, so any changes you make to the code will be reflected immediately without needing to rebuild the container.

To run only specific services:

## Running PVM Locally

To run the PVM locally for development and testing:

1. Navigate to the PVM directory:
   ```
   cd pvm/ts
   ```

2. Start the local MongoDB instance using the local Docker Compose file:
   ```
   docker-compose -f docker-compose.local.yml up -d
   ```

3. Connect to the local MongoDB database:
   - **Connection string**: `mongodb://localhost:27019/local_pvm`
   - **For GUI tools** (like DataGrip, MongoDB Compass):
     - Host: `localhost`
     - Port: `27019`
     - Database: `local_pvm`
     - Authentication: None (or as configured)

4. Start the PVM application:
   ```
   yarn run dev
   ```
   
5. The local PVM will be available at:
   - API: http://localhost:3000

6. To stop the local MongoDB instance:
   ```
   docker-compose -f docker-compose.local.yml down
   ```

## Running in Production

*[Production deployment instructions and connection to Block52 network will be added in the future]*


# SDK

To publish the SDK.

```bash
cd sdk
nvm use 20.12
yarn prepare && yarn publish
```

# Node
## Creating the transaction

-   Transactions are sent to the node
-   Node validates the transaction signature
-   Node validates the transaction nonce
-   Node validates the transaction balance, via the account state manager
-   Transaction is added to the transaction mem pool

## Creating the block

-   Nodes are selected in a round robin fashion
-   Transactions are pulled from the mem pool
-   Transactions are replayed in the order they were received, and by the nonce
-   The account state manager is updated with the new balances
-   The block is created and signed by the node
-   The block is sent to the network

## Receiving the block

-   The block is received by another node
-   The block is validated by the node, with validators public key, merkle root, and signature
-   The block is added to the block state manager

## Scripts

### Test accounts

Alice `0x7f99ad0e59b90eab7e776cefcdae7a920ee1864c`
Bob `0xd15df2C33Ed08041Efba88a3b13Afb47Ae0262A8`


### Tokens and contracts

| Contract | Description                            | Address                                      | Network |
| -------- | -------------------------------------- | -------------------------------------------- | ------- |
| `Token`  | The token used for the poker game      | ``                                           | ``      |
| `Bridge` | The bridge contract to deposit stables to the poker VM | `0x092eEA7cE31C187Ff2DC26d0C250B011AEC1a97d` | `mainnet`  |
| `Vault`  | The vault contract for validators to stake | `0x893c26846d7cE76445230B2b6285a663BF4C3BF5` | `mainnet`  |

## Genesis block

Genesis account `0x7f99ad0e59b90eab7e776cefcdae7a920ee1864c`

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

```json
{
    "address": "0x513d31f0aa9380c5a0f16a996850b9538f74f936",
    "msg": "0x513d31f0aA9380C5A0F16A996850B9538f74F936",
    "sig": "9994fe4ba79f3a919b8b17263575f8362d7c67ca46febfa874699fa210cf87563c042de9b07bdc33c80727eb73e93394c6064c7989ebeb0aca79f4c5276cfd8e1c",
    "version": "3",
    "signer": "MEW"
}
```


## Notes

RANDO https://eth2book.info/capella/part2/building_blocks/randomness/#the-randao
