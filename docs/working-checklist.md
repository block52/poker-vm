# PVM on Cosmos - Working Checklist

**Last Updated**: November 16, 2025
**Status**: 🚧 PHASE 4 - USDC Withdrawal Testing & Bug Fixes
**Current Phase**: Phase 4 - Testing & Polish
**CosmosClient Progress**: ✅ createGame, joinGame, performAction all working!
**Architecture**: ✅ Hybrid - Cosmos for transactions, PVM WebSocket for real-time updates
**Recent Work**: 🔧 Withdrawal flow testing - Fixed 3 critical bugs + signature verification
**Bridge Status**: ✅ Deposits working | 🚧 Withdrawals in testing
**Next**: Register validator address in Vault contract for withdrawal signing

---

## 🔧 PHASE 4 - USDC Withdrawal Testing (Nov 16, 2025)

### ✅ Bugs Fixed

**Bug #1: Deposit Index Off-by-One** (`msg_server_process_deposit.go:38`)
- **Problem**: Code was subtracting 1 from deposit index (`contractStorageIndex = msg.DepositIndex - 1`)
- **Result**: Clicking deposit #4 (0.01 USDC) processed deposit #3 (1.00 USDC)
- **Fix**: Removed the `-1` offset - deposit index matches storage index directly
- **File**: `/pokerchain/x/poker/keeper/msg_server_process_deposit.go`
- **Status**: ✅ Fixed & tested

**Bug #2: Withdrawal Nonce Starting at Zero** (`withdrawal_keeper.go:92`)
- **Problem**: `collections.Sequence.Next()` returns 0 for first call
- **Result**: First withdrawal had nonce `0x0000...0000` instead of `0x0000...0001`
- **Fix**: Added `nonceSeq = nonceSeq + 1` after calling `.Next()`
- **File**: `/pokerchain/x/poker/keeper/withdrawal_keeper.go`
- **Status**: ✅ Fixed & tested - nonce now starts at 1

**Bug #3: Missing Ethereum Signed Message Prefix** (`withdrawal_keeper.go:181-188`)
- **Problem**: Cosmos was signing raw hash without `"\x19Ethereum Signed Message:\n32"` prefix
- **Contract expects**: `sign(keccak256("\x19Ethereum Signed Message:\n32" + keccak256(receiver, amount, nonce)))`
- **Cosmos was doing**: `sign(keccak256(receiver, amount, nonce))` ❌
- **Fix**: Added Ethereum signed message prefix before signing
- **File**: `/pokerchain/x/poker/keeper/withdrawal_keeper.go`
- **Status**: ✅ Fixed & tested

**Bug #4: UI Wrong ABI & Function Call** (`WithdrawalDashboard.tsx`)
- **Problem**: UI had wrong contract ABI and was calling non-existent function
  - UI called: `completeWithdrawal(cosmosAddress, amount, nonce, signature)` ❌
  - Contract has: `withdraw(amount, baseAddress, nonce, signature)` ✅
- **Fix**: Updated ABI and parameter order + added comprehensive logging
- **File**: `/poker-vm/ui/src/pages/WithdrawalDashboard.tsx`
- **Status**: ✅ Fixed & tested

### 🔐 Validator Key Issue (UNRESOLVED)

**Problem**: Signature validation failing with "withdraw: invalid signature"
- **Root Cause**: Private key address `0x85e0d34495166B7E475b93759348b1da58D6C91e` is NOT registered as a validator in Vault contract `0x893c26846d7cE76445230B2b6285a663BF4C3BF5`
- **Contract Check**: `IValidator(vault).isValidator(signer)` returns `false`
- **Status**: ❌ BLOCKED - Need validator registration or different private key

**Configuration Variable Renamed for Clarity**:
- **OLD**: `validator_eth_private_key` (confusing - implies validator staking)
- **NEW**: `bridge_eth_private_key` (clearer - this is for bridge withdrawal signing)
- **Location**: `~/.pokerchain-testnet/node1/config/app.toml` (after rebuilding)
- **Note**: ⚠️ This private key MUST correspond to an address registered in the Vault contract

**✅ SOLUTION FOUND** (Nov 16, 2025):

**Vault Contract Configuration** (verified on Base mainnet):
- **Vault Address**: `0x893c26846d7cE76445230B2b6285a663BF4C3BF5`
- **Underlying Token**: USDC on Base (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
- **Min Validator Stake**: **100 USDC** (100,000,000 with 6 decimals)
- **Lock Time**: 365 days (31,536,000 seconds)
- **Current Validators**: 0 (nobody has staked yet!)

**How Validators Work**:
The Vault contract's `isValidator()` function checks if an address has staked >= 100 USDC:
```solidity
function _isValidator(address account) private view returns (bool) {
    return _balances[account] >= _minValidatorStake;  // 100 USDC
}
```

**To Become a Validator & Enable Withdrawals**:
1. **Get 100 USDC on Base Chain** in the wallet `0x85e0d34495166B7E475b93759348b1da58D6C91e`
2. **Approve Vault to spend USDC**:
   ```bash
   cast send 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
     "approve(address,uint256)" \
     0x893c26846d7cE76445230B2b6285a663BF4C3BF5 \
     100000000 \
     --private-key PRIVATE_KEY \
     --rpc-url https://mainnet.base.org
   ```
3. **Stake 100 USDC in Vault**:
   ```bash
   cast send 0x893c26846d7cE76445230B2b6285a663BF4C3BF5 \
     "stake(uint256)" \
     100000000 \
     --private-key PRIVATE_KEY \
     --rpc-url https://mainnet.base.org
   ```
4. **Verify registration**:
   ```bash
   cast call 0x893c26846d7cE76445230B2b6285a663BF4C3BF5 \
     "isValidator(address)" \
     0x85e0d34495166B7E475b93759348b1da58D6C91e \
     --rpc-url https://mainnet.base.org
   ```
   Should return `true` (0x0000...0001)

**⚠️ IMPORTANT**:
- Your 100 USDC will be locked for 365 days
- This is a mainnet transaction with real USDC
- After staking, withdrawals will work immediately

**Alternative Options (if you don't want to lock 100 USDC)**:
1. **Use a different private key** - One that's already a validator (if available)
2. **Deploy test contracts on Base Sepolia** - No real money, but requires contract deployment
3. **Modify Vault min stake temporarily** - Deploy new Vault with 0.01 USDC minimum (testnet only)

### 📝 Configuration Changes

**File**: `~/.pokerchain-testnet/node1/config/app.toml`

```toml
[bridge]
enabled = true
ethereum_rpc_url = "https://base-mainnet.g.alchemy.com/v2/YOUR_KEY"
deposit_contract_address = "0xcc391c8f1aFd6DB5D8b0e064BA81b1383b14FE5B"
usdc_contract_address = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
polling_interval_seconds = 15
starting_block = 36469223

# Bridge signing key for withdrawal authorization
# ⚠️ This address MUST be registered as a validator in the Vault contract
# Current issue: 0x85e0d34495166B7E475b93759348b1da58D6C91e is NOT registered
bridge_eth_private_key = "PASTE_VALIDATOR_PRIVATE_KEY_HERE"
```

**Important**:
- Do NOT commit real private keys to git
- The `bridge_eth_private_key` is ONLY in `app.toml` (not in code)
- This key must derive to an address registered in `0x893c26846d7cE76445230B2b6285a663BF4C3BF5`

### 🧪 Test Results

**Deposit Flow**: ✅ WORKING
```
1. User deposits 0.01 USDC via Base bridge
2. Cosmos detects deposit (index #4)
3. Mints 10,000 uusdc (0.01 USDC with 6 decimals)
4. Balance displays correctly in UI
```

**Withdrawal Flow**: 🚧 PARTIALLY WORKING
```
1. User initiates withdrawal ✅
2. USDC burned on Cosmos ✅
3. Nonce generated correctly (starts at 1) ✅
4. Validator auto-signs withdrawal ✅
5. Signature format correct (with Ethereum prefix) ✅
6. UI calls contract with correct parameters ✅
7. Contract rejects: "withdraw: invalid signature" ❌
   → Signer not registered as validator in Vault
```

### 📊 Logging Added

**Cosmos Logs** (`withdrawal_keeper.go`):
```
🔢 Current withdrawal nonce sequence (before Next) currentSeq=0
🔢 Generated withdrawal nonce (after Next + 1) nonceSeq=1
🔢 Formatted nonce as hex nonce=0x0000...0001
```

**UI Console Logs** (`WithdrawalDashboard.tsx`):
```
🌉 Completing withdrawal on Base chain - DETAILED PARAMETERS:
  📍 Cosmos Address: b521...
  📍 Base Receiver: 0xc2613a...
  💰 Amount (micro): 10000
  🔢 Nonce: 0x0000...0001
  ✍️  Signature (base64): tZ/n...
  ✍️  Signature (hex): 0xb59f...
  📝 Function call parameters (in order):
    1. amount: 10000
    2. receiver (Base address): 0xc2613a...
    3. nonce: 0x0000...0001
    4. signature: 0xb59f...
```

---

## 🎉 PHASE 3.5 COMPLETE - Sit & Go Buy-In Implementation! (Nov 12, 2025)

### ✅ What We Achieved

**Sit & Go Buy-In Fixes:**

1. **BuyInModal.tsx** - Shows fixed buy-in for Sit & Go
   - ✅ Detects Sit & Go games (min === max)
   - ✅ Displays non-editable fixed amount
   - ✅ Cash games still allow min/max/custom input

2. **VacantPlayer.tsx** - Two-step join flow
   - ✅ Step 1: Confirm seat selection
   - ✅ Step 2: Custom Sit & Go buy-in modal
   - ✅ Fixed: Now uses `minBuyIn` instead of `maxBuyIn`
   - ✅ Displays correct USDC balance

3. **TableAdminPage.tsx** - Enforces min=max for Sit & Go
   - ✅ Single "Buy-In" field for Sit & Go/Tournament
   - ✅ Sets both min=max from single input
   - ✅ Separate min/max fields for Cash games
   - ✅ Success modal with transaction link
   - ✅ "Created" column with timestamps

4. **useNewTable.ts** - Fixed blind value hardcoding
   - ✅ Removed hardcoded $0.01/$0.02 blinds
   - ✅ Now uses user input from form
   - ✅ Proper BigInt conversion for microunits

5. **Dashboard.tsx** - UI cleanup
   - ✅ Removed "Available Tables" section
   - ✅ Removed "Choose Table" button
   - ✅ Made bottom links smaller

**Test Results:**
- ✅ Created Sit & Go table: TX `F94BBCDE8E53EBA3DAEEB52705BCE68ED23AA1E7C8E3DF6AB24BA7C6E47E696C`
- ✅ Joined with $1.00 buy-in: TX `4F7AB2966141B244ABA79DD0012A70E18BD7BFD2CD7503A29C63B817BC4DB2BC` (Block #1009)
- ✅ Confirmed in PVM: Player at seat 1 with 1,000,000 microunits
- ✅ WebSocket state update working

**USDC Conversion Pattern Verified:**
```typescript
// Send to blockchain: amount * 1_000_000
// Display to user: Number(value) / 1_000_000
// Location: poker-vm/ui/src/utils/numberUtils.ts
```

**See detailed documentation:** `poker-vm/STRADBROKE_ISLAND.md` (Phase 3.5)

---

## 🎉 PHASE 2 COMPLETE - SDK Core Functions Working! (Oct 25, 2025)

### ✅ What We Achieved

**Test Results from `/test-signing` page:**

1. **createGame()** - Transaction: `DFF83312C3B0F173DB9022E89FB6C183D8C08616449342236F446F5A90E53A2E`
   - ✅ Created game with 10 usdc buy-in
   - ✅ Game ID: `0x2bfc00850cd2d25266b49b394f12c1cc7287f7f168223a51f98771627d7e3c10`
   - ✅ Deducted 1 usdc creation fee
   - ✅ Emitted `game_created` event

2. **joinGame()** - Transaction: `CE5E74E6B7B541BA087BB46CE300523D62BA41F18A1857052C07A8158D892ADC`
   - ✅ Successfully joined game!
   - ✅ Transferred 10,000,000 usdc from player to module account
   - ✅ PVM called successfully with "join" action
   - ✅ Player added to game state on blockchain
   - ✅ Emitted `player_joined_game` event
   - ✅ PVM confirmed player in game: `seat: 1, stack: 10000000000000000000000, status: 'active'`

3. **performAction(fold)** - Transaction: `5E0A60AB8F5D8A4DA44393E8E90B7D0B3E309CA1A8D257ADE91D89F56613362F`
   - ✅ Transaction succeeded on blockchain
   - ⚠️ PVM error: "Invalid action index" (action count tracking issue - not a blocker)

### 🔧 Key Fixes Applied

1. **Insufficient Funds Error** - Error code 5
   - Problem: Player tried to buy in with 100 million usdc but only had 50 million
   - Solution: Lowered default buy-ins to 10 million usdc
   - Enhanced logging shows exact balance vs required amount

2. **Long Type Conversions** - SDK encoding issue
   - Problem: Protobuf encoder expected Long objects for uint64 fields
   - Solution: Added `Long.fromNumber()` and `Long.fromString()` conversions
   - Files: `poker-vm/sdk/src/signingClient.ts:241-242, 290`

3. **JoinGame Keeper Implementation** - Empty stub
   - Problem: Keeper was just a TODO comment
   - Solution: Implemented full logic with validation, token transfer, PVM call, state update
   - File: `pokerchain/x/poker/keeper/msg_server_join_game.go`

### 📋 Phase 3 Progress - Dashboard & UI Integration (Oct 26, 2025)

**Goal:** Wire up Dashboard and Table pages to use Cosmos SDK

**Recent Progress:**
1. ✅ Add `queryGames()` and `queryGameState()` to SDK
2. ✅ Add auto action index tracking to SDK (mimic original client)
3. ✅ Migrate Dashboard hooks (`useFindGames`, `useNewTable`)
4. ✅ Update Dashboard page to use SDK
5. ✅ **NEW:** BuyInModal now displays full Cosmos balances (all tokens)
6. ✅ **NEW:** Removed ethers dependency, using native BigInt for USDC microunits
7. ⏳ Update Table page to use SDK + PVM WebSocket hybrid
8. ⏳ Test full flow: Dashboard → Create → Join → Play

**Recent Fix (Oct 30, 2025):**
- ✅ **Cosmos Address Migration Complete!**
  - Issue: UI components using `user_eth_public_key` instead of `user_cosmos_address`
  - Result: Legal actions not showing, player turn detection broken
  - **Files Fixed:**
    - `Footer.tsx:57` - Player action panel
    - `useNextToActInfo.ts:49` - Turn detection
    - `usePlayerTimer.ts:93` - Current user check
    - `usePlayerSeatInfo.ts:21` - Seat detection
    - `b52AccountUtils.ts:23` - Public key getter
    - `QRDeposit.tsx:207` - Deposit display
  - **Result:** Small blind, big blind, and all other legal actions now display correctly!

**See `poker-vm/STRADBROKE_ISLAND.md` for detailed plan!**

---

## ✅ RESOLVED: MsgJoinGame Type URL & Gas Limit (Oct 29, 2025)

### Issue
Transaction failures when joining games due to:
1. Type URL mismatch: `/block52.pokerchain.poker.MsgJoinGame` (wrong) vs `/pokerchain.poker.v1.MsgJoinGame` (correct)
2. Insufficient gas: 150,000 gas limit too low (actual usage: 141k-184k)

### Solution Applied
1. **Rebuilt SDK locally** with correct type URLs (using symlink for development)
2. **Increased gas limit** from 150,000 to 400,000 (provides comfortable buffer)
3. **Cleared Vite cache** to force UI to use fresh SDK build
4. **Restarted services** with `--force` flag

### Test Results
✅ **Both transactions successful:**
- Transaction 1: `945C6D674F64A37636F61863C74A699663C2B470092BB29735341A6291F33D56`
  - Gas used: 141,125 / 200,000 wanted
  - Status: SUCCESS
  - Player 1 joined seat 1

- Transaction 2: `AE9E6AD11E0A62A5EF18064CCC84383286FA2D19DAABC47DC95A4D35F62EF4CD`
  - Gas used: 183,976 / 200,000 wanted
  - Status: SUCCESS
  - Player 2 joined seat 2

### Gas Limit Decision
**Why 400,000?**
- Observed gas usage range: 141k-184k per join
- 400k provides 2x+ buffer for edge cases and variations
- Prevents "out of gas" failures during high load or complex game states
- Minimal cost increase (gas price is low: 0.025b52Token per unit)
- Better safe than sorry - failed transactions waste gas anyway

### Development Setup
Using symlinks for local SDK development (no npm publish needed):
```bash
# UI and PVM link to local SDK
poker-vm/ui/package.json: "@bitcoinbrisbane/block52": "file:../sdk"
poker-vm/pvm/ts/package.json: "@bitcoinbrisbane/block52": "file:../sdk"
```

---

## ⚠️ CRITICAL BLOCKERS - Transaction Signing Issues (RESOLVED)

### ✅ RESOLVED: "Unregistered type url: /pokerchain.poker.v1.MsgCreateGame" (Oct 21, 2025)

**Root Cause:**
CosmJS's SigningStargateClient doesn't know how to encode custom poker module messages. It only knows standard Cosmos SDK messages (bank, staking, gov, etc.).

**Error Message:**
```
Error: Unregistered type url: /pokerchain.poker.v1.MsgCreateGame
    at Registry.lookupTypeWithError
    at Registry.encode
```

**Solution Implemented:**
✅ Generated TypeScript client using `ignite generate ts-client` in `/pokerchain/`
✅ Copied generated types to SDK: `cp -r ts-client/* ../poker-vm/sdk/src/`
✅ Added dependencies to SDK package.json: `@bufbuild/protobuf` (^2.10.0), `long` (^5.3.2)
✅ Published SDK v3.0.1 to npm with all types included

**Files Changed:**
- `/pokerchain/ts-client/pokerchain.poker.v1/` - Generated poker module types
- `/poker-vm/sdk/src/pokerchain.poker.v1/` - Copied types location (NOT in `generated/`)
- `/poker-vm/sdk/package.json` - Added required dependencies

**Note:** The `/poker-vm/sdk/src/generated/` folder exists but is empty/stale. Types are in module-specific folders like `pokerchain.poker.v1/`.

**Resolved by:** Lucas Coullon (commit fe0a6ac)
**Status:** 🟢 COMPLETE - All transaction functionality works with SDK v3.0.1

---

### ✅ RESOLVED: Gas Token Configuration (Oct 18, 2025)

**Problem:**
SDK is using `usdc` for gas fees, but pokerchain uses native token for gas.

**Current code in `/poker-vm/sdk/src/cosmosClient.ts`:**
```typescript
// ❌ WRONG:
const fee = {
    amount: [{ denom: "usdc", amount: "1000" }],  // Can't pay gas with game currency!
    gas: "200000"
};

// ✅ CORRECT:
const fee = {
    amount: [{ denom: "b52Token", amount: "1000" }],  // Must use native chain token
    gas: "200000"
};
```

**Why this matters:**
- `usdc` is for poker games (bridged USDC)
- `b52Token` is for blockchain operations (gas fees, staking)
- Mixing them causes transaction failures

**Resolution:**
✅ Token denomination changed from `stake` to `b52Token` in PR #10 (Oct 18, 2025)
✅ Updated in `app.toml` and `genesis.json`
✅ Minimum gas price set to `0.01b52Token`

**Status:** 🟢 COMPLETE - SDK and chain now aligned on gas token

---

## 🪙 Token Architecture Documentation

### Three-Token System Explained:

#### 1. **`b52Token`** (Native Chain Token - Gas/Staking) ✅ **RENAMED Oct 18, 2025**
- **Purpose**: Pay gas fees, validator staking, governance voting
- **Defined in**: `pokerchain/app.toml` → `minimum-gas-prices = "0.01b52Token"`
- **Who has it**: Development accounts (alice, bob, etc.) get billions for testing
- **Previously**: Was called `stake` (standard Cosmos SDK dev token name)
- **Changed**: Oct 18, 2025 via PR #10 to align with project branding

**Example from genesis.json:**
```json
{
  "address": "b521dfe7r39q88zeqtde44efdqeky9thdtwngkzy2y",
  "coins": [
    {
      "denom": "b52Token",
      "amount": "1000000000000"
    }
  ]
}
```

**Note**: All configuration files now use `b52Token` consistently across `config.yml`, `app.toml`, and `genesis.json`.

#### 2. **`usdc`** (Bridge Token - Gaming Currency)
- **Purpose**: In-game poker currency (buy-ins, pots, payouts)
- **Created**: Dynamically minted when users deposit USDC from Base Chain via bridge
- **NOT in config.yml**: This token is created on-demand, not pre-allocated
- **Bridge contract**: `0xcc391c8f1aFd6DB5D8b0e064BA81b1383b14FE5B` (Base Chain)
- **Display name in UI**: `b52USDC` or `b52USD`
- **Decimals**: 6 (same as USDC standard)

**Bridge Flow:**
```
User deposits 100 USDC on Base Chain
    ↓
Bridge detects Deposited event
    ↓
Pokerchain mints 100,000,000 usdc (100 * 10^6)
    ↓
User receives b52USDC in Cosmos wallet
    ↓
User plays poker with b52USDC
```

#### 3. **Base USDC** (External Token)
- **Purpose**: Users deposit from Base Chain (Ethereum L2)
- **Token address**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (Base USDC)
- **Bridge contract**: `0xcc391c8f1aFd6DB5D8b0e064BA81b1383b14FE5B` (CosmosBridge)
- **Network**: Base Chain (Chain ID: 8453)

### Why Two Separate Tokens?

**Separation of Concerns:**
- `b52Token` = **Blockchain utility** (like ETH for Ethereum)
- `usdc/b52USDC` = **Application currency** (like USDC for payments)

**Benefits:**
- Gas prices stable (in b52Token)
- Game currency stable (pegged to USDC)
- Can't accidentally spend game winnings on gas fees
- Validators stake b52Token, not game currency

---

## 🔑 Private Key & Account Management

### Development Accounts (alice, bob, charlie, etc.)

**Where are they defined?**
- **Mnemonics**: Stored in `pokerchain/config.yml` (PLAIN TEXT - dev only!)
- **Private keys**: Encrypted in `~/.pokerchain/keyring-test/*.info` files (PBES2-encrypted JWT)
- **Access via CLI**: `pokerchaind keys list --keyring-backend test`

**Example from config.yml:**
```yaml
accounts:
  - name: alice
    coins:
      - 100usdc
      - 52000b52Token  # Native token for gas fees
    mnemonic: moon town sad rebuild sad gather note lion desk pen letter invite...

validators:
  - name: alice
    bonded: 50000b52Token  # Initial validator stake
```

**Note**: All configuration files (`config.yml`, `app.toml`, `genesis.json`) now consistently use `b52Token`.

**Security Note:**
⚠️ These accounts are for DEVELOPMENT ONLY! Never use these mnemonics on mainnet or with real funds.

### User Wallets (in Browser)

**Where are they stored?**
- **Mnemonic**: Browser localStorage (key: `STORAGE_COSMOS_MNEMONIC`)
- **Private keys**: Derived from mnemonic in browser memory (never sent to server)
- **Signing**: Happens client-side via `CosmosClient` → `SigningStargateClient`

**How it works:**
```
1. User generates/imports mnemonic in browser
2. Mnemonic saved to localStorage
3. CosmosClient reads mnemonic from localStorage
4. Creates DirectSecp256k1HdWallet from mnemonic
5. Wallet derives private key (in memory only)
6. Signs transactions locally
7. Broadcasts signed transaction to blockchain
```

**Key Point:**
The development accounts (alice, bob) are NOT used by the browser. They're separate accounts for testing the blockchain directly via CLI.

**Browser wallet vs. Development accounts:**
- **Browser wallet**: User's personal wallet (mnemonic in localStorage)
- **Alice/Bob**: Test accounts on the blockchain (mnemonic in config.yml)
- **They are different**: Browser wallet has its own address (e.g., `b52168ketml7...`)

---

## 🎯 Architecture Simplification TODO

### Current Architecture: CosmosContext (Complex)

**What it does:**
```typescript
// CosmosContext.tsx wraps entire app
<CosmosProvider>
  <App />
</CosmosProvider>

// Components use context
const { createGame } = useCosmos();
await createGame(...);
```

**Problems:**
- Context overhead and complexity
- Tightly coupled to React
- Hard to understand for new developers
- Unnecessary abstraction for stateless client

### Proposed Architecture: Direct SDK Usage (Simpler)

**What it would look like:**
```typescript
// useNewTable.ts - Just use SDK directly
import { CosmosClient } from "@bitcoinbrisbane/block52";

const client = new CosmosClient({
    mnemonic: getCosmosMnemonic(),
    rpcEndpoint: "http://localhost:26657",
    restEndpoint: "http://localhost:1317",
    chainId: "pokerchain",
    prefix: "b52",
    denom: "b52Token",
    gasPrice: "0.01b52Token"  // Must match or exceed validator minimum (app.toml)
});

const result = await client.createGame(...);
```

**Benefits:**
- ✅ Simpler - No context needed
- ✅ Easier to understand - Direct function calls
- ✅ More flexible - Each hook can have different config
- ✅ Better for testing - No React context mocking

**Trade-offs:**
- Multiple client instances created (but they're lightweight and stateless)
- Mnemonic loaded multiple times (still secure - in memory only)

**Decision:** Consider removing CosmosContext after message registration is fixed.

---

## ⛽ Gas Fee Configuration - Where to Change Transaction Costs

### Overview: Browser Wallet Needs BOTH Tokens

**Critical Understanding:**
Users need TWO different tokens to play poker on Pokerchain:

1. **`b52Token`** - For gas fees ✅ **UPDATED Oct 18, 2025**
   - Required for ALL blockchain transactions
   - Used to pay transaction fees (like ETH for Ethereum)
   - Without it: Transactions will be rejected!
   - **Previously**: Was called `stake` (changed via PR #10)

2. **`usdc`** (displays as `b52USDC`) - For poker games
   - Required for playing poker (buy-ins, bets)
   - Obtained by depositing USDC from Base Chain

**Example Transaction Flow:**
```
User creates a game with $100 buy-in:
├── Gas fee: 1000 b52Token (deducted from user's b52Token balance)
└── Buy-in: 100,000,000 usdc (locked from user's usdc balance)
```

### Where Gas Fees Are Configured

#### 1. Blockchain-Level Configuration (Validator Minimum)

**File:** `~/.pokerchain/config/app.toml`

```toml
###############################################################################
###                           Base Configuration                            ###
###############################################################################

# The minimum gas prices a validator is willing to accept for processing a
# transaction. A transaction's fees must meet the minimum of any denomination
# specified in this config (e.g. 0.25token1;0.0001token2).
minimum-gas-prices = "0.01b52Token"
```

**What this means:**
- Validators require **0.01 b52Token** per unit of gas (current setting)
- Your SDK must set `gasPrice` to **at least** `0.01b52Token` or transactions will be rejected
- You can change this to adjust minimum fees: `"0.001b52Token"` = require 0.001 b52Token per unit of gas
- Format: `"<amount><denom>"` (e.g., `"0.025b52Token"` or `"0b52Token"` for free)

**⚠️ CRITICAL:** SDK `gasPrice` must be ≥ validator `minimum-gas-prices`

**How to Change Gas Prices (Step-by-Step):**

1. **Stop the chain** (press Ctrl+C in the terminal running `ignite chain serve`)

2. **Edit the app.toml file:**
   ```bash
   # Open in your editor
   nano ~/.pokerchain/config/app.toml
   # or
   code ~/.pokerchain/config/app.toml
   # or
   vim ~/.pokerchain/config/app.toml
   ```

3. **Find and change the minimum-gas-prices line:**
   ```toml
   # Current setting (around line 11):
   minimum-gas-prices = "0.01b52Token"

   # Options you can change to:
   minimum-gas-prices = "0b52Token"                    # FREE (dev/testing only)
   minimum-gas-prices = "0.001b52Token"                # Tiny fee (testing)
   minimum-gas-prices = "0.01b52Token"                 # Current setting
   minimum-gas-prices = "0.025b52Token"                # Higher fee (mainnet level)
   minimum-gas-prices = "0.01b52Token,0.001usdc"      # Accept either token
   ```

4. **Save the file** (Ctrl+O in nano, :wq in vim)

5. **Restart the chain:**
   ```bash
   cd pokerchain
   ignite chain serve
   ```

6. **Verify the change took effect:**
   ```bash
   # Check the setting
   grep "minimum-gas-prices" ~/.pokerchain/config/app.toml
   ```

**Multi-Denomination Gas Fees:**

You can accept MULTIPLE tokens for gas fees:
```toml
# Accept either stake OR usdc for gas
minimum-gas-prices = "0.025stake,0.001usdc"
```

This means users can pay gas fees with either:
- 0.025 stake per gas unit, OR
- 0.001 usdc per gas unit

**Note:** Ignite CLI does NOT support setting this in `config.yml` - you must edit `app.toml` directly.

**Current Setting:** `"0stake"` = **FREE transactions** (good for development!)

---

### Understanding "0stake" - Current Gas Configuration

**What does `minimum-gas-prices = "0stake"` mean?**

```bash
# Check your current setting
grep "minimum-gas-prices" ~/.pokerchain/config/app.toml
# Output: minimum-gas-prices = "0stake"
```

**This means gas fees are FREE!**

Breaking down the format `"<amount><denom>"`:
- `0` = The price per gas unit (ZERO!)
- `stake` = The token denomination

**Example transaction cost:**
```
User creates a game:
├── Gas used: 150,000 units
├── Gas price: 0 stake per unit
├── Total fee: 150,000 × 0 = 0 stake
└── Cost to user: FREE! 🎉
```

**Why is it set to 0?**

Ignite CLI automatically sets `minimum-gas-prices = "0stake"` for development chains because:
- ✅ Makes development easier - no need to manage gas tokens
- ✅ Faster testing - don't worry about running out of gas money
- ✅ Focus on features - not on funding test accounts
- ✅ Perfect for local development

**When to keep it as 0stake:**
- ✅ Local development (current situation)
- ✅ Running automated tests
- ✅ Rapid prototyping
- ✅ Developer onboarding

**When to change it (to something like 0.025stake):**
- 🚀 Testnet deployment - prevents spam attacks
- 🚀 Mainnet deployment - validators earn fees
- 🚀 Production environment - anti-spam protection
- 🚀 Load testing - simulate real transaction costs

**What happens if you change it to 0.025stake?**

```
Create game transaction:
├── Gas used: 150,000 units
├── Gas price: 0.025 stake per unit
├── Total fee: 150,000 × 0.025 = 3,750 ustake
└── Cost: 0.00375 stake tokens per transaction
```

**Summary:**
- **Current:** `0stake` = FREE transactions ✅
- **Perfect for development** - No changes needed!
- **Change before mainnet** - Add `0.025stake` or similar

---

### Quick Reference: Changing Gas Prices with Ignite CLI

**Ignite CLI default:** When you run `ignite chain serve`, it automatically creates `~/.pokerchain/config/app.toml` with `minimum-gas-prices = "0stake"`

**To change the gas price:**

```bash
# 1. Stop the chain (if running)
# Press Ctrl+C in the terminal

# 2. Edit app.toml directly
nano ~/.pokerchain/config/app.toml

# 3. Find this line (around line 124):
minimum-gas-prices = "0stake"

# 4. Change to your desired value:
minimum-gas-prices = "0.025stake"     # Mainnet level
# or
minimum-gas-prices = "0.001stake"     # Testing level
# or
minimum-gas-prices = "0stake,0.001usdc"  # Multi-token

# 5. Save and exit (Ctrl+O, Enter, Ctrl+X in nano)

# 6. Restart the chain
cd pokerchain
ignite chain serve

# 7. Verify the change
grep "minimum-gas-prices" ~/.pokerchain/config/app.toml
```

**Common Gas Price Values:**

| Setting | Use Case | Cost per 100k gas |
|---------|----------|-------------------|
| `0stake` | Development (current) | FREE |
| `0.001stake` | Light testing | 100 ustake (0.0001 stake) |
| `0.025stake` | Mainnet/Production | 2,500 ustake (0.0025 stake) |
| `0.1stake` | High-security mainnet | 10,000 ustake (0.01 stake) |

**Multi-Token Gas Fees:**

```toml
# Users can pay with EITHER token
minimum-gas-prices = "0.025stake,0.001usdc"
```

This allows users to choose:
- Pay 0.025 stake per gas, OR
- Pay 0.001 usdc per gas

**Note:** The setting in `~/.pokerchain/config/app.toml` is only used when running the chain locally. For production/testnet, you'll configure this in your validator's `app.toml` file.

---

#### 2. SDK Configuration (Client-Side)

**File:** `/poker-vm/sdk/src/cosmosClient.ts` (multiple places)

**Location A: Default Config (line ~573)**
```typescript
export const getDefaultCosmosConfig = (domain: string = "localhost"): CosmosConfig => ({
    rpcEndpoint: `http://${domain}:26657`,
    restEndpoint: `http://${domain}:1317`,
    chainId: "pokerchain",
    prefix: "b52",
    denom: "b52USDC",  // ❌ WRONG - Should be "stake"
    gasPrice: "0.001b52USDC"  // ❌ WRONG - Should be "0.001stake"
});
```

**Location B: SigningStargateClient Initialization (line ~113)**
```typescript
this.signingClient = await SigningStargateClient.connectWithSigner(
    this.config.rpcEndpoint,
    this.wallet,
    {
        gasPrice: GasPrice.fromString(this.config.gasPrice)  // Uses config.gasPrice
    }
);
```

**Location C: Transaction Fee (line ~482 in createGame method)**
```typescript
const fee = {
    amount: [{ denom: "usdc", amount: "1000" }],  // ❌ WRONG - Should be "stake"
    gas: "200000"  // Gas limit (max computation units)
};
```

### ✅ SDK Configuration (Fixed Oct 18, 2025)

#### Default Gas Denom Configuration

**File:** `/poker-vm/sdk/src/cosmosClient.ts`

```typescript
// ✅ CURRENT (using b52Token):
export const getDefaultCosmosConfig = (domain: string = "localhost"): CosmosConfig => ({
    denom: "b52Token",  // Native token for gas
    gasPrice: "0.01b52Token"  // Must match validator minimum-gas-prices
});
```

#### Transaction Fee Configuration

**File:** `/poker-vm/sdk/src/cosmosClient.ts`

```typescript
// ✅ CURRENT (using b52Token):
const fee = {
    amount: [{ denom: "b52Token", amount: "1000" }],  // 1000 micro-b52Token
    gas: "200000"
};
```

### Gas Fee Calculation

**Formula:**
```
Total Fee = gasPrice × gasUsed
```

**Example:**
- Gas price: `0.01b52Token` per gas unit (validator minimum)
- Gas used: 100,000 units
- Total fee: 0.01 × 100,000 = **1,000 b52Token**

**Current Configuration:**
- Validator minimum: `0.01b52Token` (set in app.toml)
- SDK gas price: `0.01b52Token` (must be ≥ validator minimum)
- Typical gas limit: `200,000` units
- Typical transaction fee: **2,000 b52Token** (0.01 × 200,000)

**Important Rule:**
```
SDK gasPrice >= Validator minimum-gas-prices
```
If your SDK sets a lower gas price than the validator minimum, your transactions will be **rejected**.

**For mainnet, consider:**
- Gas price: `0.025b52Token` (prevents spam)
- Average transaction: ~100,000 gas
- Fee per transaction: ~2,500 b52Token

### ✅ Completed Changes

1. **✅ Rename token:** `stake` → `b52Token` in all config files (completed Oct 18, 2025 + updated config.yml)
2. **Set minimum gas price:** `0.025b52` in `app.toml`
3. **Update SDK config:** Change all references from `stake` to `b52`
4. **Add UI validation:** Warn users if insufficient `b52` for gas fees
5. **Implement gas estimation:** Calculate exact gas needed per transaction type

### Gas Estimation by Transaction Type

Estimated gas usage (to be measured):
- `MsgCreateGame`: ~150,000 gas
- `MsgJoinGame`: ~100,000 gas
- `MsgPerformAction`: ~80,000 gas
- `MsgLeaveGame`: ~90,000 gas

**At 0.025b52 per gas:**
- Create game: ~3,750 ub52 (0.00375 b52)
- Join game: ~2,500 ub52 (0.0025 b52)
- Poker action: ~2,000 ub52 (0.002 b52)

---

**Previous Status**: 🎉 BALANCE DISPLAY FIXED! Cosmos USDC formatting now working correctly
**Previous Block Height**: ~4028+ (local chain running)
**Previous CosmosClient Progress**: ✅ 13/27 IClient methods implemented (48%) - **`createGame()` + `findGames()` + `getBalance()` FULLY INTEGRATED!** 🎲💰

**✅ BRIDGE TEST SUCCESSFUL - CONFIRMED IN UI**:
- Test deposit from Base Chain (tx: `0x77c534e452b1b46ec5857c7ce0f92c49f96c41ad9f55d7f15302cab9daba2d9e`)
- Amount: 10000 usdc (0.01 USDC)
- Recipient: `b52168ketml7jed9gl7t2quelfkktr0zuuescapgde`
- Status: ✅ Minted successfully and balance confirmed in blockchain!
- Frontend: ✅ UI displays "0.01 b52USD" correctly under "Cosmos b52USDC Balance"

**✅ REFACTORING COMPLETE**: Bridge now uses proper pointer-based keeper sharing following Cosmos SDK best practices. Global variable workaround has been removed.

**✅ MERGED WITH REMOTE**: Successfully merged 13 commits from origin/main including game state queries, player actions, and poker logic enhancements. Only 1 minor conflict (openapi.json) resolved cleanly.

**✅ GAME CREATION IMPLEMENTATION COMPLETE** (October 11, 2025):
- Implemented custom MsgCreateGame protobuf encoder with Writer/Reader from protobufjs
- Registered /pokerchain.poker.v1.MsgCreateGame in CosmJS Registry to fix "Unregistered type url" error
- Fixed "Cannot read properties of undefined (reading 'uint32')" by adding Writer.create() default parameter
- Centralized blockchain constants in COSMOS_CONSTANTS (chain ID, prefix, denom, decimals, gas price)
- Updated useNewTable hook to use CosmosClient.createGame() instead of deprecated PVM RPC
- Added Cosmos wallet validation in Dashboard component
- Resolved @cosmjs dependency conflicts using yarn resolutions
- **Architecture Decision**: UI uses Cosmos REST API for queries, SigningStargateClient for transactions (NOT Tendermint RPC)

## 🚀 Quick Start Command (STANDARD METHOD)

**This is the standard way to start the chain with logging:**

```bash
cd pokerchain

# Start chain with logging to home directory
ignite chain serve --verbose 2>&1 | tee -a ~/pokerchain-node.log
```

**What this does:**
- ✅ Starts the chain with verbose logging
- ✅ Saves all output to `~/pokerchain-node.log` (in your home directory)
- ✅ Displays output in terminal simultaneously
- ✅ Appends to existing log file (doesn't overwrite)

**Important Notes:**
- Logs are saved in your home directory: `~/pokerchain-node.log`
- The `~` symbol means `/Users/alexmiller` (your home directory)
- The `tee -a` command displays output AND appends to file
- Press `Ctrl+C` to stop the chain
- Don't save logs inside `~/.pokerchain/` because Ignite deletes that directory on startup

**View logs in another terminal:**
```bash
# View last 50 lines
tail -50 ~/pokerchain-node.log

# Watch logs in real-time
tail -f ~/pokerchain-node.log

# Search for bridge activity
grep -i "bridge\|deposit\|mint" ~/pokerchain-node.log

# Search for trackMint logs (detailed minting flow)
grep "trackMint" ~/pokerchain-node.log
```

**Or start in background (advanced):**
```bash
cd pokerchain
nohup ignite chain serve --verbose > ~/pokerchain-node.log 2>&1 &

# View the background process
ps aux | grep ignite

# Stop background process
pkill -f "ignite chain serve"
```

**Important Directories:**
- **Data directory**: `~/.pokerchain`
- **Config files**: `~/.pokerchain/config/`
  - `app.toml` - Application configuration (bridge settings, API ports)
  - `config.toml` - CometBFT configuration
  - `genesis.json` - Genesis state
- **Blockchain data**: `~/.pokerchain/data/`
- **Keyring (wallets)**: `~/.pokerchain/keyring-test/`
- **Logs**: `~/pokerchain-node.log` (full path: `~/pokerchain-node.log`)

**Test Accounts** (generated with `--reset-once`):
- **Alice**: `b5213awx5hajghvplycggzae4dlfd40d6skt5f8fgd`
  - Mnemonic: `moon town sad rebuild sad gather note lion desk pen letter invite cabin ivory approve stem calm arch kiwi pull pride unveil wait slot`
- **Bob**: `b521v6ch855ep7upy63u284e9cyzrszrrf7phrs09n`
  - Mnemonic: `follow peace crouch uncover punch crash floor share rigid absent immune return sword veteran kite magnet dad real wedding tank above short spell random`

---

## 🔍 Bridge Debugging Guide

### Understanding the Bridge Flow

When you deposit USDC on Base Chain, here's what should happen:

1. **Base Chain** - You approve and deposit USDC to bridge contract (`0xcc391c8f1aFd6DB5D8b0e064BA81b1383b14FE5B`)
2. **Bridge Service** - Pokerchain bridge polls Base every 15 seconds, detects deposit event
3. **Cosmos Chain** - Bridge mints equivalent `usdc` tokens to your Cosmos address
4. **UI** - Dashboard queries Cosmos balance and displays it

### Check if Bridge Detected Your Deposit

**1. View chain logs for bridge activity:**
```bash
# Search logs for bridge activity
grep -i "bridge\|deposit\|mint" ~/pokerchain-node.log | tail -20

# Search for detailed minting flow
grep "trackMint" ~/pokerchain-node.log

# Look for these emoji indicators:
# 🌉 Bridge Service Starting
# 🔍 Checking for new deposits
# 📋 Found deposit events
# 🔷 trackMint: Starting deposit processing
# ✅ trackMint: Coins minted successfully
# 🎉 trackMint: Deposit processed successfully!
# ❌ Error (if something went wrong)
```

**2. Query your Cosmos balance:**
```bash
# Get your full Cosmos address from the UI (not truncated)
# Then query balance:
~/go/bin/pokerchaind query bank balances YOUR_COSMOS_ADDRESS --node http://localhost:26657
```

**3. Check bridge configuration:**
```bash
# View bridge settings
grep -A 6 "\[bridge\]" ~/.pokerchain/config/app.toml
```

### Troubleshooting Checklist

**Bridge not detecting deposits?**
- [ ] Is the chain running? Check terminal or logs
- [ ] Is bridge enabled? Check `enabled = true` in app.toml
- [ ] Is Base RPC working? Test: `curl https://base.llamarpc.com`
- [ ] Did you wait 15 seconds? Bridge polls every 15 seconds
- [ ] Is the transaction confirmed on Base? Check [Basescan](https://basescan.org)

**Cosmos balance showing $0.00?**
- [ ] Open browser console (F12) in UI
- [ ] Look for `[Cosmos Balance]` debug logs
- [ ] Check if RPC endpoint is `http://localhost:26657`
- [ ] Verify your Cosmos address is correct
- [ ] Try clicking "Refresh" button in UI

**Get transaction hash from Base Chain:**
1. Go to your wallet (MetaMask, etc.)
2. Find the deposit transaction
3. Copy transaction hash (starts with `0x`)
4. Search logs: `grep -i "YOUR_TX_HASH" ~/pokerchain-node.log`

### UI Debug Console

The Dashboard now has detailed console logging. Open browser console (F12) and look for:

```
[Cosmos Balance] ========================================
[Cosmos Balance] Fetching balance for Cosmos address: b52...
[Cosmos Balance] RPC endpoint: http://localhost:26657
[Cosmos Balance] All balances from Cosmos: [...]
[Cosmos Balance] ✅ Found usdc balance: ...
```

If you see errors, they'll be prefixed with `[Cosmos Balance] ❌`.

### Manual Testing

**Test mint directly (as chain authority):**
```bash
# Mint 10,000 micro-USDC (= $0.01 USDC) to your address
~/go/bin/pokerchaind tx poker mint YOUR_COSMOS_ADDRESS 10000 \
  --from alice \
  --chain-id pokerchain \
  --yes

# Query balance after 5 seconds
~/go/bin/pokerchaind query bank balances YOUR_COSMOS_ADDRESS --node http://localhost:26657
```

---

## ✅ Completed Tasks

### 1. Pokerchain Setup & Configuration
- [x] Install Pokerchain binary (`make install`)
- [x] Configure chain with `config.yml` settings
- [x] Start development chain with `ignite chain serve -v`
- [x] Verify chain is running (REST API: 1317, RPC: 26657, gRPC: 9090)
- [x] Create test accounts (alice, bob)

### 2. Bridge Service Implementation
- [x] Add bridge service initialization to `app/app.go`
- [x] Implement emoji logging in `bridge_service.go` (🌉, 📊, ✅, ❌)
- [x] Configure bridge in `~/.pokerchain/config/app.toml`
- [x] Verify bridge listener starts and polls Base Chain
- [x] Confirm bridge connects to CosmosBridge contract on Base
- [x] **Implement queue-based architecture with EndBlocker** (Oct 7, 2025)
  - Bridge service queues deposits in memory (thread-safe)
  - EndBlocker processes queue with proper SDK context
  - Fixes SDK context panic issue
- [x] **Committed bridge implementation** (Oct 7, 2025)
  - `app/app.go` - Wire bridge service to keeper
  - `x/poker/keeper/bridge_service.go` - Queue-based deposit detection
  - `x/poker/keeper/keeper.go` - Bridge service reference
  - `x/poker/module/module.go` - EndBlocker deposit processing
  - `cmd/pokerchaind/cmd/config.go` - BridgeConfig and app.toml template

todo: 
### 3. UI Development Setup
- [x] Install Node.js 22.12
- [x] Fix package dependencies (`@bitcoinbrisbane/block52` version)
- [x] Configure UI endpoints in `.env`:
  - `VITE_COSMOS_REST_URL=http://localhost:1317` todo: move to choose in the front.
  - `VITE_COSMOS_RPC_URL=http://localhost:26657`
  - `VITE_COSMOS_GRPC_URL=http://localhost:9090`
- [x] Add missing `getTestAddresses()` function to `cosmosUtils.ts`
- [x] Start UI dev server (`yarn dev` on port 5173)
- [x] Create Cosmos wallet generator page (`CosmosWalletPage.tsx`)
- [x] Add `/wallet` route to App.tsx
- [x] Wallet page uses colorConfig CSS variables for branding
- [x] Display live balances for test accounts (Alice & Bob)

### 4. Base Chain Integration
- [x] Add Base Chain constants to `ui/src/config/constants.ts`:
  - `BASE_CHAIN_ID = 8453`
  - `BASE_RPC_URL = "https://mainnet.base.org"`
  - `BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"`
  - `COSMOS_BRIDGE_ADDRESS = "0xcc391c8f1aFd6DB5D8b0e064BA81b1383b14FE5B"`
- [x] Update `USDCDepositModal.tsx` to use Base Chain and CosmosBridge
- [x] Modal deposits to Cosmos address (string) instead of game account
- [x] Added network switching to Base Chain (Chain ID: 8453)
- [x] Update `Dashboard.tsx` to fetch USDC balance from Base Chain
- [x] Bridge listener will auto-mint b52USDC when deposit detected

### 5. Documentation
- [x] Create `GETTING_STARTED.md` guide
- [x] Create `BRIDGE_PERSISTENCE_ISSUE.md` for future enhancement
- [x] Update `WORKING_CHECKLIST.md` with current progress
- [x] Add detailed test plan for Base Chain USDC deposit
- [x] Add SDK implementation task for CosmosClient

---

## 🚧 In Progress

### Testing Game Creation on Local Pokerchain (Oct 11, 2025)
**Status**: ✅ Transaction created and appears on chain! 🎉

**Recent Progress**:
- ✅ Protobuf Writer fix applied successfully
- ✅ Custom MsgCreateGame registered in CosmJS
- ✅ Transaction broadcast returns hash
- ✅ **SUCCESS**: Transaction confirmed in block #231 with 1 tx! 🎉
- ✅ Cosmos Explorer built and deployed to verify transactions
- 🔍 Local pokerchain running at block ~231+ (and counting)
- 🔍 REST/RPC endpoints confirmed accessible at localhost:1317 and localhost:26657

**Cosmos Explorer Built** (Oct 11, 2025 @ 7:30 PM): todo: move explorer into the app (ui)
- ✅ Built React-based Cosmos block explorer
- ✅ Shows latest blocks in real-time (auto-refresh every 2 seconds)
- ✅ Block #231 confirmed with 1 transaction
- ✅ Transaction search functionality implemented
- 📍 Location: `/poker-vm/cosmosexplorer/`
- 🌐 URL: http://localhost:3000
- 📋 Checklist: `/poker-vm/cosmosexplorer/COSMOS_EXPLORER_CHECKLIST.md`

## 🎯 MAJOR TASK: Move Cosmos Explorer into Main UI App

**Goal**: Integrate Cosmos Explorer pages into the main poker UI app for Electron packaging

**Why**:
- UI will be packaged as Electron desktop app
- Users should be able to view blockchain explorer within the app
- Consolidates codebase (removes separate cosmosexplorer project)

**Tasks**:
- [x] Create `/explorer` directory in `ui/src/pages/` ✅
- [x] Copy `BlocksPage.tsx` from cosmosexplorer to `ui/src/pages/explorer/` ✅
- [x] Copy `TransactionsPage.tsx` from cosmosexplorer to `ui/src/pages/explorer/` ✅
- [x] Add `/explorer` and `/explorer/tx/:hash` routes to React Router ✅
- [x] Update imports and dependencies (uses CosmosClient instead of separate cosmosApi) ✅
- [ ] Add navigation links to explorer from main UI (Dashboard)
- [ ] Test both pages work correctly in main UI
- [ ] Update styling to match main UI theme

**Source**: `poker-vm/cosmosexplorer`
**Destination**: `poker-vm/ui/src/pages/explorer`

---

**Next Steps**:
1. [x] Get transaction hash from block #68 to verify game creation ✅ `6DC1920A33244C65505CEA60DD86961A89DB31689772B78420F493F99FC17682`
2. [x] Query games list to confirm game was created ✅ Returns 1 game
3. [x] **Test findGames() in Dashboard** ✅ **WORKING!** Games list displays correctly from Cosmos REST API
4. [x] Verify MsgCreateGame message details ✅ Game ID `0xbf618c81...` created successfully
5. [x] Fix buy-in display formatting ✅ **FIXED!** Now shows correct amounts ($1.00, $100.00, etc.)
6. [ ] Test transaction search with actual tx hash in Cosmos Explorer
7. [ ] Fix ESLint warning in BlocksPage.tsx (unused `Link` import)

**Recent Implementation** (Oct 12, 2025 - PM):
- ✅ **COSMOS ACCOUNT UTILS & BALANCE INTEGRATION** - Replaced all Ethereum account utilities
  - Created `cosmosAccountUtils.ts` replacing `b52AccountUtils.ts` with Cosmos equivalents:
    - `getCosmosAddress()` - Get Cosmos address from initialized client (async)
    - `getCosmosAddressSync()` - Get address from localStorage (sync)
    - `getFormattedCosmosAddress(length)` - Format address with ellipsis (b521rg...fj9p)
    - `hasCosmosWallet()` - Check if Cosmos wallet is connected
    - `getCosmosBalance(denom)` - Get balance for specific token (returns bigint)
    - `getAllCosmosBalances()` - Get all token balances
  - Updated BuyInModal to use Cosmos balance (6 decimal USDC microunits instead of 18 decimal Wei)
  - Updated Table.tsx to use `getCosmosBalance()` and `getCosmosAddressSync()`
  - Updated SitAndGoAutoJoinModal.tsx to use Cosmos balance queries
  - All buy-in/blind amount formatting changed from `formatWeiToSimpleDollars` → `formatUSDCToSimpleDollars`
  - Balance fetching now uses `ethers.formatUnits(amount, 6)` for USDC microunits
  - **FULLY TESTED**: Dashboard now correctly displays "$1.00" instead of "$0.00" for game buy-ins! 🎉

**✅ TypeScript Build Fixed** - All type errors resolved:
1. ✅ Using `getWalletAddress()` instead of accessing non-existent `signerAddress` property
2. ✅ Understanding that `getBalance()` returns `bigint` directly, not an object
3. ✅ Providing both async and sync versions of `getCosmosAddress()` for different use cases
4. ✅ Using localStorage for synchronous address access in component initialization
5. ✅ **Result**: `yarn build` succeeds with zero TypeScript errors! 🎉

**🚧 ONGOING: `user_eth_public_key` Migration** (12 files remaining):
Need to replace all Ethereum localStorage references with Cosmos equivalents:

**Migration Tasks**:
- [ ] Dashboard.tsx - Replace `user_eth_public_key` with `getCosmosAddressSync()`
- [ ] usePlayerTimer.ts - Replace `user_eth_public_key` with `getCosmosAddressSync()`
- [ ] useNextToActInfo.ts - Replace `user_eth_public_key` with `getCosmosAddressSync()`
- [ ] GameStateContext.tsx - Replace `user_eth_public_key` with `getCosmosAddressSync()`
- [ ] VacantPlayer.tsx - Replace `user_eth_public_key` with `getCosmosAddressSync()`
- [ ] Footer.tsx - Replace `user_eth_public_key` with `getCosmosAddressSync()`
- [ ] useVacantSeatData.ts - Replace `user_eth_public_key` with `getCosmosAddressSync()`
- [ ] QRDeposit.tsx - Replace `user_eth_public_key` with `getCosmosAddressSync()`
- [ ] useTablePlayerCounts.ts - Replace `user_eth_public_key` with `getCosmosAddressSync()`
- [ ] useUserWallet.ts - Replace `user_eth_public_key` with `getCosmosAddressSync()`
- [ ] usePlayerSeatInfo.ts - Replace `user_eth_public_key` with `getCosmosAddressSync()`
- [ ] usePlayerLegalActions.ts - Replace `user_eth_public_key` with `getCosmosAddressSync()`

**Migration Pattern**:
```typescript
// OLD (Ethereum)
const publicKey = localStorage.getItem("user_eth_public_key");

// NEW (Cosmos)
import { getCosmosAddressSync } from "../../utils/cosmosAccountUtils";
const publicKey = getCosmosAddressSync();
```

**Files to Check**:
```bash
# Search for remaining references
cd poker-vm/ui/src
grep -r "user_eth_public_key" . --include="*.ts" --include="*.tsx"
```

**Recent Implementation** (Oct 12, 2025 - AM):
- ✅ **Implemented `ListGames` query handler** in pokerchain (`query_list_games.go`)
  - Uses `k.Games.Walk()` to iterate all games from blockchain state
  - Returns JSON array of games via REST API
- ✅ Added `findGames(min?, max?)` method to SDK CosmosClient
- ✅ Added `listGames()` helper method (calls `/block52/pokerchain/poker/v1/list_games`)
- ✅ Updated `useFindGames` hook to use Cosmos REST API instead of Ethereum NodeRpcClient
- ✅ Removed Ethereum/private key dependencies from useFindGames
- ✅ **TESTED & WORKING!** - Games display in Dashboard UI
  - Game created: `0xbf618c81022d227f1f543ffe22eaac94b33b6c7e098302e51fac1dd24715155f`
  - Appears in "Available Tables" section with Join button
  - Shows player count (0/4 Players)
  - Enhanced logging confirms data flow from Cosmos → SDK → UI

**Test Account**:
- Address: `b52168ketml7jed9gl7t2quelfkktr0zuuescapgde`
- Balance: 6,570 usdc (0.00657 USDC)
- Previous Issue: Needed 1,000,000 usdc (1.00 USDC) for Sit & Go game - **RESOLVED by creating transaction**

### Base Chain USDC Deposit Test
**Goal**: Test real USDC deposit from Base Chain to CosmosBridge contract

**Test Plan**:
- [ ] **Step 1**: Visit `http://localhost:5173/wallet` and generate Cosmos wallet
- [ ] **Step 2**: Copy your Cosmos address (starts with `b52...`)
- [ ] **Step 3**: Connect MetaMask to Base Chain (Chain ID: 8453)
- [ ] **Step 4**: Verify you have USDC on Base Chain (check MetaMask balance)
- [ ] **Step 5**: Visit `http://localhost:5173` and click green "Deposit" button
- [ ] **Step 6**: Modal should show your Base Chain USDC balance
- [ ] **Step 7**: Modal should show your Cosmos address as receiver
- [ ] **Step 8**: Enter amount: `0.01` USDC (1 cent test)
- [ ] **Step 9**: Click "Approve USDC" and confirm in MetaMask
- [ ] **Step 10**: Wait for approval confirmation (~5-10 seconds)
- [ ] **Step 11**: Click "Deposit" button and confirm in MetaMask
- [ ] **Step 12**: Wait for deposit confirmation (~5-10 seconds)
- [ ] **Step 13**: Check Pokerchain terminal for bridge logs (should see 🌉 emojis)
- [ ] **Step 14**: Bridge should detect deposit within 15 seconds (next polling cycle)
- [ ] **Step 15**: Verify b52USDC minted: `pokerchaind query bank balances <your-cosmos-address>`
- [ ] **Step 16**: Check balance on `/wallet` page (should auto-update)

**Expected Results**:
- ✅ Approval transaction succeeds on Base Chain
- ✅ Deposit transaction succeeds on Base Chain
- ✅ Bridge logs show: "📋 Found deposit events" with your Cosmos address
- ✅ Bridge mints 0.01 b52USDC to your Cosmos address
- ✅ Balance visible via CLI and wallet page

**Troubleshooting**:
- If deposit not detected: Check `starting_block` in bridge config (should be recent)
- If wrong amount: USDC has 6 decimals, so 0.01 USDC = 10000 units
- If MetaMask error: Make sure you're on Base Chain (8453) not Ethereum mainnet
- If no Cosmos wallet: Visit `/wallet` first to generate one

### UI Wallet Integration (COMPLETED ✅)
- [x] Add route for CosmosWalletPage in React Router
- [x] Test wallet generation in browser
- [x] Wallet saves to localStorage
- [x] Balance display component with live test account balances
- [x] Uses colorConfig CSS variables for consistent branding

---

## 👤 User Stories - Testing Flow

### Story 1: Generate Cosmos Wallet ✅ COMPLETED
**As a user**, I can visit `/wallet` and generate a new Cosmos wallet so that I have an address to receive deposits and play poker.

**Acceptance Criteria**:
- [x] Navigate to `http://localhost:5173/wallet`
- [x] Click "Generate New Wallet" button
- [x] See 24-word mnemonic displayed
- [x] Address starts with `b52` prefix
- [x] Wallet automatically saves to browser localStorage
- [x] Can copy seed phrase and address to clipboard

**Implementation Details**:
- Uses `DirectSecp256k1HdWallet.generate(24, { prefix: "b52" })`
- Saves to localStorage: `STORAGE_COSMOS_MNEMONIC` and `STORAGE_COSMOS_ADDRESS`
- Component: `/ui/src/components/CosmosWalletPage.tsx`
- Route: `/wallet` in `App.tsx`
- Styled with colorConfig CSS variables for consistent branding

### Story 2: Import Existing Wallet
**As a user**, I can import an existing Cosmos wallet using my seed phrase so that I can restore my previous wallet.

**Acceptance Criteria**:
- [ ] Navigate to `http://localhost:5173/wallet`
- [ ] Paste 12 or 24-word seed phrase into import field
- [ ] Click "Import Wallet" button
- [ ] See my imported address displayed (starts with `b52`)
- [ ] Wallet saves to localStorage
- [ ] Can view balance after import

### Story 3: Deposit USDC to Bridge
**As a user**, I can deposit USDC on Base Chain to the CosmosBridge contract so that I receive b52USDC on Pokerchain.

**How It Works**:
1. **User connects MetaMask** to Base Chain (Chain ID: 8453)
2. **User's Ethereum address** (from MetaMask) is the sender on Base Chain
3. **User enters Cosmos address** (b52...) as the receiver parameter - this is the address saved in browser localStorage from the wallet page
4. **User approves USDC** for CosmosBridge contract to spend
5. **User calls `depositUnderlying(amount, receiver)`** on CosmosBridge contract:
   - `amount`: USDC amount to deposit (e.g., 100 USDC)
   - `receiver`: Cosmos address (string) where b52USDC will be minted (from localStorage)
6. **Contract emits `Deposited` event** with receiver address and amount
7. **Bridge listener** on Pokerchain detects the event
8. **Bridge mints b52USDC** to the Cosmos address specified in `receiver` parameter

**Acceptance Criteria**:
- [ ] Connect MetaMask to Base Chain (Chain ID: 8453, RPC: https://mainnet.base.org)
- [ ] Verify MetaMask shows USDC balance on Base Chain
- [ ] UI reads Cosmos address from localStorage (generated from wallet page)
- [ ] UI displays Cosmos receiver address (b52...) to user for verification
- [ ] User enters deposit amount (e.g., 100 USDC)
- [ ] UI calls USDC.approve(bridgeAddress, amount) first
- [ ] User confirms approval transaction in MetaMask
- [ ] UI calls CosmosBridge.depositUnderlying(amount, cosmosAddress)
- [ ] User confirms deposit transaction in MetaMask
- [ ] See transaction confirmed on Base Chain (via Basescan)
- [ ] See bridge logs detect deposit event in Pokerchain terminal (🌉 Bridge Service)
- [ ] Verify `Deposited` event contains correct Cosmos address

**Test Command**:
```bash
cd poker-vm/contracts
yarn test:bridge:usdc
```

**Key Contract Function**:
```solidity
// CosmosBridge.sol line 58-63
function depositUnderlying(uint256 amount, string calldata receiver) external returns(uint256) {
    (uint256 index, uint256 received) = _deposit(amount, msg.sender, receiver, underlying);
    emit Deposited(receiver, received, index);
    return index;
}
// receiver = Cosmos address (b52...) from localStorage
// msg.sender = User's Ethereum address from MetaMask
```

### Story 4: Verify Bridge Mints b52USDC
**As a user**, after depositing USDC on Base Chain, I can see b52USDC appear in my Cosmos wallet balance.

**Acceptance Criteria**:
- [ ] Bridge listener detects deposit event (check chain logs: 🌉 Bridge Service)
- [ ] Bridge processes transaction and mints b52USDC
- [ ] Can query balance via CLI: `pokerchaind query bank balances <my-address>`
- [ ] Balance shows in UI wallet page
- [ ] Transaction marked as processed in chain state

**Query Command**:
```bash
pokerchaind query bank balances b52<your-address>
# or via REST API
curl http://localhost:1317/cosmos/bank/v1beta1/balances/b52<your-address>
```

### Story 5: Play Poker with b52USDC
**As a user**, I can use my b52USDC balance to join poker games and place bets.

**Acceptance Criteria**:
- [ ] Navigate to poker table page
- [ ] See my b52USDC balance displayed
- [ ] Join a poker game with buy-in
- [ ] Place bets using b52USDC
- [ ] See balance update in real-time as I play
- [ ] Game state persists on Pokerchain

### Story 6: Withdraw b52USDC to Base Chain
**As a user**, I can withdraw my b52USDC back to Base Chain to receive USDC in my Ethereum wallet.

**Acceptance Criteria**:
- [ ] Navigate to withdrawal page
- [ ] Enter withdrawal amount (e.g., 50 b52USDC)
- [ ] Enter my Ethereum address on Base Chain
- [ ] Submit withdrawal transaction
- [ ] Bridge burns b52USDC on Pokerchain
- [ ] Bridge releases USDC to my Ethereum address on Base Chain
- [ ] See USDC arrive in MetaMask

**Test Command**:
```bash
cd poker-vm/contracts
yarn test:bridge:withdraw
```

---

## 📋 Next Steps

### Immediate Tasks (Next 1-2 Hours)

1. **Add Wallet Page to UI Router**
   ```typescript
   // In src/main.tsx or router config
   import CosmosWalletPage from "./components/CosmosWalletPage";

   // Add route: /wallet
   ```

2. **Test Wallet Generation**
   - Visit `http://localhost:5173/wallet`
   - Generate new wallet
   - Verify 24-word mnemonic displays
   - Verify address starts with `b52`
   - Confirm saves to localStorage

3. **Create Balance Display Component**
   - Show all token balances (stake, token, usdc)
   - Real-time balance updates
   - Copy address button

4. **Test Bridge Deposit Flow**
   ```bash
   cd poker-vm/contracts
   yarn test:bridge:usdc
   ```
   - Watch chain logs for deposit detection
   - Verify b52USDC mints to Cosmos address
   - Query balance with `pokerchaind query bank balances <address>`

### Medium-Term Tasks (Next Few Days)

5. **Create Deposit Page UI**
   - Connect MetaMask for Base Chain
   - Show USDC balance on Base
   - Deposit USDC to CosmosBridge
   - Show deposit confirmation
   - Display Cosmos balance after bridge

6. **Implement Keplr Wallet Integration**
   - Add Pokerchain to Keplr
   - Connect wallet button
   - Show balances from Keplr
   - Send transactions via Keplr

7. **Test Full Cycle**
   - Deposit USDC on Base → Bridge
   - Receive b52USDC on Cosmos
   - Play poker with b52USDC
   - Withdraw back to Base Chain

---

## 🎯 Current System Status

### Running Services

| Service | Status | Endpoint | Details |
|---------|--------|----------|---------|
| **Pokerchain** | ✅ Running | Block 4328 | Cosmos blockchain with bridge |
| **REST API** | ✅ Active | http://localhost:1317 | Query balances, state |
| **Tendermint RPC** | ✅ Active | http://localhost:26657 | Block events, txs |
| **gRPC** | ✅ Active | http://localhost:9090 | High-perf queries |
| **Bridge Listener** | ✅ Active | Polling Base Chain | Every 15 seconds |
| **UI Dev Server** | ✅ Running | http://localhost:5173 | React poker interface |

### Bridge Configuration

```toml
[bridge]
  enabled = true
  ethereum_rpc_url = "https://mainnet.base.org"
  deposit_contract_address = "0xcc391c8f1aFd6DB5D8b0e064BA81b1383b14FE5B"
  usdc_contract_address = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  polling_interval_seconds = 15
  starting_block = 36469223
```

### Test Accounts

| Account | Address | Stake | Token |
|---------|---------|-------|-------|
| **alice** | `b521xa0ue7p4z4vlfphkvxwz0w8sj5gam8zxszqy9l` | 100,000,000 | 20,000 |
| **bob** | `b521qu2qmrc6rve2az7r74nc5jh5fuqe8j5fpd7hq0` | 100,000,000 | 10,000 |

---

## 📝 Identified Issues & Future Work

### High Priority
- [x] **Refactor Bridge Service to Use Pointer-Based Keeper Sharing** ✅ COMPLETED (Oct 8, 2025 @ 1:15 AM)
  - **Previous Issue**: Was using global variable workaround to share bridge service between app.go and EndBlocker
  - **Fix Applied**: Refactored keeper to use pointer (`*keeper.Keeper`) instead of value throughout codebase
  - **Files Changed**:
    - `x/poker/module/depinject.go` - Now returns `*keeper.Keeper` instead of `keeper.Keeper` (line 44)
    - `x/poker/keeper/keeper.go` - Removed global variable and mutex, `NewKeeper()` now returns `*Keeper` (line 47)
    - `x/poker/module/module.go` - Updated AppModule to accept `*keeper.Keeper` (line 34, 41)
    - `x/poker/keeper/msg_server.go` - Updated to embed `*Keeper` (line 8, 13)
    - `x/poker/keeper/query.go` - Updated to use `*Keeper` (line 11, 16)
    - `x/poker/keeper/keeper_test.go` - Updated fixture to use `*keeper.Keeper` (line 23)
    - `x/poker/simulation/*.go` - Updated all 7 simulation functions to accept `*keeper.Keeper`
    - `app/app.go` - Updated PokerKeeper field to `*pokermodulekeeper.Keeper` (line 102)
  - **Benefits**: Thread-safe, follows Cosmos SDK best practices, easier to test, production-ready
  - **Testing**: All tests pass (`go test ./x/poker/...`), binary builds successfully (`make install`)
- [ ] Implement Keplr wallet integration for production
- [ ] Create deposit page UI for CosmosBridge
- [ ] Add transaction history display
- [ ] Implement withdrawal flow (Cosmos → Base)

### Medium Priority
- [x] **Test bridge with real deposit from Base Chain** ✅ COMPLETED (Oct 8, 2025)
  - [x] Create test deposit transaction (tx: `0x77c534e452b1b46ec5857c7ce0f92c49f96c41ad9f55d7f15302cab9daba2d9e`)
  - [x] Verify bridge detects Deposited event (✅ Found at block 36481998)
  - [x] Confirm EndBlocker mints b52USDC to Cosmos address (✅ Minted 10000usdc)
  - [x] Query balance to verify tokens received (✅ Balance confirmed: 10000usdc)
  - **Result**: Bridge working end-to-end with trackMint logging throughout
- [ ] **Implement CosmosClient in SDK to implement IClient interface**
  - **Goal**: Extend CosmosClient to fully implement IClient interface (same as NodeRpcClient)
  - **Location**: `/poker-vm/sdk/src/cosmosClient.ts`
  - **Current State**: CosmosClient has basic Cosmos SDK blockchain methods only
  - **Needed**: Add poker-specific game methods to match IClient interface
  - **Benefit**: Unifies Ethereum PVM and Cosmos PVM under same SDK interface

  **IClient Implementation Status** (27 methods total):

  **✅ Implemented (11 methods)** - Basic Cosmos SDK queries + Game Creation via SigningStargateClient:
  - [x] `getAccount(address)` - Get account info (line 118-123)
  - [x] `getBalance(address)` - Get single denom balance (line 68-74)
  - [x] `getAllBalances(address)` - Get all token balances (line 79-85)
  - [x] `sendTokens(from, to, amount)` - Transfer tokens (line 90-113) *Note: This is `transfer()` in IClient*
  - [x] `getHeight()` - Get current block height (line 141-146)
  - [x] `getTx(txHash)` - Get transaction by hash (line 151-156)
  - [x] `getBlock(height)` - Get specific block (line 170-175)
  - [x] `getBlocks(startHeight, count)` - Get multiple blocks (line 180-199)
  - [x] `getLatestBlocks(count)` - Get recent blocks (line 204-208) *Note: This is `getLastBlock()` in IClient*
  - [x] `createGame(gameType, minPlayers, maxPlayers, minBuyIn, maxBuyIn, smallBlind, bigBlind, timeout)` - **✅ IMPLEMENTED (Oct 11, 2025)** - Creates new poker game using CosmJS SigningStargateClient with custom MsgCreateGame protobuf encoder

  **🔧 CosmJS + Custom Protobuf Implementation Strategy** (Oct 11, 2025):
  - **Decision**: Use CosmJS SigningStargateClient with custom message type registration
  - **Reason**: Proper Cosmos SDK transaction signing and broadcasting
  - **Architecture**:
    - **UI → CosmJS SigningStargateClient → Cosmos RPC** for transactions (signing + broadcast)
    - **UI → Cosmos REST API** for queries (read-only, faster, cacheable)
  - **Key Implementation**: Custom protobuf encoder for MsgCreateGame
    - Added `Writer` and `Reader` imports from `protobufjs/minimal`
    - Registered custom GeneratedType in CosmJS Registry
    - Fixed "Unregistered type url" error
    - Fixed "Cannot read properties of undefined (reading 'uint32')" error
  - **Pattern**: All poker game **transactions** use SigningStargateClient, all **queries** use REST:
    - `createGame()` → SigningStargateClient with custom MsgCreateGame encoder ✅
    - `findGames()` → REST GET `/block52/pokerchain/poker/v1/list_games` ✅ **IMPLEMENTED (Oct 12, 2025)**
    - `playerJoin()` → SigningStargateClient with MsgJoinGame encoder (future)
    - `playerAction()` → SigningStargateClient with MsgPerformAction encoder (future)
    - `playerLeave()` → SigningStargateClient with MsgLeaveGame encoder (future)
    - `getGameState()` → REST GET `/poker/v1/game_state/{id}` (future)
  - **Testing**: Build SDK with `cd sdk && yarn build`, reinstall in UI with `yarn install --force`

  **✅ Implemented (12 methods)** - Basic Cosmos SDK queries + Game Creation + Game Listing:
  - [x] `getAccount(address)` - Get account info
  - [x] `getBalance(address)` - Get single denom balance
  - [x] `getAllBalances(address)` - Get all token balances
  - [x] `sendTokens(from, to, amount)` - Transfer tokens
  - [x] `getHeight()` - Get current block height
  - [x] `getTx(txHash)` - Get transaction by hash
  - [x] `getBlock(height)` - Get specific block
  - [x] `getBlocks(startHeight, count)` - Get multiple blocks
  - [x] `getLatestBlocks(count)` - Get recent blocks
  - [x] `createGame(...)` - **✅ WORKING** - Creates new poker game via CosmJS
  - [x] `findGames(min?, max?)` - **✅ IMPLEMENTED (Oct 12, 2025)** - Query available poker games via REST → `GET /block52/pokerchain/poker/v1/list_games`
  - [x] `listGames()` - Helper method for findGames()

  **❌ Not Implemented (16 methods)** - Poker-specific game logic:

  *Core Poker Game Methods* (4 remaining):
  - [ ] `getGameState(gameAddress, caller)` - **[RPC QUERY]** Get current game state → `GET /poker/v1/game_state/{game_id}`
  - [ ] `getLegalActions(gameAddress, caller)` - **[RPC QUERY]** Get legal actions for player → `GET /poker/v1/legal_actions/{game_id}`
  - [ ] `newHand(gameAddress, nonce?)` - **[REST TX]** Deal new hand → `POST /poker/v1/new_hand` (if message exists)
  - [ ] `deal(gameAddress, seed, publicKey, nonce?)` - **[REST TX]** Deal cards → `POST /poker/v1/deal_cards`

  *Player Actions* (4 methods - all REST TX):
  - [ ] `playerJoin(gameAddress, amount, seat, nonce?)` - **[REST TX]** Join game → `POST /poker/v1/join_game`
  - [ ] `playerJoinAtNextSeat(gameAddress, amount, nonce?)` - **[REST TX]** Join at next seat → `POST /poker/v1/join_game` (seat=auto)
  - [ ] `playerJoinRandomSeat(gameAddress, amount, nonce?)` - **[REST TX]** Join random seat → `POST /poker/v1/join_game` (seat=random)
  - [ ] `playerAction(gameAddress, action, amount, nonce?, data?)` - **[REST TX]** Perform action → `POST /poker/v1/perform_action`
  - [ ] `playerLeave(gameAddress, value, nonce?)` - **[REST TX]** Leave game → `POST /poker/v1/leave_game`

  *Blockchain Operations* (4 methods - all RPC QUERY):
  - [ ] `getBlockByHash(hash)` - **[RPC QUERY]** Get block by hash → Tendermint RPC `/block_by_hash`
  - [ ] `getMempool()` - **[RPC QUERY]** Get pending transactions → Tendermint RPC `/unconfirmed_txs`
  - [ ] `getNodes()` - **[RPC QUERY]** Get validator nodes → `GET /cosmos/base/tendermint/v1beta1/node_info`
  - [ ] `getTransactions()` - **[RPC QUERY]** Get recent transactions → `GET /cosmos/tx/v1beta1/txs`

  *Bridge & Network* (4 methods):
  - [ ] `bridge()` - **[N/A - DEPRECATED]** L1→L2 bridge (handled by external bridge service, not SDK)
  - [ ] `mint(address, amount, transactionId)` - **[REST TX]** Mint tokens → `POST /poker/v1/mint` (authorized only)
  - [ ] `withdraw(amount, from, receiver?, nonce?)` - **[REST TX]** Withdraw to L1 → `POST /poker/v1/burn`
  - [ ] `sendBlock(blockHash, block)` - **[N/A - P2P]** P2P block propagation (not needed for client SDK)
  - [ ] `sendBlockHash(blockHash, nodeUrl)` - **[N/A - P2P]** P2P block hash (not needed for client SDK)

  **Legend**:
  - **[RPC QUERY]** = Read-only query via Tendermint RPC or Cosmos REST API (GET requests)
  - **[REST TX]** = Transaction submission via Cosmos REST API (POST requests)
  - **[N/A]** = Not applicable for client SDK (handled elsewhere or deprecated)

  **Implementation Steps**:
  1. [ ] Run `ignite generate ts-client` to generate TypeScript types from Cosmos protobufs
  2. [ ] Create `CosmosPokerClient` class extending `CosmosClient` that implements full IClient
  3. [ ] Implement poker game query methods using generated protobuf types:
     - `findGames()` → Query poker module for active games
     - `getGameState()` → Query poker.v1.GameState
     - `getLegalActions()` → Query poker.v1.LegalActions
  4. [ ] Implement poker game transaction methods using Cosmos SDK messages:
     - `newTable()` → Send MsgCreateGame
     - `playerJoin()` → Send MsgJoinGame
     - `playerAction()` → Send MsgPerformAction
     - `playerLeave()` → Send MsgLeaveGame
     - `deal()` → Send MsgDealCards
     - `newHand()` → Send MsgNewHand (if exists)
  5. [ ] Implement bridge methods:
     - `mint()` → Send MsgMint (authorized only)
     - `withdraw()` → Send MsgBurn + emit withdrawal event
  6. [ ] Update UI to use CosmosPokerClient instead of NodeRpcClient
  7. [ ] Test all methods end-to-end with local Cosmos chain

  **Files to Update**:
  - `/poker-vm/sdk/src/cosmosClient.ts` - Extend with IClient methods
  - `/poker-vm/sdk/src/client.ts` - Ensure IClient interface is complete
  - `/poker-vm/sdk/src/index.ts` - Export CosmosPokerClient
  - `/poker-vm/ui/src/utils/cosmosUtils.ts` - Use CosmosPokerClient

  **Related HIGH PRIORITY Tasks**:
  - This is the MAIN blocker for migrating UI from NodeRpcClient (Ethereum PVM) to Cosmos chain
  - Once complete, poker UI will query/transact with Cosmos chain instead of centralized PVM
  - Enables full decentralization of poker game logic on-chain

---

## 🔌 Real-Time Game State Subscription Architecture

### Current PVM Architecture (Centralized WebSocket)

**How it works now** (`/poker-vm/ui/src/context/GameStateContext.tsx`):
- Direct WebSocket connection to PVM backend: `wss://node1.block52.xyz`
- Auto-subscribes with URL params: `?tableAddress=${tableId}&playerId=${playerAddress}`
- PVM broadcasts game state updates to all subscribed clients when:
  - Player performs action (bet, call, fold, etc.)
  - New hand is dealt
  - Round transitions (preflop → flop → turn → river)
- React Context manages WebSocket lifecycle and distributes state to UI components
- **Pattern**: `WebSocket → GameStateContext → React Components (auto re-render)`

**Benefits**:
- ✅ Real-time updates (instant UI refresh for all players)
- ✅ Simple subscription model (one WebSocket per table)
- ✅ Centralized state management in React Context
- ✅ No polling needed (server pushes updates)

**Problem with Cosmos Migration**:
- ❌ Cosmos blockchain doesn't have a built-in WebSocket server like PVM
- ❌ Need new architecture for real-time game state distribution

---

### OPTION 1: Tendermint WebSocket Event Subscription (Native Cosmos)

**How it works**:
- Tendermint Core provides WebSocket at `ws://localhost:26657/websocket`
- Subscribe to custom events emitted by poker module
- Poker keeper emits typed events on every game action
- CosmJS or direct WebSocket connection receives events
- UI updates game state based on events

**Implementation Steps**:
1. **Emit custom events in poker module**:
   ```go
   // In x/poker/keeper/msg_server_perform_action.go
   ctx.EventManager().EmitTypedEvent(&types.EventGameStateUpdate{
       GameId: msg.GameId,
       PlayerAddress: msg.Creator,
       Action: msg.Action,
       Round: gameState.Round,
   })
   ```

2. **Subscribe via Tendermint WebSocket** (from browser):
   ```typescript
   const ws = new WebSocket('ws://localhost:26657/websocket');
   ws.send(JSON.stringify({
     jsonrpc: "2.0",
     method: "subscribe",
     id: 1,
     params: {
       query: "tm.event='Tx' AND poker.game_id='game123'"
     }
   }));
   ```

3. **Or use CosmJS** (recommended):
   ```typescript
   import { Tendermint37Client } from "@cosmjs/tendermint-rpc";

   const tmClient = await Tendermint37Client.connect("ws://localhost:26657");
   const stream = tmClient.subscribeTx({ "poker.game_id": "game123" });

   for await (const event of stream) {
     // Update UI with event data
     const gameState = await queryGameState(event.tx.events);
   }
   ```

**Pros**:
- ✅ Native Cosmos SDK feature (no external dependencies)
- ✅ Decentralized (works with any Cosmos node)
- ✅ Standard pattern used by block explorers and wallets
- ✅ Event-driven architecture (scalable)
- ✅ Works with multiple validators (no single point of failure)

**Cons**:
- ❌ Learning curve for Tendermint event system
- ❌ Need to query full game state after receiving event (event only contains metadata)
- ❌ **DEPRECATION WARNING**: Legacy WebSocket API deprecated in Tendermint v0.36, removed in v0.37
- ❌ Must migrate to new `/events` long-polling API (not WebSocket)
- ❌ Requires custom event types for each game action
- ❌ Browser CORS issues with direct Tendermint WebSocket connections

**Recommendation**: ⚠️ **NOT RECOMMENDED** due to deprecation and complexity

---

### OPTION 2: Custom WebSocket Server + Cosmos Subscriber (Hybrid)

**How it works** (Lucas/Cullen's approach):
- Keep existing PVM WebSocket server architecture
- PVM server subscribes to Cosmos blockchain events via Tendermint RPC
- When player performs action on Cosmos (via UI → SDK → MsgPerformAction):
  - Transaction is broadcast to Cosmos chain
  - Cosmos processes transaction and emits event
  - PVM WebSocket server detects event (via Tendermint subscription)
  - PVM queries full game state from Cosmos chain
  - PVM broadcasts game state to all subscribed WebSocket clients
- UI continues using existing GameStateContext.tsx (no changes needed!)

**Architecture Diagram**:
```
Browser UI → CosmosPokerClient → Cosmos Chain (MsgPerformAction)
                                        ↓
                                  (emits event)
                                        ↓
PVM WebSocket Server ← (subscribes) ← Tendermint RPC
        ↓
  (queries full state)
        ↓
    Cosmos Chain
        ↓
  (broadcasts state)
        ↓
Browser UI (GameStateContext receives update via WebSocket)
```

**Implementation Steps**:
1. **Keep PVM WebSocket server** (`/poker-vm/pvm/ts/src/core/server.ts`)
2. **Add Cosmos subscriber to PVM**:
   ```typescript
   // In PVM server startup
   import { Tendermint37Client } from "@cosmjs/tendermint-rpc";

   const tmClient = await Tendermint37Client.connect(COSMOS_RPC);
   const stream = tmClient.subscribeTx({ "poker.game_id": "*" });

   for await (const event of stream) {
     const gameId = event.events.find(e => e.type === "poker.game_id")?.value;
     const gameState = await cosmosClient.getGameState(gameId);

     // Broadcast to all WebSocket clients subscribed to this table
     broadcastToTable(gameId, gameState);
   }
   ```
3. **Update UI SDK to use CosmosPokerClient** (from Option 1 checklist above)
4. **UI keeps existing GameStateContext.tsx** (zero changes to subscription logic!)

**Pros**:
- ✅ **Zero UI changes** (GameStateContext.tsx works as-is)
- ✅ Proven WebSocket architecture (already battle-tested)
- ✅ Familiar pattern for team (Lucas already suggested this)
- ✅ Full game state broadcast (not just events)
- ✅ Can add caching/optimization in PVM layer
- ✅ Separates concerns: Cosmos = source of truth, PVM = real-time distribution
- ✅ Easy to debug (PVM logs show all activity)

**Cons**:
- ⚠️ PVM server becomes semi-centralized relay (but Cosmos is still source of truth)
- ⚠️ Adds latency: Cosmos → PVM → Browser (vs direct Cosmos → Browser)
- ⚠️ PVM server must stay online for real-time updates (but chain works without it)
- ⚠️ Extra infrastructure to maintain (PVM server + Cosmos node)

**Recommendation**: ✅ **RECOMMENDED** (Lucas's suggestion, minimal risk, proven pattern)

---

### OPTION 3: Polling (Simple but Less Efficient)

**How it works**:
- UI polls Cosmos REST API every N seconds for game state updates
- No WebSocket connection needed
- Simple HTTP requests: `GET /poker/v1/game_state/{game_id}`

**Implementation**:
```typescript
// In GameStateContext.tsx
useEffect(() => {
  const interval = setInterval(async () => {
    const state = await cosmosClient.getGameState(tableId, playerAddress);
    setGameState(state);
  }, 2000); // Poll every 2 seconds

  return () => clearInterval(interval);
}, [tableId]);
```

**Pros**:
- ✅ Extremely simple to implement
- ✅ No WebSocket complexity
- ✅ Works with any Cosmos REST endpoint
- ✅ No PVM server needed (fully decentralized)

**Cons**:
- ❌ Delayed updates (2-5 second lag)
- ❌ Wasteful (polls even when no changes)
- ❌ Poor UX for poker (feels sluggish)
- ❌ Increased Cosmos node load (constant queries)
- ❌ Not suitable for real-time multiplayer games

**Recommendation**: ❌ **NOT RECOMMENDED** for poker (acceptable for slow-paced games only)

---

### OPTION 4: Server-Sent Events (SSE) via Custom Endpoint

**How it works**:
- Create custom SSE endpoint in PVM or standalone service
- Browser opens persistent HTTP connection
- Server pushes updates via SSE protocol (one-way, server → client)
- Lighter than WebSocket (no bidirectional overhead)

**Pros**:
- ✅ Built-in browser support (EventSource API)
- ✅ Simpler than WebSocket (no handshake needed)
- ✅ Auto-reconnect on connection loss
- ✅ HTTP/2 compatible

**Cons**:
- ❌ One-way only (server → client, not bidirectional)
- ❌ Still requires PVM-like relay server
- ❌ Less common pattern than WebSocket
- ❌ Browser connection limits (6 per domain)

**Recommendation**: ⚠️ **POSSIBLE** but WebSocket is more standard for this use case

---

### FINAL RECOMMENDATION: Option 2 (Hybrid PVM + Cosmos)

**Why this is the best approach**:

1. **Minimal Risk**: Keep existing UI code working (GameStateContext.tsx unchanged)
2. **Team Alignment**: Lucas already suggested this pattern ("I think that will still work")
3. **Proven Architecture**: PVM WebSocket server is battle-tested and working
4. **Clear Separation**:
   - **Cosmos = Source of Truth** (all transactions, game logic, state storage)
   - **PVM = Real-Time Relay** (WebSocket distribution, caching, optimization)
5. **Migration Path**: Can gradually move to native Cosmos subscriptions later if needed
6. **Debugging**: Easier to debug with PVM logs showing all activity

**Implementation Plan**:

**Phase 1** (Immediate - keep UI working):
- [x] Bridge working ✅
- [ ] Implement CosmosPokerClient with full IClient interface
- [ ] PVM WebSocket server subscribes to Cosmos events
- [ ] PVM queries Cosmos for game state on events
- [ ] PVM broadcasts to WebSocket clients (existing pattern)
- [ ] UI uses CosmosPokerClient for actions, GameStateContext for subscriptions

**Phase 2** (Future optimization):
- [ ] Add PVM caching layer for frequently queried states
- [ ] Implement connection pooling for Cosmos RPC
- [ ] Add metrics/monitoring for PVM relay performance
- [ ] Consider moving to native Tendermint subscriptions if PVM becomes bottleneck

**Phase 3** (Long-term decentralization):
- [ ] Evaluate new Tendermint `/events` API (replaces deprecated WebSocket)
- [ ] Consider peer-to-peer WebRTC for player-to-player updates
- [ ] Explore Cosmos SDK v0.50+ streaming improvements

**Next Steps**:
1. ✅ Confirm with Lucas/Cullen this matches their vision ✅ (Decision: Use Option 2)
2. [ ] **TODO: Implement Option 2 (Hybrid PVM + Cosmos) AFTER testing game creation works**
   - First test: Create game on Cosmos chain via MsgCreateGame
   - Then: Add PVM server subscription to Cosmos Tendermint RPC
   - Then: Test end-to-end: UI action → Cosmos tx → Event → PVM → WebSocket → UI update
3. [ ] Document architecture in `/pokerchain/docs/ARCHITECTURE.md`
- [ ] Persist bridge `lastProcessedBlock` to chain state (see `BRIDGE_PERSISTENCE_ISSUE.md`)
- [ ] Add b52USDC denom metadata for better UI display
- [ ] Implement proper error handling for bridge failures
- [ ] Add balance refresh button to UI

### Low Priority
- [ ] Add chain statistics dashboard
- [ ] Implement validator staking UI
- [ ] Add transaction explorer
- [ ] Create mobile-responsive design

---

## 🔧 Development Commands

### Start All Services

**Terminal 1 - Pokerchain:**
```bash
cd pokerchain
ignite chain serve -v
```

**Terminal 2 - UI:**
```bash
cd poker-vm/ui
yarn dev
```

### Query Commands

```bash
# Check balances
pokerchaind query bank balances b521xa0ue7p4z4vlfphkvxwz0w8sj5gam8zxszqy9l

# Via REST API
curl http://localhost:1317/cosmos/bank/v1beta1/balances/b521xa0ue7p4z4vlfphkvxwz0w8sj5gam8zxszqy9l

# Check chain status
pokerchaind status
```

### Bridge Test Commands

```bash
cd poker-vm/contracts

# Check bridge balance
yarn test:bridge:balance

# Test USDC deposit
yarn test:bridge:usdc

# Test withdrawal
yarn test:bridge:withdraw
```

---

## 📚 Key Files Modified

### Pokerchain Repository
- `app/app.go` - Bridge service initialization and keeper wiring ✅ COMMITTED
- `x/poker/keeper/bridge_service.go` - Queue-based deposit detection ✅ COMMITTED
- `x/poker/keeper/keeper.go` - Bridge service reference ✅ COMMITTED
- `x/poker/module/module.go` - EndBlocker deposit processing ✅ COMMITTED
- `cmd/pokerchaind/cmd/config.go` - BridgeConfig and app.toml template ✅ COMMITTED
- `config/app.toml` - Bridge configuration (runtime)
- `docs/tom/GETTING_STARTED.md` - Setup guide
- `docs/tom/BRIDGE_PERSISTENCE_ISSUE.md` - Future enhancement
- `docs/tom/WORKING_CHECKLIST.md` - This file (updated Oct 7, 2025)

### UI Repository
- `ui/.env` - Cosmos endpoints configuration
- `ui/src/utils/cosmosUtils.ts` - Added `getTestAddresses()`
- `ui/src/components/CosmosWalletPage.tsx` - Wallet generator (NEW)
- `ui/package.json` - Fixed `@bitcoinbrisbane/block52` version

---

## 🎉 Success Criteria

### Phase 1: Infrastructure (COMPLETED ✅)
- [x] Pokerchain running and producing blocks
- [x] Bridge service actively monitoring Base Chain
- [x] UI connecting to Cosmos endpoints
- [x] Test accounts accessible

### Phase 2: Wallet & UI (IN PROGRESS 🚧)
- [x] Wallet generator page created
- [ ] User can generate/import Cosmos wallet
- [ ] Balances display in UI
- [ ] Test deposit on bridge contract

### Phase 3: Full Integration (UPCOMING 📋)
- [ ] User deposits USDC on Base Chain
- [ ] Bridge mints b52USDC on Cosmos
- [ ] User plays poker with b52USDC
- [ ] User withdraws to Base Chain

---

## 🐛 Troubleshooting

### Chain Won't Start
```bash
# Reset chain state
ignite chain serve --reset-once -v

# If you get "port 4500 already in use" error:
# Kill any old ignite processes
pkill -f "ignite chain serve"

# Or force kill by PID
lsof -i :4500  # Find the PID
kill -9 <PID>  # Replace <PID> with actual process ID
```

### Bridge Not Detecting Deposits
1. Check RPC URL: `curl https://mainnet.base.org`
2. Verify config in `~/.pokerchain/config/app.toml`
3. Check starting_block is correct (36469223)

### UI Can't Connect
1. Verify chain is running: `curl http://localhost:1317/cosmos/base/tendermint/v1beta1/blocks/latest`
2. Check CORS settings in chain config
3. Verify `.env` file has correct URLs

---

**Next Action**: Add CosmosWalletPage to router and test wallet generation at `http://localhost:5173/wallet` 🚀

---

## 📚 Additional Documentation

- **Local AI Coding Research**: See `docs/tom/LOCAL_AI_CODING_RESEARCH.md` for comprehensive guide on running Claude-level AI locally (Qwen2.5-Coder, DeepSeek, Ollama setup)
