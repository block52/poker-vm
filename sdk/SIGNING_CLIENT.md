# Signing Client

The `SigningCosmosClient` extends the read-only `CosmosClient` with transaction signing and broadcasting capabilities. This allows you to create games, join games, perform actions, and send tokens on the Block52 Poker blockchain.

## Features

-   ✅ All read-only operations from `CosmosClient`
-   ✅ Transaction signing and broadcasting
-   ✅ Create poker games
-   ✅ Join poker games
-   ✅ Perform poker actions (fold, call, raise, etc.)
-   ✅ Send tokens (b52usdc)
-   ✅ Wallet management
-   ✅ Automatic gas estimation
-   ✅ Custom gas price support

## Installation

```bash
yarn add @bitcoinbrisbane/block52
```

## Quick Start

```typescript
import { createSigningClientFromMnemonic, getDefaultCosmosConfig } from "@bitcoinbrisbane/block52";

// Create a signing client from mnemonic
const mnemonic = "your twelve or twenty four word mnemonic here";
const config = getDefaultCosmosConfig("localhost"); // or your node URL
const client = await createSigningClientFromMnemonic(config, mnemonic);

// Get wallet address
const address = await client.getWalletAddress();
console.log("Wallet:", address);

// Create a game
const txHash = await client.createGame(
    "texas-holdem", // game type
    2, // min players
    6, // max players
    10_000_000n, // min buy-in (10 USDC in b52usdc)
    100_000_000n, // max buy-in (100 USDC in b52usdc)
    500_000n, // small blind (0.5 USDC in b52usdc)
    1_000_000n, // big blind (1 USDC in b52usdc)
    60 // timeout (seconds)
);

console.log("Game created! TX:", txHash);
```

## API Reference

### Creating a Signing Client

#### `createSigningClientFromMnemonic(config, mnemonic)`

Create a signing client from a mnemonic phrase.

```typescript
const client = await createSigningClientFromMnemonic(config, mnemonic);
```

**Parameters:**

-   `config: CosmosConfig` - Blockchain configuration
-   `mnemonic: string` - 12 or 24-word seed phrase

**Returns:** `Promise<SigningCosmosClient>`

#### `createSigningCosmosClient(config, wallet)`

Create a signing client from an existing wallet.

```typescript
import { createWalletFromMnemonic } from "@bitcoinbrisbane/block52";

const walletInfo = await createWalletFromMnemonic(mnemonic, "b52");
const client = await createSigningCosmosClient(config, walletInfo.wallet);
```

**Parameters:**

-   `config: CosmosConfig` - Blockchain configuration
-   `wallet: DirectSecp256k1HdWallet` - CosmJS wallet instance

**Returns:** `Promise<SigningCosmosClient>`

### Wallet Methods

#### `getWalletAddress()`

Get the address of the current wallet.

```typescript
const address = await client.getWalletAddress();
// Returns: "b521hg93rsm2f5v3zlepf20ru88uweajt3nf492s2p"
```

#### `setWallet(wallet)`

Change the wallet used for signing.

```typescript
const newWalletInfo = await createWalletFromMnemonic(newMnemonic, "b52");
client.setWallet(newWalletInfo.wallet);
```

#### `getWallet()`

Get the current wallet instance.

```typescript
const wallet = client.getWallet();
```

### Transaction Methods

#### `createGame(...)`

Create a new poker game.

```typescript
const txHash = await client.createGame(
    gameType: string,
    minPlayers: number,
    maxPlayers: number,
    minBuyInB52USDC: bigint,
    maxBuyInB52USDC: bigint,
    smallBlindB52USDC: bigint,
    bigBlindB52USDC: bigint,
    timeout: number
);
```

**Parameters:**

-   `gameType` - Type of poker game (e.g., "texas-holdem")
-   `minPlayers` - Minimum number of players (e.g., 2)
-   `maxPlayers` - Maximum number of players (e.g., 6)
-   `minBuyInB52USDC` - Minimum buy-in in b52usdc (1 USDC = 1,000,000 b52usdc)
-   `maxBuyInB52USDC` - Maximum buy-in in b52usdc
-   `smallBlindB52USDC` - Small blind amount in b52usdc
-   `bigBlindB52USDC` - Big blind amount in b52usdc
-   `timeout` - Action timeout in seconds

**Returns:** `Promise<string>` - Transaction hash

**Example:**

```typescript
// Helper methods for conversion
const minBuyIn = client.usdcToB52usdc(10); // 10 USDC
const maxBuyIn = client.usdcToB52usdc(100); // 100 USDC
const smallBlind = client.usdcToB52usdc(0.5); // 0.5 USDC
const bigBlind = client.usdcToB52usdc(1); // 1 USDC

const txHash = await client.createGame("texas-holdem", 2, 6, minBuyIn, maxBuyIn, smallBlind, bigBlind, 60);
```

#### `joinGame(gameId, seat, buyInAmount)`

Join an existing poker game.

```typescript
const txHash = await client.joinGame(
    "game-123", // game ID
    0, // seat number (0-5)
    50_000_000n // buy-in amount (50 USDC)
);
```

**Parameters:**

-   `gameId: string` - The game ID to join
-   `seat: number` - Seat position (0-based index)
-   `buyInAmount: bigint` - Buy-in amount in b52usdc

**Returns:** `Promise<string>` - Transaction hash

#### `performAction(gameId, action, amount)`

Perform a game action (fold, call, raise, etc.).

```typescript
// Fold
await client.performAction("game-123", "fold");

// Call
await client.performAction("game-123", "call");

// Raise
await client.performAction("game-123", "raise", 5_000_000n); // Raise 5 USDC
```

**Parameters:**

-   `gameId: string` - The game ID
-   `action: string` - Action type ("fold", "call", "raise", "check", etc.)
-   `amount: bigint` - Amount for raise/bet actions (optional, default: 0)

**Returns:** `Promise<string>` - Transaction hash

#### `sendTokens(fromAddress, toAddress, amount, memo?)`

Send tokens to another address.

```typescript
const txHash = await client.sendTokens(
    "b521hg93rsm2f5v3zlepf20ru88uweajt3nf492s2p", // from
    "b521xyz...abc", // to
    10_000_000n, // 10 USDC
    "Payment for game" // optional memo
);
```

**Parameters:**

-   `fromAddress: string` - Sender address (must be wallet address)
-   `toAddress: string` - Recipient address
-   `amount: bigint` - Amount in b52usdc
-   `memo?: string` - Optional transaction memo

**Returns:** `Promise<string>` - Transaction hash

#### `sendB52USDC(fromAddress, toAddress, amount, memo?)`

Alias for `sendTokens()` with the same parameters.

### Inherited Methods

`SigningCosmosClient` inherits all read-only methods from `CosmosClient`:

-   `getBalance(address, denom?)`
-   `getB52USDCBalance(address)`
-   `getAllBalances(address)`
-   `getAccount(address)`
-   `getHeight()`
-   `getTx(txHash)`
-   `getBlock(height)`
-   `getLatestBlock()`
-   `getLatestBlocks(count)`
-   `listGames()`
-   `findGames(min?, max?)`
-   `getGame(gameId)`
-   `getGameState(gameId)`
-   `getLegalActions(gameId, playerAddress?)`
-   `getPlayerGames(player)`

### Utility Methods

#### `b52usdcToUsdc(b52usdcAmount)`

Convert b52usdc to USDC display format.

```typescript
const usdc = client.b52usdcToUsdc(1_000_000n);
// Returns: 1 (1 USDC)
```

#### `usdcToB52usdc(usdcAmount)`

Convert USDC to b52usdc format.

```typescript
const b52usdc = client.usdcToB52usdc(10);
// Returns: 10000000n (10 USDC in b52usdc)
```

### Connection Management

#### `disconnect()`

Disconnect from the blockchain.

```typescript
await client.disconnect();
```

## Configuration

### Gas Price

You can configure the gas price when creating the client:

```typescript
const config = {
    ...getDefaultCosmosConfig("localhost"),
    gasPrice: "0.05b52usdc" // Custom gas price
};

const client = await createSigningClientFromMnemonic(config, mnemonic);
```

### Custom RPC/REST Endpoints

```typescript
const config = {
    rpcEndpoint: "http://your-node:26657",
    restEndpoint: "http://your-node:1317",
    chainId: "pokerchain",
    prefix: "b52",
    denom: "b52usdc",
    gasPrice: "0.025b52usdc"
};

const client = await createSigningClientFromMnemonic(config, mnemonic);
```

## Examples

### Complete Game Flow

```typescript
import { createSigningClientFromMnemonic, getDefaultCosmosConfig } from "@bitcoinbrisbane/block52";

async function playPoker() {
    // 1. Setup
    const mnemonic = "your mnemonic here";
    const config = getDefaultCosmosConfig("localhost");
    const client = await createSigningClientFromMnemonic(config, mnemonic);

    const address = await client.getWalletAddress();
    console.log("Player:", address);

    // 2. Check balance
    const balance = await client.getB52USDCBalance(address);
    console.log("Balance:", client.b52usdcToUsdc(balance), "USDC");

    // 3. Create a game
    const createTx = await client.createGame(
        "texas-holdem",
        2,
        6,
        client.usdcToB52usdc(10),
        client.usdcToB52usdc(100),
        client.usdcToB52usdc(0.5),
        client.usdcToB52usdc(1),
        60
    );
    console.log("Game created:", createTx);

    // 4. Wait for confirmation
    await new Promise(r => setTimeout(r, 2000));

    // 5. List games
    const games = await client.listGames();
    const myGame = games[games.length - 1];
    console.log("Game ID:", myGame.id);

    // 6. Join the game (with another client/wallet)
    const joinTx = await client.joinGame(myGame.id, 0, client.usdcToB52usdc(50));
    console.log("Joined game:", joinTx);

    // 7. Perform actions
    await client.performAction(myGame.id, "call");
    await client.performAction(myGame.id, "raise", client.usdcToB52usdc(5));

    // 8. Cleanup
    await client.disconnect();
}
```

### Error Handling

```typescript
try {
    const txHash = await client.createGame(/* params */);
    console.log("Success:", txHash);
} catch (error: any) {
    if (error.message.includes("insufficient funds")) {
        console.error("Not enough balance");
    } else if (error.message.includes("timeout")) {
        console.error("Transaction timed out");
    } else {
        console.error("Transaction failed:", error.message);
    }
}
```

## Testing

Run the tests:

```bash
cd sdk
yarn test signingClient
```

See `tests/signingClient.test.ts` for comprehensive examples.

## Security Notes

⚠️ **Important:**

1. **Never expose mnemonics** in production code
2. **Use environment variables** for sensitive data
3. **Validate all inputs** before creating transactions
4. **Check balances** before sending transactions
5. **Monitor gas prices** to avoid overpaying
6. **Always disconnect** when done to free resources

## Troubleshooting

### "No wallet provided for signing"

Make sure you created the client with a mnemonic or wallet.

### "Transaction signing not implemented"

You're using `CosmosClient` instead of `SigningCosmosClient`. Use `createSigningClientFromMnemonic()`.

### "Insufficient funds"

Check your wallet balance with `getB52USDCBalance()`.

### "Failed to connect"

Verify your RPC/REST endpoints are correct and the node is running.

## See Also

-   [Wallet Utilities](./WALLET_UTILS.md) - For wallet creation and management
-   [Examples](./examples/) - Complete working examples
-   [Tests](./tests/) - Unit tests with usage examples
