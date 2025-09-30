# Cosmos SDK Integration for Poker VM

This directory contains the Cosmos SDK integration for the Poker Virtual Machine, replacing MongoDB and Redis with blockchain-native state management.

## Overview

The Cosmos SDK integration provides:

- **Account Management**: Blockchain-native account balances using Cosmos Bank module
- **Game State Management**: Game states stored on-chain or in custom modules
- **Blockchain Management**: Direct integration with Cosmos SDK blockchain
- **Transaction Handling**: Native Cosmos transactions for all operations

## Quick Start

### 1. Environment Setup

Set the following environment variables:

```bash
# Switch to Cosmos SDK
export DB_URL="cosmos://localhost:26657"

# Cosmos configuration
export COSMOS_RPC_ENDPOINT="http://localhost:26657"
export COSMOS_CHAIN_ID="poker-vm-1"
export COSMOS_PREFIX="poker"
export COSMOS_DENOM="upvm"
export COSMOS_GAS_PRICE="0.025upvm"

# Optional: For signing transactions
export COSMOS_MNEMONIC="your mnemonic here"
```

### 2. Initialize Cosmos SDK

```typescript
import { initializeCosmos } from './state/cosmos/init';

// Initialize the Cosmos SDK integration
const cosmos = await initializeCosmos();

// Test the connection
const height = await cosmos.cosmosClient.getHeight();
console.log(`Connected to chain at height: ${height}`);
```

### 3. Use Existing Interfaces

The Cosmos implementation uses the same interfaces as MongoDB/Redis:

```typescript
import { 
    getAccountManagementInstance,
    getBlockchainInstance,
    getGameManagementInstance 
} from './state';

// These will automatically use Cosmos SDK when DB_URL starts with "cosmos://"
const accountMgmt = getAccountManagementInstance();
const blockchainMgmt = getBlockchainInstance();
const gameMgmt = getGameManagementInstance();

// Use exactly the same API as before
const balance = await accountMgmt.getBalance("poker1abc123...");
```

## Files

### Core Components

- **`cosmosClient.ts`** - Main Cosmos SDK client wrapper
- **`accountManagement.ts`** - Account balance management using Cosmos Bank
- **`gameManagement.ts`** - Game state management (hybrid approach)
- **`blockchainManagement.ts`** - Blockchain operations
- **`config.ts`** - Configuration management
- **`init.ts`** - Initialization and setup functions

### Utilities

- **`example.ts`** - Complete usage examples
- **`README.md`** - This documentation

## Architecture

### Account Management

Uses Cosmos SDK Bank module for native token management:

```typescript
// Get balance from blockchain
const balance = await cosmosClient.getBalance(address);

// Send tokens (creates blockchain transaction)
const txHash = await cosmosClient.sendTokens(from, to, amount);
```

### Game State Management

Hybrid approach for optimal performance:

1. **Game metadata** - Stored on-chain for transparency
2. **Game state** - Cached locally for speed, periodically synced
3. **Critical events** - Recorded as blockchain transactions

### Transaction Flow

```
Game Action → Local State Update → Blockchain Transaction → State Sync
```

## Configuration

### Development

```typescript
export const DEV_CONFIG = {
    rpcEndpoint: "http://localhost:26657",
    chainId: "poker-vm-dev",
    prefix: "poker",
    denom: "upvm",
    gasPrice: "0.025upvm"
};
```

### Production

```typescript
export const PROD_CONFIG = {
    rpcEndpoint: process.env.COSMOS_RPC_ENDPOINT!,
    chainId: process.env.COSMOS_CHAIN_ID!,
    prefix: process.env.COSMOS_PREFIX!,
    denom: process.env.COSMOS_DENOM!,
    gasPrice: process.env.COSMOS_GAS_PRICE!
};
```

## Migration from MongoDB/Redis

### Automatic Detection

The system automatically detects the database type from `DB_URL`:

- `mongodb://` - Uses MongoDB
- `redis://` - Uses Redis  
- `cosmos://` - Uses Cosmos SDK

### Migration Steps

1. **Export existing data**:
   ```bash
   npm run export-data
   ```

2. **Setup Cosmos chain**:
   ```bash
   # Start local Cosmos chain
   npm run start-cosmos
   ```

3. **Import data**:
   ```bash
   npm run import-to-cosmos
   ```

4. **Update configuration**:
   ```bash
   export DB_URL="cosmos://localhost:26657"
   ```

5. **Test migration**:
   ```bash
   npm run test-cosmos
   ```

## Testing

### Unit Tests

```bash
npm test -- cosmos
```

### Integration Tests

```bash
npm run test:integration:cosmos
```

### Manual Testing

```typescript
import { testCosmosIntegration } from './state/cosmos/init';

// Run comprehensive test
const success = await testCosmosIntegration();
console.log(`Integration test: ${success ? 'PASSED' : 'FAILED'}`);
```

## Performance Considerations

### Blockchain Operations

- **Read operations** - Very fast (local client cache)
- **Write operations** - ~6 second block time
- **Batch operations** - Multiple transactions per block

### Optimization Strategies

1. **Local caching** - Cache frequently accessed data
2. **Batch transactions** - Group multiple operations
3. **State channels** - For rapid game actions
4. **Lazy loading** - Load game states on demand

## Error Handling

```typescript
try {
    const cosmos = await initializeCosmos();
} catch (error) {
    if (error.message.includes('connection')) {
        // Handle connection errors
        console.error('Failed to connect to Cosmos chain');
    } else if (error.message.includes('mnemonic')) {
        // Handle wallet errors
        console.error('Invalid mnemonic or wallet setup');
    } else {
        // Handle other errors
        console.error('Cosmos initialization failed:', error);
    }
}
```

## Advanced Usage

### Custom Modules

For production deployments, consider implementing custom Cosmos SDK modules:

```go
// x/poker/keeper/keeper.go
type Keeper struct {
    cdc      codec.Codec
    storeKey sdk.StoreKey
    memKey   sdk.StoreKey
}

func (k Keeper) CreateGame(ctx sdk.Context, game types.Game) error {
    store := ctx.KVStore(k.storeKey)
    key := types.GameKey(game.Address)
    value := k.cdc.MustMarshal(&game)
    store.Set(key, value)
    return nil
}
```

### State Channels

For high-frequency game actions:

```typescript
// Open state channel for game
const channel = await openStateChannel(gameAddress, players);

// Rapid off-chain updates
await channel.updateState(newGameState);

// Periodic on-chain commits
await channel.commitToChain();
```

### CosmWasm Integration

Deploy smart contracts for complex game logic:

```rust
#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::CreateGame { game_options } => {
            execute_create_game(deps, env, info, game_options)
        }
        ExecuteMsg::JoinGame { game_address } => {
            execute_join_game(deps, env, info, game_address)
        }
    }
}
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   ```
   Error: Failed to connect to Cosmos chain
   ```
   - Check RPC endpoint is accessible
   - Verify chain is running
   - Check network connectivity

2. **Invalid Mnemonic**
   ```
   Error: Invalid mnemonic phrase
   ```
   - Verify mnemonic format (24 words)
   - Check environment variable is set correctly
   - Ensure mnemonic corresponds to expected address prefix

3. **Gas Estimation Failed**
   ```
   Error: Gas estimation failed
   ```
   - Check account has sufficient balance
   - Verify gas price is appropriate
   - Ensure transaction is valid

### Debug Mode

Enable debug logging:

```bash
export DEBUG=cosmos:*
npm start
```

This will provide detailed logs of all Cosmos SDK operations.

## Contributing

When adding new features to the Cosmos integration:

1. **Follow interfaces** - Implement existing `IAccountManagement`, `IBlockchainManagement`, etc.
2. **Add tests** - Include unit and integration tests
3. **Update docs** - Add examples and usage notes
4. **Error handling** - Graceful degradation and clear error messages
5. **Performance** - Consider blockchain constraints and optimization

## Future Enhancements

- **IBC Integration** - Cross-chain poker tournaments
- **Governance** - On-chain parameter updates
- **Staking** - Validator staking for poker nodes
- **NFTs** - Unique poker cards and achievements
- **DeFi Integration** - Yield farming with poker winnings