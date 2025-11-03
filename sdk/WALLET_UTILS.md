# Wallet Utilities

This SDK includes comprehensive wallet utilities for Block52 Poker VM using CosmJS.

## Features

-   Generate new wallets with random mnemonics (12 or 24 words)
-   Create wallets from existing mnemonics
-   Derive addresses from mnemonics
-   Validate mnemonic phrases
-   Full integration with CosmJS signing capabilities
-   Standard Cosmos HD path (m/44'/118'/0'/0/0)

## Installation

The wallet utilities are included in the SDK. Make sure you have the required dependencies:

```bash
yarn add @bitcoinbrisbane/block52
```

## Usage

### Generate a New Wallet

```typescript
import { generateWallet } from "@bitcoinbrisbane/block52";

// Generate a wallet with 24 words (default)
const walletInfo = await generateWallet("b52");

console.log("Mnemonic:", walletInfo.mnemonic);
console.log("Address:", walletInfo.address);
console.log("Wallet:", walletInfo.wallet);

// Generate a wallet with 12 words
const wallet12 = await generateWallet("b52", 12);
```

### Create Wallet from Existing Mnemonic

```typescript
import { createWalletFromMnemonic } from "@bitcoinbrisbane/block52";

const mnemonic =
    "vanish legend pelican blush control spike useful usage into any remove wear flee short october naive swear wall spy cup sort avoid agent credit";

const walletInfo = await createWalletFromMnemonic(mnemonic, "b52");

console.log("Address:", walletInfo.address);
// Output: b521hg93rsm2f5v3zlepf20ru88uweajt3nf492s2p
```

### Get Address from Mnemonic

```typescript
import { getAddressFromMnemonic } from "@bitcoinbrisbane/block52";

const mnemonic = "your mnemonic phrase here";
const address = await getAddressFromMnemonic(mnemonic, "b52");

console.log("Address:", address);
```

### Validate Mnemonic

```typescript
import { isValidMnemonic } from "@bitcoinbrisbane/block52";

const mnemonic = "word1 word2 word3 ... word24";

if (isValidMnemonic(mnemonic)) {
    console.log("Valid mnemonic!");
} else {
    console.log("Invalid mnemonic!");
}
```

### Using the Wallet for Signing

```typescript
import { createWalletFromMnemonic } from "@bitcoinbrisbane/block52";

const walletInfo = await createWalletFromMnemonic(mnemonic, "b52");

// Get accounts
const accounts = await walletInfo.wallet.getAccounts();
console.log("Account:", accounts[0]);

// The wallet instance can be used with CosmJS SigningStargateClient
// for signing and broadcasting transactions
```

## API Reference

### `generateWallet(prefix?: string, wordCount?: 12 | 24): Promise<WalletInfo>`

Generates a new wallet with a random mnemonic.

**Parameters:**

-   `prefix` (optional): Address prefix (default: "b52")
-   `wordCount` (optional): Number of words in mnemonic - 12 or 24 (default: 24)

**Returns:** Promise<WalletInfo>

### `createWalletFromMnemonic(mnemonic: string, prefix?: string): Promise<WalletInfo>`

Creates a wallet from an existing mnemonic phrase.

**Parameters:**

-   `mnemonic`: The seed phrase (12 or 24 words)
-   `prefix` (optional): Address prefix (default: "b52")

**Returns:** Promise<WalletInfo>

### `getAddressFromMnemonic(mnemonic: string, prefix?: string): Promise<string>`

Derives the address from a mnemonic without creating a full wallet instance.

**Parameters:**

-   `mnemonic`: The seed phrase
-   `prefix` (optional): Address prefix (default: "b52")

**Returns:** Promise<string> - The derived address

### `isValidMnemonic(mnemonic: string): boolean`

Validates a mnemonic phrase format.

**Parameters:**

-   `mnemonic`: The seed phrase to validate

**Returns:** boolean - true if valid, false otherwise

### `BLOCK52_HD_PATH`

The standard Cosmos HD derivation path: `m/44'/118'/0'/0/0`

## Types

### `WalletInfo`

```typescript
interface WalletInfo {
    mnemonic: string; // The seed phrase
    address: string; // The derived Cosmos address
    wallet: DirectSecp256k1HdWallet; // CosmJS wallet instance
}
```

## Test Verification

The wallet utilities have been tested with a known mnemonic:

**Mnemonic:**

```
vanish legend pelican blush control spike useful usage into any remove wear flee short october naive swear wall spy cup sort avoid agent credit
```

**Expected Address:**

```
b521hg93rsm2f5v3zlepf20ru88uweajt3nf492s2p
```

All 22 tests pass successfully, verifying:

-   Correct address derivation from known mnemonics
-   Wallet generation with different word counts
-   Address consistency across multiple derivations
-   Mnemonic validation
-   Integration with CosmJS signing capabilities

## Dependencies

-   `@cosmjs/proto-signing`: For wallet creation and signing
-   `@cosmjs/crypto`: For HD path derivation

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never expose mnemonics**: Store mnemonics securely and never commit them to version control
2. **Use secure storage**: In production, use secure storage mechanisms for mnemonics
3. **Validate user input**: Always validate mnemonic input before using it
4. **HTTPS only**: Only transmit mnemonics over secure connections
5. **Clear memory**: Consider clearing mnemonic from memory after use in sensitive applications

## Examples

See the test file `tests/walletUtils.test.ts` for comprehensive usage examples.
