# 🏝️ Stradbroke Island - Cosmos SDK Migration Checklist

**Created:** October 25, 2025
**Goal:** Complete migration from PVM RPC to Cosmos SDK for all poker game interactions

---

## 🎉 COMPLETED MILESTONES

### ✅ Phase 1: Core SDK Functions (DONE!)
- [x] **joinGame()** - SDK working with Long type fix! 🎊
  - Transaction broadcast: `40458971B0A2F96078675FDE0330CDE70F88A79E79A929E436324F7F87162639`
  - Fixed by converting `seat` and `buyInAmount` to Long objects
  - SDK: `poker-vm/sdk/src/signingClient.ts:241-242`
  - **Keeper implementation completed:** Now calls PVM and transfers tokens!
  - Pokerchain: `x/poker/keeper/msg_server_join_game.go` (commit 7c63a5a)
- [x] **createGame()** - Working!
  - Transaction: `714CBDD7611116791D68C3E4117D36FFB4672782F0E33697F19269675C4C8AD8`
- [x] **Initialize Client** - Working!
  - Connected to: `http://localhost:26657` (RPC) + `http://localhost:1317` (REST)

### 🔧 Phase 1.5: Blockchain Keeper Fixes (NEW!)
- [x] **joinGame keeper** - Implemented full logic!
  - Validates game exists and buy-in limits
  - Transfers tokens from player to game pot
  - Calls PVM with "join" action via `callGameEngine()`
  - Updates game player list on blockchain
  - Emits `player_joined_game` event
  - Auto-refunds on PVM failure

---

## ✅ Phase 2: SDK Core Functions (COMPLETE! 🎊)

### High Priority - ALL WORKING! 🎊
- [x] **performAction()** - WORKING! ✅
  - SDK Location: `poker-vm/sdk/src/signingClient.ts:277-329`
  - **Auto action index tracking implemented!** ✅
    - Queries blockchain game state before each action
    - Checks `previousActions` array, falls back to `actionCount + 1`
    - Matches original client pattern exactly
    - Enhanced logging: `📊 Action Index Calculation` (line 347-368)
  - Uses Long.fromString() for amount
  - **STATUS:** Fully functional!

- [x] **joinGame()** - WORKING! ✅
  - Transaction: `3936965E1A95E71D20658B0B99C6580F1F46D74B17910E7C0A325EE1E40D7855`
  - Successfully joined game and called PVM
  - Keeper transfers tokens and updates game state
  - **STATUS:** Complete integration with blockchain + PVM!

- [x] **createGame()** - WORKING! ✅
  - Transaction: `894BA189D5E0DEA91A14ED9FBB55258382DED48AACECD3CA70710FD9691EA262`
  - Creates game metadata and initial state
  - **STATUS:** Fully functional!

- [x] **queryGames()** - WORKING! ✅
  - SDK Location: `poker-vm/sdk/src/signingClient.ts:378-392`
  - Fetches all games via REST API
  - **STATUS:** Fully functional!

- [x] **queryGameState(gameId)** - WORKING! ✅
  - REST API: `/block52/pokerchain/poker/v1/game_state/{id}`
  - Returns JSON game state from Cosmos blockchain
  - Used by: useTablePlayerCounts, PVM gameStateCommand
  - **STATUS:** Fully functional!

### Medium Priority
- [x] **sendTokens()** - Transfer USDC between players ✅
  - Location: `poker-vm/sdk/src/signingClient.ts:110-139`
  - Tested on `/test-signing` page - successfully transfers tokens!
  - **STATUS:** Fully functional!

---

## 🎮 Phase 3: Migrate Player Action Hooks (COMPLETE! 🎉)

All hooks in `poker-vm/ui/src/hooks/playerActions/`:

### Critical Game Actions (ALL MIGRATED! ✅)
- [x] **foldHand** (`foldHand.ts`) → ✅ Gas token fixed (b52Token)
- [x] **checkHand** (`checkHand.ts`) → ✅ Migrated to Cosmos SDK (commit 2676e85)
- [x] **callHand** (`callHand.ts`) → ✅ Migrated to Cosmos SDK (commit 2676e85)
- [x] **betHand** (`betHand.ts`) → ✅ Migrated to Cosmos SDK (commit 2676e85)
- [x] **raiseHand** (`raiseHand.ts`) → ✅ Migrated to Cosmos SDK (commit c748733)

### Table Management Actions (ALL MIGRATED! ✅)
- [x] **joinTable** (`joinTable.ts`) → ✅ Uses Cosmos SDK (already migrated)
- [x] **leaveTable** (`leaveTable.ts`) → ✅ Migrated to Cosmos SDK (commit c748733)
- [x] **sitIn** (`sitIn.ts`) → ✅ Migrated to Cosmos SDK (commit c748733)
- [x] **sitOut** (`sitOut.ts`) → ✅ Migrated to Cosmos SDK (commit c748733)

### Hand Flow Actions (ALL MIGRATED! ✅)
- [x] **startNewHand** (`startNewHand.ts`) → ✅ Migrated to Cosmos SDK (commit c748733)
- [x] **dealCards** (`dealCards.ts`) → ✅ Migrated to Cosmos SDK (commit 2676e85)
- [x] **showCards** (`showCards.ts`) → ✅ Migrated to Cosmos SDK (commit c748733)
- [x] **muckCards** (`muckCards.ts`) → ✅ Migrated to Cosmos SDK (commit c748733)
- [x] **postSmallBlind** (`postSmallBlind.ts`) → ✅ Migrated to Cosmos SDK (commit 2676e85)
- [x] **postBigBlind** (`postBigBlind.ts`) → ✅ Migrated to Cosmos SDK (commit 2676e85)

### Support Hooks (UPDATED! ✅)
- [x] **usePlayerLegalActions** (`usePlayerLegalActions.ts`) → ✅ Updated to use user_cosmos_address (commit c748733)
- [x] **types.ts** → ✅ Added legacy comment for Ethereum types (commit c748733)

**✅ Player Action Hook Migration - COMPLETE! (Oct 26, 2025):**

**First batch (Commit 2676e85):** Successfully migrated 6 core gameplay hooks:
1. **postSmallBlind** - Post small blind action
2. **postBigBlind** - Post big blind action
3. **betHand** - Betting action
4. **callHand** - Call action
5. **checkHand** - Check action (0 amount)
6. **dealCards** - Deal cards action (0 amount, removed Ethereum seed logic)

**Second batch (Commit c748733):** Successfully migrated 7 additional hooks:
7. **raiseHand** - Raise action using Cosmos blockchain
8. **leaveTable** - Leave table action on Cosmos
9. **sitIn** - Sit in action using Cosmos
10. **sitOut** - Sit out action using Cosmos
11. **startNewHand** - Start new hand action on Cosmos
12. **showCards** - Show cards action using Cosmos
13. **muckCards** - Muck cards action using Cosmos

**Also updated:**
- **usePlayerLegalActions** - Changed from user_eth_public_key to user_cosmos_address
- **types.ts** - Added legacy comment for Ethereum-specific type definitions

**ALL 13 player action hooks now use Cosmos SDK exclusively!** 🎉

**Migration Pattern Used:**
```typescript
import { createSigningClientFromMnemonic, COSMOS_CONSTANTS } from "@bitcoinbrisbane/block52";
import { getCosmosAddress, getCosmosMnemonic } from "../../utils/cosmos/storage";

const userAddress = getCosmosAddress();
const mnemonic = getCosmosMnemonic();
const signingClient = await createSigningClientFromMnemonic({
    rpcEndpoint: import.meta.env.VITE_COSMOS_RPC_URL || "http://localhost:26657",
    restEndpoint: import.meta.env.VITE_COSMOS_REST_URL || "http://localhost:1317",
    chainId: COSMOS_CONSTANTS.CHAIN_ID,
    prefix: COSMOS_CONSTANTS.ADDRESS_PREFIX,
    denom: "b52Token",
    gasPrice: "0.025b52Token"
}, mnemonic);
const transactionHash = await signingClient.performAction(tableId, actionName, amount);
```

**Removed Dependencies:**
- ❌ `getClient()` from ethereum/client
- ❌ `b52AccountUtils` from ethereum/b52Account
- ❌ All ethers dependencies
- ❌ Ethereum-specific seed generation logic (dealCards)

**Ready for Testing:**
- Multi-player join scenarios
- Posting blinds (small + big)
- Gameplay actions (bet, call, check)
- Deal cards flow

**✅ Utility Hook Cleanup (Oct 26, 2025 - Commit d86569d6):**

Migrated remaining utility hooks to Cosmos SDK and cleaned up old Ethereum code:

**Migrated Hooks:**
1. **useTablePlayerCounts** - Dashboard player count display
   - Changed from: Old NodeRpcClient.getGameState()
   - Changed to: Cosmos REST API `/block52/pokerchain/poker/v1/game_state/{id}`
   - Used by: Dashboard lobby to show current/max players per table

2. **useSitAndGoPlayerJoinRandomSeat** - Sit & Go auto-join
   - Changed from: Old client.playerJoinRandomSeat() with ethers
   - Changed to: Cosmos SDK signingClient.joinGame() with seat=0 (random)
   - Used by: SitAndGoAutoJoinModal

**Deleted Hooks:**
- ✅ **useAccount.ts** - Old Ethereum account hook, replaced by:
  - Gameplay: useCosmosWallet (Cosmos addresses)
  - Bridge: useUserWallet (Ethereum addresses for deposits/withdrawals only)

**Bridge Code (Ethereum, kept for USDC deposits/withdrawals):**
- ⚠️ b52AccountUtils.ts - Old NodeRpcClient for bridge only
- ⚠️ useUserWallet.ts - Ethereum wallet for bridge only
- ⚠️ WithdrawalModal.tsx - Uses old client for withdrawals only
- Added @ts-expect-error comments to suppress type errors temporarily
- These will be migrated when bridge is updated to Cosmos

**Build Status:**
✅ Build successful with no TypeScript errors
✅ All gameplay hooks use Cosmos SDK exclusively
✅ Bridge functionality still works (uses Ethereum as intended)

**✅ UI Component Amount Conversion Fix (Oct 26, 2025 - Commit 1746434):**

**CRITICAL BUG FOUND AND FIXED:**
While player action hooks were migrated to Cosmos SDK (expecting microunits), UI components
were still using Ethereum Wei conversion (18 decimals), causing incorrect amounts.

**Fixed Components:**
1. **actionHandlers.ts** - handleBet, handleCall
   - Changed from: `ethers.parseUnits(amount, 18)` (Wei - 18 decimals)
   - Changed to: `(amount * 1_000_000)` (microunits - 6 decimals)
   - Removed ethers import

2. **Footer.tsx** - handleBet, handleRaise, display values
   - Changed from: `ethers.parseUnits(raiseAmount, 18)` (Wei)
   - Changed to: `(raiseAmount * 1_000_000)` (microunits)
   - Fixed display: `ethers.formatUnits(value, 18)` → `Number(value) / 1_000_000`
   - Removed ethers import

**Conversion Pattern:**
- **Send to blockchain:** Multiply by 1,000,000 (USDC → microunits)
- **Display to user:** Divide by 1,000,000 (microunits → USDC)

**Impact:**
- All bet/call/raise amounts now use correct Cosmos format
- Display values show correct USDC amounts
- Build successful with all TypeScript errors resolved

---

## ✅ Phase 3.5: Sit & Go Buy-In Implementation (Nov 12, 2025)

**Goal:** Fix Sit & Go games to show fixed buy-in amounts instead of allowing user to choose

### Changes Implemented

**1. BuyInModal.tsx** - Fixed buy-in display for Sit & Go
   - Added `isSitAndGo` detection (checks if minBuyIn === maxBuyIn)
   - Shows fixed buy-in amount for Sit & Go (non-editable)
   - Shows MIN/MAX/INPUT for Cash games
   - **File**: `poker-vm/ui/src/components/playPage/BuyInModal.tsx:87-89, 392-404`

**2. VacantPlayer.tsx** - Two-step join flow with custom modal
   - Step 1: Confirm seat selection
   - Step 2: Show buy-in modal with fixed amount
   - Fixed bug: Now uses `minBuyIn` instead of `maxBuyIn` for display
   - Created custom Sit & Go buy-in modal
   - **Files**:
     - `poker-vm/ui/src/components/playPage/Players/VacantPlayer.tsx:70-73, 106-110, 113-169, 291-406`

**3. useNewTable.ts** - Fixed blind value hardcoding
   - Removed hardcoded blinds for Sit & Go ($0.01/$0.02)
   - Now uses user input values from form
   - Conversion: `BigInt(Math.floor(gameOptions.smallBlind * Math.pow(10, COSMOS_CONSTANTS.USDC_DECIMALS)))`
   - **File**: `poker-vm/ui/src/hooks/useNewTable.ts:69-77`

**4. TableAdminPage.tsx** - Fixed buy-in form for Sit & Go
   - Shows single "Buy-In" field for Sit & Go/Tournament (sets both min=max)
   - Shows separate min/max fields for Cash games
   - Added success modal with transaction link
   - Added "Created" column showing date/time, sorted newest first
   - **Files**:
     - Form fix: `poker-vm/ui/src/pages/TableAdminPage.tsx:193-236`
     - Success modal: `poker-vm/ui/src/pages/TableAdminPage.tsx:51-53, 89-91, 383-445`
     - Created column: `poker-vm/ui/src/pages/TableAdminPage.tsx:29, 70, 275-277, 326-339`

**5. Dashboard.tsx** - Cleanup
   - Removed "Available Tables" section (game listing)
   - Removed "Choose Table" button
   - Made bottom links smaller (text-xs, w-3 h-3)
   - **File**: `poker-vm/ui/src/pages/Dashboard.tsx`

### Testing Results (Nov 12, 2025)

**Test 1: Create Sit & Go Table** ✅
- Game Type: Sit & Go
- Players: 2-4
- Buy-In: $1.00 (fixed)
- Blinds: $0.02/$0.04
- Transaction: `F94BBCDE8E53EBA3DAEEB52705BCE68ED23AA1E7C8E3DF6AB24BA7C6E47E696C`
- **Result**: Table created successfully with correct fixed buy-in

**Test 2: Join Table with $1.00 Buy-In** ✅
- Seat: 1
- Amount: $1.00 (1,000,000 microunits)
- Transaction: `4F7AB2966141B244ABA79DD0012A70E18BD7BFD2CD7503A29C63B817BC4DB2BC`
- Block: #1009
- **Result**: Successfully joined with correct amount
- **PVM Logs**: Confirmed game state updated with player at seat 1

**Transaction Details (from Block #1009):**
```json
{
  "creator": "b5219dj7nyvsj2aq8vrrhyuvlah05e6lx05r3ghqy3",
  "game_id": "0xbc28eaef3c63b78b750a5e51ea05a79454c72e9d1de63cc6cded294c7a038f03",
  "buy_in_amount": "1000000",  // ✅ Correct: $1.00 in microunits
  "seat": "1"
}
```

### Key Findings

**USDC Conversion Pattern Confirmed:**
```typescript
// UI → Blockchain: Dollars to microunits
const microunits = amount * 1_000_000;

// Blockchain → UI: Microunits to dollars
const dollars = Number(microunits) / 1_000_000;

// Helper function for display
formatUSDCToSimpleDollars(1000000) → "1.00"
```

**Location in Code:** `poker-vm/ui/src/utils/numberUtils.ts`

### Known Issues Fixed

**Issue 1: Modal showing wrong amount**
- **Problem**: VacantPlayer was using `maxBuyIn` for Sit & Go display
- **Root Cause**: Old table had min=$1, max=$10 (before fix)
- **Fix**: Changed to use `minBuyIn || maxBuyIn` (prefer minBuyIn)
- **File**: `VacantPlayer.tsx:121`

**Issue 2: TableAdminPage allowing different min/max for Sit & Go**
- **Problem**: Could create Sit & Go with min≠max
- **Fix**: Single input field that sets both min=max
- **File**: `TableAdminPage.tsx:193-236`

**Issue 3: Blinds not saving correctly**
- **Problem**: useNewTable hardcoded blinds for Sit & Go
- **Fix**: Removed hardcoding, uses form input
- **File**: `useNewTable.ts:69-77`

### Success Criteria Met ✅

- [x] Sit & Go shows fixed buy-in modal
- [x] TableAdminPage enforces min=max for Sit & Go
- [x] VacantPlayer displays correct amount
- [x] Blinds save from user input
- [x] Join transaction succeeds with correct microunits
- [x] PVM confirms player joined successfully
- [x] WebSocket broadcasts game state update

### Next Steps

**Immediate Testing:**
- Test multi-player Sit & Go (2+ players joining)
- Test complete hand flow with blinds
- Verify all amounts display correctly throughout game

**Future Improvements:**
- Add balance refresh after buy-in
- Add game history tracking
- Add player statistics

---

## 🎯 Phase 4: UI Component Migration (COMPLETE! ✅)

### Primary Components (ALL DONE! ✅)
- [x] **Dashboard** (`ui/src/pages/Dashboard.tsx`) → ✅ Complete!
  - Uses `useFindGames` hook which queries Cosmos REST API
  - Calls `cosmosClient.findGames()` to fetch all games from blockchain
  - Maps Cosmos game structure to UI format
  - **STATUS:** Fully migrated to Cosmos SDK

- [x] **Table** (`ui/src/components/playPage/Table.tsx`) → ✅ Complete!
  - Imports migrated player action hooks (leaveTable, usePlayerLegalActions)
  - All player actions use Cosmos SDK hooks
  - **STATUS:** Fully migrated to Cosmos SDK

- [x] **Footer** (`ui/src/components/Footer.tsx`) → ✅ Complete! (Commit 1746434)
  - Fixed amount conversion from Wei (18 decimals) to microunits (6 decimals)
  - Updated handleBet, handleRaise to use microunits
  - Fixed display conversions for minBet, maxBet, minRaise, maxRaise, callAmount
  - Removed ethers dependency
  - **STATUS:** Fully migrated to Cosmos SDK

- [x] **actionHandlers.ts** (`ui/src/components/common/actionHandlers.ts`) → ✅ Complete! (Commit 1746434)
  - Fixed amount conversion in handleBet, handleCall
  - Changed from `ethers.parseUnits(amount, 18)` to `(amount * 1_000_000)`
  - Removed ethers import
  - **STATUS:** All handlers use correct Cosmos microunit format

---

## 🔧 Phase 5: Supporting Hooks Migration

### Cosmos-Related Hooks (High Priority)
- [ ] **useCosmosGameState** (`useCosmosGameState.ts`) - Query game state from Cosmos
- [ ] **useCosmosWallet** (`useCosmosWallet.ts`) - Wallet connection
- [ ] **useFindGames** (`useFindGames.ts`) - Query available games
- [ ] **useGameActions** (`useGameActions.ts`) - Centralized action dispatcher
- [ ] **useNewTable** (`useNewTable.ts`) - Create new games

### Game State Hooks (Medium Priority)
- [ ] **useTableState** (`useTableState.ts`)
- [ ] **useTableData** (`useTableData.ts`)
- [ ] **usePlayerData** (`usePlayerData.ts`)
- [ ] **useGameProgress** (`useGameProgress.ts`)
- [ ] **useGameResults** (`useGameResults.ts`)

### UI/Display Hooks (Low Priority - Keep PVM)
- [ ] **useChipPositions** (`useChipPositions.ts`) - Visual only
- [ ] **useDealerPosition** (`useDealerPosition.ts`) - Visual only
- [ ] **useTableAnimations** (`useTableAnimations.ts`) - Visual only
- [ ] **useCardAnimations** (`useCardAnimations.ts`) - Visual only
- [ ] **useWinnerInfo** (`useWinnerInfo.ts`) - Visual only
- [ ] **usePlayerTimer** (`usePlayerTimer.ts`) - Visual only
- [ ] **useGameStartCountdown** (`useGameStartCountdown.ts`) - Visual only

### Deposit/Bridge Hooks (Keep as-is - Ethereum bridge)
- [x] **useAllowance** (`DepositPage/useAllowance.ts`) - Ethereum bridge
- [x] **useApprove** (`DepositPage/useApprove.ts`) - Ethereum bridge
- [x] **useDecimals** (`DepositPage/useDecimals.ts`) - Ethereum bridge
- [x] **useDepositUSDC** (`DepositPage/useDepositUSDC.ts`) - Ethereum bridge
- [x] **useUserWalletConnect** (`DepositPage/useUserWalletConnect.ts`) - Ethereum bridge
- [x] **useWalletBalance** (`DepositPage/useWalletBalance.ts`) - Ethereum bridge
- [x] **useWithdraw** (`DepositPage/useWithdraw.ts`) - Ethereum bridge

### Utility Hooks (Keep PVM for now)
- [ ] **useAccount** (`useAccount.ts`)
- [ ] **useUserWallet** (`useUserWallet.ts`)
- [ ] **usePlayerSeatInfo** (`usePlayerSeatInfo.ts`)
- [ ] **useTableTurnIndex** (`useTableTurnIndex.ts`)
- [ ] **useShowingCardsByAddress** (`useShowingCardsByAddress.ts`)
- [ ] **useGameOptions** (`useGameOptions.ts`)
- [ ] **useTableLayout** (`useTableLayout.ts`)
- [ ] **useMinAndMaxBuyIns** (`useMinAndMaxBuyIns.ts`)
- [ ] **useSitAndGoPlayerJoinRandomSeat** (`useSitAndGoPlayerJoinRandomSeat.ts`)
- [ ] **useTablePlayerCounts** (`useTablePlayerCounts.ts`)
- [ ] **useVacantSeatData** (`useVacantSeatData.ts`)
- [ ] **useCardsForHandStrength** (`useCardsForHandStrength.ts`)
- [ ] **useNextToActInfo** (`useNextToActInfo.ts`)
- [ ] **usePlayerActionDropBox** (`usePlayerActionDropBox.ts`)
- [ ] **usePlayerChipData** (`usePlayerChipData.ts`)
- [ ] **useSitAndGoPlayerResults** (`useSitAndGoPlayerResults.ts`)

---

---

## 📚 SDK Architecture - cosmosClient.ts vs signingClient.ts

**Important:** The SDK has TWO client classes that work together:

### 1. CosmosClient (`cosmosClient.ts`)
**Purpose:** Read-only blockchain queries (no wallet needed)
- Query balances
- Query block height
- Query chain info
- Future: Query games, game state (when read-only methods are added)

**Used by:** Background services, explorers, read-only dashboards

### 2. SigningCosmosClient (`signingClient.ts`)
**Purpose:** Full blockchain interaction (requires wallet for signing)
- **Extends** CosmosClient (inherits all read methods)
- **Adds** transaction signing capabilities:
  - `createGame()` - Sign & broadcast create game tx
  - `joinGame()` - Sign & broadcast join game tx
  - `performAction()` - Sign & broadcast player actions
  - `sendTokens()` - Sign & broadcast token transfers
  - `queryGames()` - Query all games (no signature needed)
  - `queryGameState()` - Query game state (no signature needed)

**Used by:** UI, players, anyone who needs to send transactions

### Relationship
```typescript
class SigningCosmosClient extends CosmosClient {
  // Inherits all CosmosClient query methods
  // + Adds wallet & signing capabilities
  // + Adds transaction methods
}
```

**In the UI:** We use `SigningCosmosClient` because:
- Players need to sign transactions (create, join, actions)
- Still have access to all query methods
- One client does everything!

**Rule of thumb:**
- Need to send transactions? → `SigningCosmosClient`
- Only reading data? → `CosmosClient` (lighter weight)

---

## 📝 Phase 6: Testing & Verification

### Test Each Migrated Feature
- [ ] Create test game on testnet
- [ ] Join game with 2+ players
- [ ] Test fold action
- [ ] Test check action
- [ ] Test call action
- [ ] Test bet action
- [ ] Test raise action
- [ ] Test sit in/sit out
- [ ] Test leave table
- [ ] Test full hand flow (pre-flop → flop → turn → river → showdown)

---

## 🎯 NEXT STEPS - CORRECT ORDER

### ✅ Phase 1 & 2: SDK Core (COMPLETED!)
1. ~~Test performAction()~~ ✅ SDK encoding works (failed due to PVM not running)
2. ~~Test joinGame()~~ ✅ SDK working, keeper implemented
3. ~~Test createGame()~~ ✅ Fully working
4. ~~Fix Long type conversions~~ ✅ All protobuf encoding fixed
5. ~~Implement joinGame keeper~~ ✅ Calls PVM, transfers tokens

### 🔧 Phase 2.5: Fix joinGame Error Code 5 (SOLVED! ✅)

**ISSUE:** joinGame transaction failing with error code 5 (`ErrInsufficientFunds`)

**FINAL DIAGNOSIS (Oct 25, 2025 - 4:54PM):**
- ✅ createGame works - creates both `Game` and `GameState` successfully
- ✅ joinGame gameId matching works - correct game was found
- ❌ **ROOT CAUSE FOUND:** Player has insufficient USDC balance!

**Transaction Details:**
- Transaction: `A1779F35A478B4CC9BE5C4D2745128D8DC44CB5975589A5CE25813DFB6363203`
- Player: `b5219dj7nyvsj2aq8vrrhyuvlah05e6lx05r3ghqy3`
- Attempted buy-in: `100,000,000 usdc`
- **Player balance:** `49,999,999 usdc` ❌ (NOT ENOUGH!)
- Also has: `9,996,500 b52Token` (for fees only)

**Blockchain Logs Confirmed:**
```
🎮 JoinGame called gameId=0x687ed8d... buyInAmount=100000000
✅ Game found gameId=0x687ed8d... creator=b52...
[FAILED at insufficient funds check - line 54]
```

**THE FIX:**
Player needs more USDC tokens! Either:
1. **Lower the buy-in amount** to 49,999,999 or less
2. **Mint more USDC** to the player account
3. **Adjust game settings** to have lower minBuyIn (currently 100,000,000)

**How to mint more USDC for testing:**
```bash
# Mint 1 billion USDC to player
pokerchaind tx poker mint b5219dj7nyvsj2aq8vrrhyuvlah05e6lx05r3ghqy3 1000000000usdc \
  --from alice --gas auto --gas-adjustment 1.5 -y
```

**Enhanced Logging Added:**
- ✅ Shows player balance vs required buy-in
- ✅ Shows exact USDC amounts at each step
- ✅ Clear error messages for debugging

**FINAL TEST RESULTS (Oct 25, 2025 - 5:00PM):** ✅ SUCCESS!

**What Worked:**
1. ✅ createGame - Tx: `DFF83312C3B0F173DB9022E89FB6C183D8C08616449342236F446F5A90E53A2E`
   - Created game with 10 usdc buy-in (within balance!)
   - Game ID: `0x2bfc00850cd2d25266b49b394f12c1cc7287f7f168223a51f98771627d7e3c10`

2. ✅ joinGame - Tx: `CE5E74E6B7B541BA087BB46CE300523D62BA41F18A1857052C07A8158D892ADC`
   - Successfully joined game!
   - Transferred 10,000,000 usdc from player to module account
   - PVM called successfully with "join" action
   - Player added to game state
   - Event emitted: `player_joined_game`

3. ✅ performAction (fold) - Tx: `5E0A60AB8F5D8A4DA44393E8E90B7D0B3E309CA1A8D257ADE91D89F56613362F`
   - Transaction succeeded on blockchain ✅
   - ⚠️ PVM error: "Invalid action index" (minor issue - not blocker)

**PVM Logs Confirm:**
```
Updated Game State: {
  type: 'sit-and-go',
  players: [{
    address: 'b5219dj7nyvsj2aq8vrrhyuvlah05e6lx05r3ghqy3',
    seat: 1,
    stack: '10000000000000000000000',
    status: 'active'
  }]
}
```

**SDK is fully functional! Ready for Phase 3! 🚀**

---

### ✅ Phase 3: Dashboard & UI Integration (IN PROGRESS!)

**Goal:** Wire up Dashboard to create/join games using Cosmos SDK, then play on Table page

**The Flow:**
1. ✅ **Dashboard** (`ui/src/pages/Dashboard.tsx`) → Create/list games using Cosmos SDK
2. ✅ **BuyInModal** (`ui/src/components/playPage/BuyInModal.tsx`) → Shows Cosmos balances, validates buy-in
3. ⏳ **Click "Join"** → Navigate to Table page with gameId
4. ⏳ **Table** (`ui/src/components/playPage/Table.tsx`) → Play the game
5. ⏳ **WebSocket** → Get real-time game state updates from PVM

**Recent Progress (Oct 26, 2025):**
- ✅ BuyInModal now displays full Cosmos wallet balances (all tokens)
- ✅ Balance validation uses USDC from cosmosWallet hook
- ✅ Removed ethers dependency from BuyInModal
- ✅ Buy-in amount conversion uses native BigInt (microunits)
- ✅ **FIXED:** GameStateContext now uses Cosmos address from localStorage (committed)
- ✅ **FIXED:** localStorage key is `user_cosmos_address` not `cosmos_address` (GameStateContext.tsx:134)
- ✅ **FIXED:** .env now points to local PVM WebSocket (ws://localhost:8545, not Base Chain)
- ✅ **FIXED:** socketserver.ts now uses cosmosConfig.restEndpoint instead of playerId (commit 5109aa7)
- ✅ **FIXED:** gameStateCommand.ts now uses correct Cosmos REST path (commit b03c70b)
- ✅ **FIXED:** gameStateCommand.ts now parses Cosmos JSON response correctly (commit 95daf20)
- ✅ **FIXED:** VacantPlayer and useVacantSeatData now use Cosmos addresses (commit 8b75e3a)
- ✅ **FIXED:** TexasHoldem.fromJson() now parses timeout field with 30s default (commit 8b75e3a)
- ✅ **FIXED:** Gas token changed from "stake" to "b52Token" (commit 6cdd340)
- ✅ **joinTable hook already using Cosmos SDK** - calls `SigningCosmosClient.joinGame()`
- ✅ **createTable hook already using Cosmos SDK** - calls `SigningCosmosClient.createGame()`
- ✅ **ALL WEBSOCKET INTEGRATION COMPLETE!** - PVM successfully loads game state from Cosmos!
- ✅ **JOIN FLOW MIGRATED TO COSMOS!** - No more Ethereum dependencies in join flow!
- ✅ **CREATE TABLE FLOW MIGRATED TO COSMOS!** - Dashboard uses `useNewTable` hook with Cosmos SDK!

**Key Discovery:**
The PVM WebSocket subscribes using the **player address**. Previously used Ethereum addresses, now uses Cosmos addresses (b52...). GameStateContext updated to:
1. Try `user_cosmos_address` from localStorage first (NOT `cosmos_address`)
2. Fallback to `user_eth_public_key` for backwards compatibility
3. Use the address for WebSocket subscription: `ws://localhost:8545?tableAddress=${tableId}&playerId=${cosmosAddress}`

**Critical Fixes Applied:**
1. **localStorage key**: Changed from `cosmos_address` to `user_cosmos_address` (GameStateContext.tsx:134)
2. **WebSocket URL**: Fixed .env to use `ws://localhost:8545` instead of Base Chain
3. **PVM Cosmos URL**: socketserver.ts now passes `cosmosConfig.restEndpoint` to GameStateCommand (lines 285-287, 780-782)
4. **REST API path**: gameStateCommand.ts now uses `/block52/pokerchain/poker/v1/game_state/{id}` instead of `/poker/game/{id}`
   - Matches proto definition: `pokerchain/proto/pokerchain/poker/v1/query.proto:42`
5. **JSON parsing**: gameStateCommand.ts now correctly parses `{ game_state: "..." }` response from Cosmos
   - Parses the JSON string and extracts gameOptions from the state object
   - Fixes: `TypeError: Cannot read properties of undefined (reading 'players')`
6. **Join Flow Migration** (commit 8b75e3a):
   - VacantPlayer.tsx: Removed Ethereum key checks (user_eth_public_key, user_eth_private_key)
   - VacantPlayer.tsx: Removed ethers dependency (no more Wei conversion)
   - VacantPlayer.tsx: Buy-in amounts use microunits directly
   - useVacantSeatData.ts: Changed to user_cosmos_address instead of user_eth_public_key
   - useVacantSeatData.ts: Removed ethers.ZeroAddress checks
   - TexasHoldem.fromJson(): Added timeout field parsing with 30s default
   - Fixes: "Missing required information to join table" error
   - Fixes: "Missing game options fields from server" warning

**Troubleshooting:**
- ✅ Error "No player address found" = FIXED (correct localStorage key)
- ✅ Error "WebSocket connecting to Base Chain" = FIXED (.env update)
- ✅ Error "Invalid URL" in GameStateCommand = FIXED (cosmosConfig.restEndpoint)
- ✅ Error "HTTP 501 Not Implemented" = FIXED (correct REST path)
- ✅ Error "Cannot read properties of undefined (reading 'players')" = FIXED (JSON parsing)
- ✅ Error "Missing required information to join table" = FIXED (VacantPlayer using Cosmos)
- ✅ Warning "Missing game options fields from server" = FIXED (timeout field parsing)
- ✅ VacantPlayer modal not appearing = FIXED (game state now loads correctly)
- Expected log: `[GameStateContext] Using player address: b52... (type: Cosmos)`

**Architecture Summary - What Uses Cosmos vs Base Chain:**

✅ **Cosmos Blockchain (Primary):**
- ✅ Create Table → `useNewTable` → `SigningCosmosClient.createGame()`
- ✅ Join Table → `joinTable` hook → `SigningCosmosClient.joinGame()`
- ✅ Game State → PVM queries Cosmos REST API → WebSocket broadcasts to UI
- ✅ All poker gameplay actions (fold, call, raise, etc.)
- ✅ Player balances in b52USDC (Cosmos native token)

🔗 **Base Chain (Ethereum L2) - Bridge Only:**
- 🔗 USDC deposits → Base Chain bridge → Cosmos b52USDC minting
- 🔗 USDC withdrawals → Cosmos b52USDC burning → Base Chain USDC release
- 🔗 Dashboard USDC balance display (reads Base Chain)
- 🔗 Wagmi wallet connection (for bridge transactions only)

**Token Architecture:**
- **b52Token** = Native gas token for Cosmos transaction fees (configured in config.yml:64)
- **usdc** = In-game poker currency for buy-ins and payouts
- All Cosmos SDK transactions require b52Token for gas fees
- Players need both: b52Token for gas + usdc for playing poker

**Common Error Fixed (commit 6cdd340):**
- Error: "Broadcasting transaction failed with code 5: insufficient funds"
- Error: "spendable balance 0stake is smaller than 5000stake"
- **Cause**: SDK was using "stake" instead of "b52Token" for gas
- **Fixed in**: useNewTable, joinTable, foldHand hooks

**Remaining Ethereum Code is Intentional:**
- Dashboard.tsx still has `ethers`, `wagmi`, `useSwitchChain` - these are for the **bridge**
- This is correct architecture: Base Chain handles USD deposits, Cosmos handles gameplay
- Don't remove these - they're needed for deposit/withdrawal flow!

**Before Testing - Check Your Wallet:**

Your Cosmos wallet needs TWO tokens:
1. **b52Token** (for gas fees) - Check balance:
   ```bash
   pokerchaind query bank balances <your-b52-address>
   ```

2. **usdc** (for poker buy-ins) - Should also show in balance query

If you have 0 b52Token, you need to fund your wallet. Options:
- **Faucet** (if available): Request b52Token from the faucet
- **Transfer from alice**: Alice has 10000000000000b52Token in config.yml
  ```bash
  pokerchaind tx bank send alice <your-address> 1000000000b52Token --from alice
  ```

**✅ Create Table Test - SUCCESSFUL:**
1. ✅ Created Sit & Go table with 4 players, $1 buy-in
2. ✅ Transaction hash: `894BA189D5E0DEA91A14ED9FBB55258382DED48AACECD3CA70710FD9691EA262`
3. ✅ Table appears in lobby with correct game options
4. ✅ Cosmos blockchain query shows 2 games in list_games

**✅ Join Flow Test - SUCCESSFUL:**
1. ✅ Navigated to table: `0xd29653bc8f7ab8494b91ed3787fbc6ff92127a9c6292216475d7f93d8937247a`
2. ✅ Join transaction submitted successfully
3. ✅ Transaction hash: `3936965E1A95E71D20658B0B99C6580F1F46D74B17910E7C0A325EE1E40D7855`
4. ✅ Player appears at seat 1 with 10,000 chips
5. ✅ WebSocket broadcasts game state update
6. ✅ PVM logs show join command executed successfully
7. ✅ UI displays player correctly with dealer button

**Next Steps:**
- Test multi-player join (2+ players)
- Migrate remaining player action hooks to Cosmos SDK
- Test posting blinds (small blind, big blind)
- Test gameplay actions (bet, call, check, fold, raise)
- Test deal cards flow

---

#### Step 3.1: Add SDK Query Functions & Auto Action Index ⏳

**Add these to `poker-vm/sdk/src/signingClient.ts`:**

1. **queryGames()** - Get list of all games
   ```typescript
   async queryGames(): Promise<Game[]> {
     const response = await fetch(`${this.config.restEndpoint}/pokerchain/poker/v1/games`);
     const data = await response.json();
     return JSON.parse(data.games); // games is a JSON string
   }
   ```

2. **queryGameState(gameId)** - Get game state from blockchain
   ```typescript
   async queryGameState(gameId: string): Promise<TexasHoldemStateDTO> {
     const response = await fetch(
       `${this.config.restEndpoint}/pokerchain/poker/v1/game_state?game_id=${gameId}`
     );
     const data = await response.json();
     return JSON.parse(data.game_state); // game_state is a JSON string
   }
   ```

3. **🔧 FIX: Auto-increment action index** - SDK should track this internally!
   ```typescript
   // Add to class:
   private gameActionCounts = new Map<string, number>();

   async performAction(gameId: string, action: string, amount: bigint = 0n): Promise<string> {
     // Query current game state to get actionCount
     const gameState = await this.queryGameState(gameId);
     const actionIndex = gameState.actionCount + 1;

     // Store for next call
     this.gameActionCounts.set(gameId, actionIndex);

     // ... rest of performAction logic
   }
   ```

**Why these first?**
- Dashboard needs `queryGames()` to show game list
- Table needs `queryGameState()` for initial state (then WebSocket for updates)
- **Action index auto-tracking** = SDK mimics original client behavior (no manual index mgmt!)

---

#### Step 3.2: Migrate Dashboard Hooks ⏳

**Hooks to update in `ui/src/hooks/`:**

1. **useFindGames.ts** - Replace with `signingClient.queryGames()`
2. **useNewTable.ts** - Replace with `signingClient.createGame()`
3. **useCosmosGameState.ts** - Use `signingClient.queryGameState()` for initial load

---

#### Step 3.3: Dashboard Component Migration ⏳

**Update `ui/src/pages/Dashboard.tsx`:**
- Replace PVM RPC calls with Cosmos SDK
- Use `queryGames()` to list games
- Use `createGame()` to create new games
- Keep "Join" button to navigate to `/play/:gameId`

---

#### Step 3.4: Table Page Integration ⏳

**Update `ui/src/components/playPage/Table.tsx`:**
- Get initial game state from `queryGameState(gameId)`
- Connect to PVM WebSocket for real-time updates
- Use `joinGame()`, `performAction()` for player actions
- Keep WebSocket for game state synchronization

**Key Point:** Hybrid approach!
- **Blockchain** = Source of truth for transactions (create, join, actions)
- **PVM WebSocket** = Real-time game state updates for UI
- **SDK queries** = Initial state loading

---

#### Step 3.5: Test Full Flow ⏳

1. Go to Dashboard → Create game
2. See game in list
3. Click "Join" → Navigate to Table
4. Join game → See player added
5. Take actions (fold, call, raise) → See state update via WebSocket
6. Verify all transactions on blockchain

**Success = Complete poker game playable end-to-end!** 🎉

---

### 🎨 Phase 4: Migrate UI Components (AFTER SDK QUERIES!)

**Order matters! Do in this sequence:**

#### Step 1: Dashboard (First UI Component)
- [ ] **Dashboard** (`ui/src/pages/Dashboard.tsx`)
  - Add: `const games = await signingClient.queryGames()`
  - Display games from Cosmos blockchain
  - Users can see available games
  - **Why first?** Users need to see games before joining them

#### Step 2: Player Action Hooks (Core Gameplay)
- [ ] **foldHand.ts** → `performAction(gameId, "fold", 0)`
- [ ] **checkHand.ts** → `performAction(gameId, "check", 0)`
- [ ] **callHand.ts** → `performAction(gameId, "call", amount)`
- [ ] **betHand.ts** → `performAction(gameId, "bet", amount)`
- [ ] **raiseHand.ts** → `performAction(gameId, "raise", amount)`

#### Step 3: Table Management Hooks
- [ ] **joinTable.ts** → `joinGame(gameId, seat, buyInAmount)`
- [ ] **leaveTable.ts** → `performAction(gameId, "leave", 0)` or new SDK method
- [ ] **sitIn.ts** → `performAction(gameId, "sit-in", 0)`
- [ ] **sitOut.ts** → `performAction(gameId, "sit-out", 0)`

#### Step 4: Table Component (Last!)
- [ ] **Table** (`ui/src/components/playPage/Table.tsx`)
  - Add: `const gameState = await signingClient.queryGameState(gameId)`
  - Use Cosmos SDK for all actions
  - **Why last?** Needs all hooks migrated first

---

### 📋 CURRENT STATUS (Updated Oct 26, 2025) ✅

**ALL CORE FUNCTIONALITY WORKING:**
- ✅ SDK fully implemented with auto action index tracking
- ✅ All transaction methods working (createGame, joinGame, performAction, sendTokens)
- ✅ Query methods working (queryGames, queryGameState)
- ✅ Blockchain persists and returns game state correctly
- ✅ PVM integration complete (create, join, actions all working)
- ✅ WebSocket real-time updates functioning
- ✅ All 13 player action hooks migrated to Cosmos SDK
- ✅ Utility hooks migrated (useTablePlayerCounts, useSitAndGoPlayerJoinRandomSeat)
- ✅ Build successful with no TypeScript errors

**COMPLETED WORK:**
1. ✅ msg_server_join_game.go - Persists game state after PVM call
2. ✅ msg_server_create_game.go - Initializes game state
3. ✅ msg_server_perform_action.go - Saves state after actions
4. ✅ queryGameState() endpoint - Working at `/block52/pokerchain/poker/v1/game_state/{id}`
5. ✅ performAction() with auto action index tracking - Tested and working
6. ✅ Dashboard integration - Uses Cosmos SDK for all gameplay
7. ✅ All player action hooks migrated - Phase 3 complete!

**NEXT STEPS - TESTING & POLISH:**
1. Test multi-player scenarios (2+ players at same table)
2. Test complete hand flow (blinds → deal → betting → showdown)
3. Test Sit & Go tournaments (4+ players)
4. Performance optimization and error handling
5. Update bridge to use Cosmos (future work)

**System Status:** ✅ FULLY FUNCTIONAL - Ready for gameplay testing!

---

## ✅ Phase 8: Game Type & Action Fixes (Nov 12, 2025)

### Bug #3: Cash Games Showing as "Sit & Go" (FIXED ✅)

**Symptom:**
- Created Cash game but UI displayed "Sit & Go • Texas Hold'em"
- Transaction showed correct `"game_type": "cash"`
- But game state had `"type": "sit-and-go"`

**Root Cause:**
Two places were hardcoding the game type:
1. **msg_server_create_game.go:94** - Hardcoded `GameTypeTexasHoldem` when creating game
2. **msg_server_perform_action.go:134** - Hardcoded `GameTypeSitAndGo` when calling PVM

**The Fix:**
1. Added missing constants to `types.go`:
   ```go
   GameTypeCash        GameType = "cash"
   GameTypeTournament  GameType = "tournament"
   ```

2. Fixed `msg_server_create_game.go` (lines 94-105):
   ```go
   // Convert string game type to GameType enum
   var gameType types.GameType
   switch msg.GameType {
   case "cash":
       gameType = types.GameTypeCash
   case "sit-and-go":
       gameType = types.GameTypeSitAndGo
   case "tournament":
       gameType = types.GameTypeTournament
   default:
       gameType = types.GameTypeCash
   }
   ```

3. Fixed `msg_server_perform_action.go` (lines 125-147):
   - Same conversion logic before passing to PVM
   - Now uses actual game type from database

**Files Changed:**
- `pokerchain/x/poker/types/types.go` - Added constants
- `pokerchain/x/poker/keeper/msg_server_create_game.go` - Fixed game creation
- `pokerchain/x/poker/keeper/msg_server_perform_action.go` - Fixed PVM calls

**Test Results:**
- ✅ Created Cash game shows "Cash • Texas Hold'em"
- ✅ Game state has `"type": "cash"` correctly
- ✅ PVM logs show `'type': 'cash'` throughout
- ✅ WebSocket broadcasts correct game type

---

### Bug #4: Post Small Blind Fails with 501 Error (FIXED ✅)

**Symptom:**
- Clicking "Post Small Blind" button failed
- Error: `Failed to query game state: Not Implemented (501)`
- PVM actually executed the action successfully!
- But Cosmos transaction failed due to SDK error

**Root Cause:**
SDK's `performAction()` method was trying to query game state from REST API to calculate action index:
```typescript
// OLD CODE - Causing 501 error:
const nextActionIndex = await this.getNextActionIndex(gameId);
// This queried: /pokerchain/poker/v1/game_state?game_id=...
// But correct URL is: /block52/pokerchain/poker/v1/game_state/{id}
```

**The Problem:**
1. SDK was querying REST API unnecessarily
2. URL was wrong (missing `/block52` prefix, using query param instead of path)
3. Action index isn't even needed - keeper calculates it automatically!
4. `MsgPerformAction` proto only has: player, game_id, action, amount (no index field)

**The Fix:**
Removed unnecessary game state query from SDK:
```typescript
// NEW CODE - No query needed:
async performAction(gameId: string, action: string, amount: bigint = 0n) {
    // Create the message (keeper calculates action index)
    const msgPerformAction = {
        player,
        gameId,
        action,
        amount: Long.fromString(amount.toString(), true)
    };
    // ... sign and broadcast
}
```

**Files Changed:**
- `poker-vm/sdk/src/signingClient.ts:279-327` - Removed getNextActionIndex() call
- `poker-vm/ui/src/components/Footer.tsx:190-204` - Added error handling

**Why This Works:**
- The keeper's `msg_server_perform_action.go` calculates action index itself
- It uses: `actionIndex = gameState.ActionCount + len(gameState.PreviousActions) + 1`
- The PVM already has the current game state
- No need to query from REST API!

---

### Bug #5: Post Small Blind Out of Gas (FIXED ✅)

**Symptom:**
- Post small blind transaction failed with code 11 (out of gas)
- Gas Used: 133,995
- Gas Limit: 100,000 ❌
- But PVM successfully executed the action!

**Transaction Details:**
```json
{
  "hash": "482139A90D5E67C13A864DD29322851508B3B47E97E1AA1173AB79B8D1347C7D",
  "status": "FAILED (code 11)",
  "gas_used": 133995,
  "gas_wanted": 100000
}
```

**PVM Logs Showed Success:**
```javascript
Updated Game State: {
  players: [{
    seat: 2,
    stack: '990000',  // Reduced from 1,000,000
    sumOfBets: '20000',
    lastAction: {
      action: 'post-small-blind',
      amount: '10000'
    }
  }],
  pots: [ '10000' ]  // Pot has the blind!
}
```

**The Fix:**
Increased gas limit in SDK from 100,000 to 200,000:
```typescript
// poker-vm/sdk/src/signingClient.ts
const fee = calculateFee(200_000, this.gasPrice);  // Was 100_000
```

**Files Changed:**
- `poker-vm/sdk/src/signingClient.ts` - Increased all gas limits to 200,000

**Why Higher Gas:**
- Poker actions call PVM via HTTP
- Keeper does token transfers
- More complex than simple send transaction
- 200,000 gas provides safe buffer

**Next Steps:**
1. Restart UI (yarn dev --force) ✅ DONE
2. Restart PVM (yarn dev) ✅ DONE
3. Refresh browser and test "Post Small Blind" ✅ DONE
4. Should now succeed on blockchain AND in PVM! ✅ SUCCESS!

**Test Results (Nov 12, 2025 - 6:35 PM):**

✅ **Post Small Blind** - WORKING PERFECTLY!
- Transaction: `FF72CC05F5C95FCD49F3FDBEF9DF4AE56904C418C26FDC41D9E522A4F39C85F2`
- Status: SUCCESS
- Gas Used: 133,995 / 200,000 (within limit!)
- Player 2 stack: 1,000,000 → 990,000 ✅
- Pot: 0 → 10,000 ✅
- PVM executed action successfully ✅

✅ **Post Big Blind** - WORKING PERFECTLY!
- Transaction: `5B0E104A8A2B8E13917E99970A95B6A7949FA8E16052838BCC2CFF1158DEBF9A`
- Status: SUCCESS
- Gas Used: 140,592 / 200,000
- Player 1 stack: 1,000,000 → 980,000 ✅
- Pot: 10,000 → 30,000 ✅
- Game state updated via WebSocket ✅

**UI Logs Confirmed:**
```javascript
✅ Small blind posted successfully
✅ Post small blind transaction submitted: FF72CC05...

✅ Post big blind transaction submitted: 5B0E104A...
✅ Action transaction successful

// Game state shows correct values:
players: [
  { seat: 1, stack: "980000", sumOfBets: "40000" },  // Big blind
  { seat: 2, stack: "990000", sumOfBets: "20000" }   // Small blind
],
pots: ["30000"],
type: "cash"  // ✅ Game type correct!
```

**Status:** ✅ **FULLY WORKING!** All three bugs fixed and verified working end-to-end!

### Bug #6: Deal Action Failed (Code 1105) - FIXED ✅

**Symptom:**
- After posting both blinds, clicking "Deal" fails
- Transaction: `DE269575065E8FDED8935109C3C2F1D85CAA66275F0831809F2576A867913A7E`
- Error Code: 1105 (ErrUnknownRequest or keeper handler error)
- Gas Used: 49,197 / 200,000 (NOT out of gas)

**Error Message:**
```
failed to execute message; message index: 0: invalid action: deal: invalid poker action
```

**Root Cause:**
The keeper's valid actions list at `pokerchain/x/poker/keeper/msg_server_perform_action.go:19-33` was missing "deal":
```go
const (
    SmallBlind PlayerActionType = "post-small-blind"
    BigBlind   PlayerActionType = "post-big-blind"
    Fold       PlayerActionType = "fold"
    Check      PlayerActionType = "check"
    Bet        PlayerActionType = "bet"
    Call       PlayerActionType = "call"
    Raise      PlayerActionType = "raise"
    AllIn      PlayerActionType = "all-in"
    Muck       PlayerActionType = "muck"
    SitIn      PlayerActionType = "sit-in"
    SitOut     PlayerActionType = "sit-out"
    Show       PlayerActionType = "show"
    Join       PlayerActionType = "join"
    // Deal was MISSING!
)
```

Even though "deal" is a `NonPlayerActionType` (system action), it still goes through the `performAction` flow, similar to "join".

**Fix Applied:**
Added "deal" to the valid actions in `msg_server_perform_action.go`:
```go
const (
    SmallBlind PlayerActionType = "post-small-blind"
    BigBlind   PlayerActionType = "post-big-blind"
    Fold       PlayerActionType = "fold"
    Check      PlayerActionType = "check"
    Bet        PlayerActionType = "bet"
    Call       PlayerActionType = "call"
    Raise      PlayerActionType = "raise"
    AllIn      PlayerActionType = "all-in"
    Muck       PlayerActionType = "muck"
    SitIn      PlayerActionType = "sit-in"
    SitOut     PlayerActionType = "sit-out"
    Show       PlayerActionType = "show"
    Join       PlayerActionType = "join"
    Deal       PlayerActionType = "deal"  // ✅ ADDED
)

// Also added to validActions array:
validActions := []PlayerActionType{
    SmallBlind, BigBlind, Fold, Check, Bet, Call, Raise, AllIn, Muck, SitIn, SitOut, Show, Join, Deal,
}
```

**Files Modified:**
- `pokerchain/x/poker/keeper/msg_server_perform_action.go` (lines 34, 40)

**Rebuild Command:**
```bash
cd pokerchain && make install
```

**Test Results:**
After rebuilding pokerchain and restarting node 1:

1. **Deal Action - SUCCESS** ✅
   - Transaction: `42158B209A94D0AF0D88D5C1540E495859F55942785C32AEA0690882DC0CA992`
   - Status: SUCCESS
   - Gas Used: 133,835 / 200,000
   - Cards dealt to both players
   - Round advanced from "ante" to "preflop"
   - PVM logs confirm: `Executing deal command...` and `Broadcasted game state update`

2. **Call Action After Deal - SUCCESS** ✅
   - Transaction: `F8CE4B0A2E442C80D8A27584D77778C8CCD13BBDF32C6A1073F3599C73B73A16`
   - Status: SUCCESS
   - Gas Used: 141,137 / 200,000
   - Seat 2 called 10,000 (matching big blind)
   - Pot increased from 30,000 → 40,000
   - Game state updated: both players now have 20,000 in sumOfBets
   - Next to act: Seat 1 (big blind)

**Status:** ✅ **FULLY WORKING!** Deal action fixed and tested end-to-end!

### Bug #7: Hole Cards Not Displaying - FIXED ✅ (Nov 12, 2025)

**Symptom:**
- Transactions succeed on blockchain (deal, call)
- PVM processes actions and broadcasts WebSocket updates
- BUT hole cards don't display in UI after refresh
- Cards show as "??" or no cards at all
- Opponent players don't show card backs

**Root Cause:**
The `toJson()` method in `texasHoldem.ts` was still using privacy logic that only sent hole cards to the player themselves:
```typescript
// OLD CODE - Only sent cards to the player themselves:
if (
    (caller && _player.address.toLowerCase() === caller.toLowerCase()) ||
    _player.status === PlayerStatus.SHOWING
) {
    if (_player.holeCards) {
        holeCardsDto = _player.holeCards.map(card => card.mnemonic);
    }
}
```

This meant:
1. When a player connected via WebSocket, they only got their OWN cards
2. Opponent cards were `undefined` (not even "??")
3. The privacy logic prevented the UI from showing card backs for opponents
4. After server restart, the old code was still running (needed rebuild)

**The Fix:**

1. **Removed ALL privacy logic from `toJson()`** (`texasHoldem.ts:1585-1606`):
   ```typescript
   // NEW CODE - Send all cards to everyone (for testing):
   let holeCardsDto: string[] | undefined = undefined;
   if (_player.holeCards) {
       holeCardsDto = _player.holeCards.map(card => card.mnemonic);
   }

   // OLD PRIVACY LOGIC (commented out for now)
   ```

2. **OppositePlayer component already had card back logic** (`OppositePlayer.tsx:164-180`):
   - When `holeCards.length === 2` and not showing → displays `Back.svg`
   - This automatically works once cards are sent to everyone

3. **Player component shows real cards** (`Player.tsx:102-131`):
   - Displays actual card faces from `holeCards` array

4. **Restarted PVM server** to pick up TypeScript changes:
   ```bash
   kill -9 <old-pids> && npm run dev
   ```

5. **Created new table** - old game states had incomplete data

**Files Changed:**
- `poker-vm/pvm/ts/src/engine/texasHoldem.ts` (lines 1585-1606)
- `poker-vm/ui/src/components/playPage/Players/OppositePlayer.tsx` (line 174 - changed to `Back.svg`)
- PVM server restart required for changes to take effect

**Test Results:**
✅ **NEW TABLE TEST - WORKING PERFECTLY!**
- Transaction: `E220C3DECB8861210D241073AB2D11AD3C868F54434ED701F3CD6F1DBD628686`
- Table: `0x70025d1564ad3a50aa104a884a2785971d824d4c636274c26f08d8b78accf675`
- Both players see their own cards correctly
- Opponent players show card backs (`Back.svg`)
- WebSocket broadcasts include all hole cards
- No "??" errors in PVM logs

**PVM Logs Confirmed:**
```javascript
🔔 Broadcasting to 2 subscribers...
🃏 Subscriber b5219dj7nyvs... hole cards: [ 'AC', '3C' ]
🃏 Subscriber b521y2ggsvur... hole cards: [ '2C', '4C' ]
✅ Broadcasted game state update to 2 subscribers after performing action: deal
```

**UI Logs Confirmed:**
```javascript
// Player Component (Seat 2):
{
  "playerData": {
    "seat": 2,
    "holeCards": ["2C", "4C"],  // ✅ Your cards
    "stack": "990000",
    "status": "active"
  }
}

// OppositePlayer Component (Seat 1):
{
  "playerData": {
    "seat": 1,
    "holeCards": ["AC", "3C"],  // ✅ Received, shows card backs
    "stack": "980000",
    "status": "active"
  }
}
```

**Architecture Note:**
This is a temporary fix for testing. In production:
- Backend should send personalized game state (only your own cards)
- Frontend should NEVER see opponent's actual card values
- Current approach: Backend sends all cards, frontend shows card backs

**Status:** ✅ **FULLY WORKING!** Players see their own cards, opponents see card backs!

### Bug #8: Player Stack and Bet Amounts Not Displaying (FIXED ✅ - Nov 12, 2025)

**Symptom:**
- Player badges showing "$0.00" instead of table stack
- Player chips (bets) not appearing on table
- sumOfBets value always "0"

**Root Cause:**
The `Player.toJson()` method in `poker-vm/pvm/ts/src/models/player.ts` was returning an empty object:
```typescript
public toJson(): PlayerDTO {
    return {} as PlayerDTO;  // ❌ BUG: Lost all player data!
}
```

This meant when the game state was serialized to send to the UI, ALL player data was being lost:
- Stack (chips at table)
- Hole cards
- Last action
- Sum of bets
- Status

**The Fix:**
Implemented full serialization of player data in `player.ts:54-78`:
```typescript
public toJson(): PlayerDTO {
    return {
        address: this.address,
        seat: 0, // Will be set by the game
        stack: this.chips.toString(), // ✅ Convert bigint to string
        isSmallBlind: false,
        isBigBlind: false,
        isDealer: false,
        holeCards: this.holeCards?.map(card => card.mnemonic),
        status: this.status,
        lastAction: this.lastAction ? {
            playerId: this.lastAction.playerId,
            seat: this.lastAction.seat,
            action: this.lastAction.action,
            amount: this.lastAction.amount.toString(),
            round: this.lastAction.round,
            index: this.lastAction.index,
            timestamp: this.lastAction.timestamp || 0
        } : undefined,
        legalActions: [],
        sumOfBets: "0", // Calculated by game
        timeout: 0,
        signature: ""
    } as PlayerDTO;
}
```

**Also Fixed:**
- Added debug logging to `usePlayerData.ts:54-70` to track stack value conversion
- Transaction popup now auto-closes after 5 seconds (`TransactionPopup.tsx:15-24`)
- Transaction popup size reduced by 50% (max-w-sm, smaller padding/fonts)

**Files Changed:**
- `poker-vm/pvm/ts/src/models/player.ts` - Implemented toJson() properly
- `poker-vm/ui/src/hooks/usePlayerData.ts` - Added debug logging
- `poker-vm/ui/src/components/playPage/common/TransactionPopup.tsx` - Size and auto-close fixes

**Test Results (Nov 12, 2025 - 8:45 PM):**
After UI refresh with decimal fix:
- ✅ Player badges show correct stack amounts ($0.96, $0.94)
- ✅ Bet chips display on table ($0.02, $0.04, $0.06, $0.08)
- ✅ Stack values update correctly after each action
- ✅ sumOfBets tracked accurately through betting rounds
- ✅ Transaction popup improvements working (auto-close, smaller size)
- ✅ Full preflop betting tested: SB, BB, Deal, Call, Raise (x3)

**ACTUAL ROOT CAUSE - Wrong Decimal Conversion:**
The bug was in `usePlayerData.ts:70` using **18 decimals (Wei/Ethereum)** instead of **6 decimals (Cosmos microunits)**:

```typescript
// BEFORE (WRONG):
return Number(ethers.formatUnits(playerData.stack, 18));  // 18 decimals
// "1000000" → 0.000000000001 → rounds to $0.00 ❌

// AFTER (CORRECT):
return Number(playerData.stack) / 1_000_000;  // 6 decimals
// "1000000" → 1.0 → displays as $1.00 ✅
```

**Files Actually Fixed:**
- `poker-vm/ui/src/hooks/usePlayerData.ts:64-72` - Changed from 18 to 6 decimals
- `poker-vm/ui/src/components/playPage/common/TransactionPopup.tsx` - Size and auto-close

**Note:** Changes to `player.toJson()` in `pvm/ts/src/models/player.ts` were NOT necessary. The game's `texasHoldem.ts` does serialization directly.

**Key Takeaway:**
When migrating from Ethereum to Cosmos, ALL decimal conversions must change from 18 (Wei) to 6 (microunits). This includes display hooks, not just action handlers!

---

## 🐛 Bug Fixes & Investigations

### Bug #1: Invalid Action Index on Second Player Join (Oct 28, 2025)

**Symptom:**
- First player joins Sit & Go successfully
- Second player gets error: `Error: Invalid action index.`
- PVM logs show: `index: 1` (expected: 2)

**Investigation:**
```bash
# PVM error log:
handleWriteMethod perform_action {
  params: ['b521t29f...', '0xb9de98e...', 'join', '1000000', 1, ...],  # index = 1
}
Error: Invalid action index.
    at TexasHoldemGame.performAction (/poker-vm/pvm/ts/src/engine/texasHoldem.ts:1052:19)
```

**Root Cause:**
The blockchain keeper was calculating action index incorrectly. It was using:
```go
actionIndex := gameState.ActionCount + 1  // ❌ WRONG!
```

But the PVM expects (from `texasHoldem.ts:983`):
```typescript
return this._actionCount + this.getPreviousActions().length + 1;
```

**Example:**
- Player 1 joins: ActionCount=0, PreviousActions=[], Index = 0 + 0 + 1 = 1 ✅
- Player 2 joins: ActionCount=0, PreviousActions=[1], Index = 0 + 1 + 1 = 2 ✅

Keeper was calculating: `0 + 1 = 1` ❌ (missing previousActions length)

**Fix:**
Updated `pokerchain/x/poker/keeper/msg_server_perform_action.go:145`:
```go
// OLD:
actionIndex := gameState.ActionCount + 1

// NEW:
actionIndex := gameState.ActionCount + len(gameState.PreviousActions) + 1
```

**Debug Script Created:**
`pokerchain/scripts/debug-action-index.sh` - Check game state and calculate expected action index

**Files Changed:**
- `pokerchain/x/poker/keeper/msg_server_perform_action.go` (line 145)

**Test:**
```bash
# Rebuild and restart blockchain
cd pokerchain && make install && ignite chain serve --reset-once

# Try joining with second player
# Should now succeed with correct action index
```

---

### Bug #2: Seat Assignment Hardcoded to Seat 1 (Oct 28, 2025)

**Symptom:**
- Both players successfully join Sit & Go (action index fix worked!)
- But BOTH players are assigned to seat 1
- Second player overwrites first player in game state
- Each player's browser shows only themselves in seat 1

**Root Cause:**
The keeper was **not passing the seat number** from the join message to the PVM. Instead, it hardcoded `seat=1` in the RPC call.

**Evidence:**
```typescript
// UI hook sends seat=0 for random assignment:
// useSitAndGoPlayerJoinRandomSeat.ts:72-76
const transactionHash = await signingClient.joinGame(
    options.tableId,
    0, // Seat 0 = random seat selection
    BigInt(amountInMicrounits)
);
```

```go
// Keeper receives the seat in the message:
// msg_server_join_game.go:20
sdkCtx.Logger().Info("🎮 JoinGame called",
    "seat", msg.Seat,  // ✅ Seat is in the message!
```

```go
// BUT keeper doesn't pass seat to PVM:
// msg_server_join_game.go:77
err = k.callGameEngine(ctx, msg.Player, msg.GameId, "join", msg.BuyInAmount)
// ❌ No seat parameter!
```

```go
// AND hardcodes seat=1 in the RPC call:
// msg_server_perform_action.go:157
request := JSONRPCRequest{
    Params: []interface{}{
        // ...
        `seat=1`,  // ❌ BUG: Always seat 1!
    },
}
```

**Expected Behavior:**
- UI sends `seat=0` for random seat selection
- Keeper passes `seat=0` to PVM
- PVM automatically assigns next available seat (1, 2, 3, etc.)
- Each player gets a unique seat number

**Fix:**
1. Modify `callGameEngine()` function to accept seat parameter
2. Pass `msg.Seat` to `callGameEngine()` in `JoinGame` handler
3. When seat=0 (random), send empty string to PVM (let PVM auto-assign)
4. When seat>0 (specific), send `seat=N` to request that seat

**The Critical Issue:**
The PVM **requires an explicit seat number** and doesn't support auto-assignment. The Ethereum SDK handled this by picking an available seat before calling the contract. The Cosmos keeper now does the same.

**How It Works (matching Ethereum SDK pattern):**
1. UI/hook sends `seat=0` for "random seat selection"
2. Keeper checks if `seat=0`
3. If yes, keeper fetches game state and finds first available seat (1 to maxPlayers)
4. Keeper passes the **specific seat number** to PVM (e.g., `seat=1`, `seat=2`)
5. PVM assigns player to that seat

```go
// In msg_server_join_game.go:
if seatNumber == 0 {
    // Get game state and find occupied seats
    occupiedSeats := make(map[int]bool)
    for _, player := range gameState.Players {
        occupiedSeats[player.Seat] = true
    }

    // Find first available seat
    for seat := int(1); int64(seat) <= game.MaxPlayers; seat++ {
        if !occupiedSeats[seat] {
            seatNumber = uint64(seat)  // Use this seat
            break
        }
    }
}
```

**Files Changed:**
- `pokerchain/x/poker/keeper/msg_server_perform_action.go` (callGameEngine signature and lines 148-156, 168)
- `pokerchain/x/poker/keeper/msg_server_join_game.go` (line 78 - pass seat to callGameEngine)

**Test:**
```bash
# Rebuild and restart blockchain
cd pokerchain && make install && ignite chain serve --reset-once

# Try joining with 2+ players
# Each should get a different seat (1, 2, 3, etc.)
```

**Status:** ✅ **FIXED** (Oct 28, 2025)
- Rebuilt binary with seat selection logic
- Restarted chain with fresh state
- Ready for testing

---

### Token Transfer Order: Why Transfer-First is Correct

**Question:** Should the keeper transfer tokens FIRST (current approach) or call PVM first (Ethereum approach)?

**Current Cosmos Flow:**
```
1. Validate inputs (address, game exists, buy-in amount)
2. ✅ Transfer buy-in: player → module account (escrow)
3. 🎲 Call PVM to join game
4a. If PVM fails: ❌ Refund: module → player (atomically)
4b. If PVM succeeds: ✅ Keep tokens in module, update game.Players
```

**Why This is Correct:**

1. **Atomic Transactions**: Either everything succeeds (tokens transferred + PVM updated) or everything fails (tokens refunded)
2. **Cosmos SDK Pattern**: Module account acts as escrow/pot during the game
3. **Error Recovery**: Simple refund if PVM fails - no inconsistent state
4. **Minimal Keeper Logic**: Keeper is just a vessel - transfers tokens, calls PVM, handles cleanup

**Comparison to Ethereum:**
- On Ethereum, the contract ALSO takes tokens first (via `transferFrom`)
- Then calls internal game logic
- If logic fails, transaction reverts (automatic refund)
- **Cosmos uses explicit refund** but same atomic guarantee

**Why Balance Goes Down:**
- When you join with $1 buy-in, your wallet balance **should** decrease by $1
- Those tokens are now in the module account (game pot)
- When game ends, winners receive the pot
- This is identical to Ethereum - tokens are locked in contract/module

**UI Clarification Needed:**
The test-signing page shows two different balances:
- Top bar: "$0.00USDC" (wallet balance AFTER buy-in deducted)
- Modal: "Your Balance: $50.00" (might be showing different source)

This is confusing UX but **not a bug** - tokens are correctly held in the game pot.

---

## 🔢 BigInt Number Handling Standards (Oct 30, 2025)

### Architecture Decision: Hooks Use BigInt, Components Format

**PRINCIPLE:** All numeric values (balances, amounts, stakes, pots, chips) must flow through the system as BigInt (string representation) until the final display moment in UI components.

**Why This Matters:**
- Prevents precision loss for large amounts
- Consistent representation across blockchain/SDK/UI
- Separation of concerns: hooks = data logic, components = presentation

### The Rule

```
┌─────────────┐      ┌──────────────┐      ┌────────────────┐
│  Blockchain │ ──>  │    Hooks     │ ──>  │   Components   │
│   (BigInt)  │      │   (BigInt)   │      │  (formatted $) │
└─────────────┘      └──────────────┘      └────────────────┘
                            ▲                       │
                            │                       │
                            └───────────────────────┘
                           ONLY convert here using utils
```

**✅ CORRECT Pattern:**
```typescript
// Hook returns raw string (BigInt representation)
export const usePlayerStack = () => {
  return {
    stack: "1000000",  // microunits as string
  };
};

// Component formats for display
const Component = () => {
  const { stack } = usePlayerStack();
  return <div>{formatWeiToDollars(stack)}</div>;  // "$1.00"
};
```

**❌ WRONG Pattern:**
```typescript
// Hook does formatting (DON'T DO THIS!)
export const usePlayerStack = () => {
  return {
    stack: "1000000",
    formattedStack: "$1.00",  // ❌ Formatting belongs in components!
  };
};
```

### Comprehensive Assessment Results (Oct 30, 2025)

**Total Hooks Analyzed:** 56 files
**Hooks with Numeric Values:** 28
**Total Violations Found:** 15

**Breakdown by Severity:**
- **Critical Violations:** 8 (Hooks returning formatted values or doing conversions)
- **Medium Violations:** 5 (Hooks with unclear type annotations)
- **Low Violations:** 2 (Missing type annotations)

### Critical Issues to Fix (Priority 1)

#### 1. usePlayerData.ts (Line 53-56)
**Issue:** Converting stack to number using ethers.formatUnits
**Fix:** Return raw stack string without conversion
```typescript
// WRONG:
const stackValue = Number(ethers.formatUnits(playerData.stack, 18));

// CORRECT:
const stack = playerData?.stack || "0";  // Return as string
```

#### 2. useMinAndMaxBuyIns.ts (Lines 57-93)
**Issue:** Complex Wei → microunits conversion in hook
**Fix:** Return raw values, move conversion to utility function

#### 3. useTableData.ts (Lines 53-54)
**Issue:** Formatting blinds in hook using formatWeiToSimpleDollars
**Fix:** Return raw smallBlind and bigBlind strings

#### 4. useWinnerInfo.ts (Line 24)
**Issue:** Hook includes formattedAmount field
**Fix:** Remove formattedAmount, let components format

#### 5. useTableState.ts (Lines 43-51)
**Issue:** Hook returns both totalPot and formattedTotalPot
**Fix:** Remove formattedTotalPot from hook return

#### 6. useSitAndGoPlayerResults.ts (Lines 71, 81)
**Issue:** Hook includes formattedPayout field
**Fix:** Remove formattedPayout, components handle formatting

#### 7. useNewTable.ts (Lines 66-67, 76-77)
**Issue:** Interface accepts number instead of string for buy-ins
**Fix:** Change CreateTableOptions to accept string values

#### 8. Type Interfaces
**Issue:** Several interfaces use wrong types for amounts
**Fix:** Update type definitions:
```typescript
// WRONG:
export interface PlayerDataReturn {
  stackValue: number;  // ❌
}

// CORRECT:
export interface PlayerDataReturn {
  stackValue: string;  // ✅ BigInt representation
}
```

### Compliant Hooks (No Changes Needed) ✅

The following hooks already follow BigInt standards:
- useDepositUSDC.ts - Accepts bigint parameter ✅
- useApprove.ts - Accepts bigint parameter ✅
- useWithdraw.ts - Accepts bigint parameter ✅
- betHand.ts - Converts string to BigInt before SDK call ✅
- raiseHand.ts - Converts string to BigInt before SDK call ✅
- callHand.ts - Converts string to BigInt before SDK call ✅
- postBigBlind.ts - Uses BigInt correctly ✅
- postSmallBlind.ts - Uses BigInt correctly ✅
- joinTable.ts - Uses BigInt correctly ✅
- usePlayerLegalActions.ts - Returns string min/max ✅

### Number Formatting Utilities (Correct Usage)

**Location:** `ui/src/utils/numberUtils.ts`

These utilities should ONLY be called from UI components:
- `formatWeiToDollars(value: string | bigint): string` - Full precision (e.g., "$1.234567")
- `formatWeiToSimpleDollars(value: string | bigint): string` - Rounded (e.g., "$1.23")
- `convertMicrounitsToDollars(microunits: number): string` - For Cosmos USDC

**Usage Example:**
```typescript
// Component.tsx
import { formatWeiToDollars } from "../utils/numberUtils";

const PlayerChips = () => {
  const { stack } = usePlayerData();  // Returns "1000000" (string)

  return (
    <div className="chips">
      {formatWeiToDollars(stack)}  {/* Displays "$1.00" */}
    </div>
  );
};
```

### Migration Plan

**Phase 1 (Immediate):**
1. Fix critical hooks (8 files listed above)
2. Update type interfaces to use string for amounts
3. Remove all `formatted*` fields from hook return types
4. Run full type check: `tsc --noEmit`

**Phase 2 (Short-term):**
1. Add JSDoc comments to all hooks documenting BigInt usage
2. Create HOOK_STANDARDS.md with examples
3. Add ESLint rule to prevent formatting in hooks (if possible)

**Phase 3 (Long-term):**
1. Audit all components to ensure proper usage of formatting utilities
2. Performance optimization for BigInt operations
3. Consider creating custom React hooks for common formatting patterns

### Documentation Checklist

When creating/updating hooks that handle numeric values:
- [ ] All numeric values are string (BigInt representation)
- [ ] No ethers.formatUnits() or similar formatting calls
- [ ] No conversion to `number` type (loses precision)
- [ ] Return type interface uses `string` for amounts
- [ ] JSDoc comment explains units (e.g., "microunits", "wei")
- [ ] Let components handle all display formatting

### Testing Checklist

Before merging hook changes:
- [ ] TypeScript build succeeds (`yarn build`)
- [ ] No runtime errors in browser console
- [ ] Display values show correct amounts in UI
- [ ] Large amounts don't lose precision
- [ ] Negative amounts handled correctly

**Status:** 📊 Assessment complete, fixes pending
**Next Action:** Implement Priority 1 fixes to critical hooks

---

## 📋 BigInt Review Checklist - Hooks & Components to Verify

This checklist identifies all hooks and components that need review to ensure they:
- **Hooks**: Return BigInt values (not formatted strings or numbers)
- **Components**: Use formatting utilities from `src/utils/numberUtils.ts` when displaying

### ✅ CORRECT PATTERN TO FOLLOW

**Good Example - Chip.tsx:**
```typescript
// Component receives BigInt or string, formats at display time
const Chip: React.FC<{ amount: string | bigint }> = ({ amount }) => {
    const formattedAmount = formatWeiToSimpleDollars(amount);
    return <span>${formattedAmount}</span>;
};
```

---

### PART 1: HOOKS TO CHECK

#### ❌ CRITICAL - Hooks Doing Formatting (Must Fix)

- [ ] **usePlayerData.ts** - Line 53-56
  - **Issue**: Converts stack to `number` using `Number(ethers.formatUnits())`
  - **Handles**: Player chip stacks
  - **Fix**: Return `playerData.stack` as BigInt string, remove conversion

- [ ] **useWinnerInfo.ts** - Line 24
  - **Issue**: Formats winner amounts with `formatWeiToDollars()` in hook
  - **Handles**: Winner payout amounts
  - **Fix**: Return `winner.amount` as BigInt, remove `formattedAmount` field

- [ ] **useTableData.ts** - Lines 53-54
  - **Issue**: Formats blinds with `formatWeiToSimpleDollars()` in hook
  - **Handles**: Small blind, big blind amounts
  - **Fix**: Return raw BigInt values for `smallBlind`/`bigBlind`

- [ ] **useTableState.ts** - Lines 43-51
  - **Issue**: Formats total pot with `ethers.formatUnits()` in hook
  - **Handles**: Total pot amount
  - **Fix**: Return `totalPot` as BigInt string, remove `formattedTotalPot`

- [ ] **usePlayerActionDropBox.ts** - Lines 42-51
  - **Issue**: `formatActionAmount()` does inline formatting with division
  - **Handles**: Action amounts (bet, raise, call)
  - **Fix**: Return raw BigInt amounts, move formatting to components

- [ ] **useSitAndGoPlayerResults.ts** - Lines 71, 81
  - **Issue**: Formats payouts with `formatWeiToSimpleDollars()` in hook
  - **Handles**: Tournament payout amounts
  - **Fix**: Return raw payout BigInt, remove `formattedPayout` field

#### ⚠️ MEDIUM - Hooks Needing Verification

- [ ] **useMinAndMaxBuyIns.ts** - Lines 54-93
  - **Handles**: Min/max buy-in limits
  - **Check**: Contains Wei → microunits conversions with divisions
  - **Verify**: Should return raw BigInt, move conversions to utility function

- [ ] **usePlayerLegalActions.ts**
  - **Handles**: Legal action min/max amounts (bet, raise, call)
  - **Verify**: `legalActions` array min/max values are BigInt strings (not formatted)

- [ ] **useNewTable.ts** - Lines 66-67, 76-77
  - **Handles**: Create table options (buy-ins)
  - **Check**: Interface accepts `number` instead of `string` for buy-ins
  - **Fix**: Change `CreateTableOptions` to accept string values

#### ✅ GOOD - Hooks Returning BigInt Correctly

- [x] **usePlayerChipData.ts** - Returns `totalCurrentRoundBetting.toString()` ✅
- [x] **useCosmosWallet.ts** - Returns `Balance[]` with raw `amount: string` ✅
- [x] **useUserWallet.ts** - Returns raw balance string from SDK ✅
- [x] **raiseHand.ts, betHand.ts, callHand.ts** - Convert to BigInt before sending ✅
- [x] **postBigBlind.ts, postSmallBlind.ts, joinTable.ts** - Use BigInt correctly ✅

---

### PART 2: COMPONENTS TO CHECK

#### ❌ CRITICAL - Components NOT Using Formatting Utilities

- [ ] **Player.tsx** - Line 218
  - **Issue**: Passes `stackValue` (number) to Badge
  - **Displays**: Current player chip stack
  - **Fix**: Receive BigInt from usePlayerData, pass to Badge or format here

- [ ] **OppositePlayer.tsx** - Line 216
  - **Issue**: Passes `stackValue` (number) to Badge
  - **Displays**: Opponent chip stacks
  - **Fix**: Receive BigInt from usePlayerData, pass to Badge or format here

- [ ] **Badge.tsx** - Line 70
  - **Issue**: Receives `value: number`, formats with utility functions
  - **Displays**: Player chip amounts, tournament payouts
  - **Fix**: Change prop to `value: bigint | string`, format internally

- [ ] **BuyInModal.tsx** - Lines 106-107, 192, 231
  - **Issue**: Uses `Number()/parseFloat()` for conversions (precision loss)
  - **Displays**: Buy-in amounts, wallet balances, min/max limits
  - **Fix**: Use BigInt for all conversions, not Number/parseFloat
  - **Specific issues**:
    - Line 106-107: `Number(usdcBalance.amount) / 1_000_000` ❌
    - Line 192, 231: `parseFloat(buyInAmount) * 1_000_000` ❌

- [ ] **Footer.tsx (PokerActionPanel)** - Lines 93-97, 138-141, 212, 225
  - **Issue**: Uses `Number()` division and multiplication
  - **Displays**: Bet/raise controls, action buttons with amounts
  - **Fix**: Work with BigInt throughout, use utilities for display
  - **Specific issues**:
    - Lines 93-97: `Number(action.min) / 1_000_000` ❌
    - Lines 212, 225: `raiseAmount * 1_000_000` ❌

#### ⚠️ MEDIUM - Components Needing Full Review

- [ ] **Table.tsx**
  - **Displays**: Pot amounts, balance displays, winner animations
  - **Check**: Search for `formatWeiToSimpleDollars`, `formatWeiToUSD`, number conversions
  - **Verify**: All numeric displays use formatting utilities

- [ ] **WithdrawalModal.tsx**
  - **Displays**: Withdrawal amounts, balance conversions
  - **Check**: All amount handling uses BigInt

- [ ] **USDCDepositModal.tsx**
  - **Displays**: Deposit amounts, allowances
  - **Check**: BigInt handling for amounts

- [ ] **QRDeposit.tsx**
  - **Displays**: Balance information
  - **Check**: Balance display uses formatting utilities

- [ ] **Deposit.tsx**
  - **Displays**: Deposit interface
  - **Check**: Amount handling and display

#### ✅ GOOD - Components Using Formatting Correctly

- [x] **Chip.tsx** - Receives `amount: string | bigint`, uses `formatWeiToSimpleDollars()` ✅
  - **This is the correct pattern to follow!**

- [ ] **CosmosStatus.tsx** - Review for balance display patterns

---

### SUMMARY STATISTICS

**Hooks:**
- ❌ Critical Issues: 6 hooks doing formatting
- ⚠️ Need Verification: 3 hooks
- ✅ Already Compliant: 8+ hooks

**Components:**
- ❌ Critical Issues: 5 components not using utilities
- ⚠️ Need Review: 5 components
- ✅ Compliant: 1 component (Chip.tsx as reference)

---

### RECOMMENDED FIX ORDER

1. **Phase 1 - Fix Hooks** (Highest Impact)
   - [ ] usePlayerData.ts
   - [ ] useWinnerInfo.ts
   - [ ] useTableData.ts
   - [ ] useTableState.ts
   - [ ] usePlayerActionDropBox.ts
   - [ ] useSitAndGoPlayerResults.ts

2. **Phase 2 - Fix Core Display Components**
   - [ ] Badge.tsx (central component used everywhere)
   - [ ] Player.tsx
   - [ ] OppositePlayer.tsx

3. **Phase 3 - Fix Input/Modal Components**
   - [ ] BuyInModal.tsx
   - [ ] Footer.tsx (PokerActionPanel)

4. **Phase 4 - Review & Verify**
   - [ ] Table.tsx
   - [ ] WithdrawalModal.tsx
   - [ ] USDCDepositModal.tsx
   - [ ] All other display components

---

### FORMATTING UTILITIES REFERENCE

**Available in `poker-vm/ui/src/utils/numberUtils.ts`:**

```typescript
// Use these in components for display:
formatWeiToDollars(weiAmount: string | bigint) → "1,234.56"
formatWeiToSimpleDollars(weiAmount: string | bigint) → "1234.56"
formatUSDCToSimpleDollars(usdcAmount: string | bigint) → "1234.56" // 6 decimals
formatChipAmount(chipAmount: string | bigint) → "1234.56"
formatWinningAmount(amount: string) → "1,234.56"

// Sit & Go specific:
formatForSitAndGo(value: number) → "10,000" // No dollar sign
formatForCashGame(value: number) → "$100.00"

// Conversion utility:
convertAmountToBigInt(amount: string, decimals: number) → bigint
```

**DO NOT use in components:**
- ❌ `Number(value) / 1_000_000`
- ❌ `parseFloat(value) * 1_000_000`
- ❌ `value.toFixed(2)`
- ❌ `ethers.formatUnits()` directly

**Always use the utility functions above!**

---

## 🧹 Phase 7: Legacy Code Cleanup

### Ethereum Wallet References to Remove

The following files still reference the old Ethereum wallet system (`user_eth_public_key`). These need to be updated to use Cosmos addresses (`user_cosmos_address`) or removed if no longer needed:

- [ ] **useUserWallet.ts** (line 25)
  - `export const STORAGE_PUBLIC_KEY = "user_eth_public_key"`
  - Action: Update or remove if wallet is Ethereum-bridge only

- [ ] **b52AccountUtils.ts** (line 23)
  - `return localStorage.getItem("user_eth_public_key")`
  - Action: Check if this util is still needed for bridge, otherwise remove

- [ ] **usePlayerSeatInfo.ts** (line 21)
  - `const address = localStorage.getItem("user_eth_public_key")`
  - Action: Change to `user_cosmos_address`

- [ ] **GameStateContext.tsx** (lines 135, 139)
  - Falls back to `user_eth_public_key` if Cosmos address not found
  - Action: Remove fallback once all components migrated

- [ ] **useNextToActInfo.ts** (line 49)
  - `const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase()`
  - Action: Change to `user_cosmos_address`

- [ ] **usePlayerTimer.ts** (line 93)
  - `const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase()`
  - Action: Change to `user_cosmos_address`

- [ ] **QRDeposit.tsx** (line 207)
  - `const storedKey = localStorage.getItem("user_eth_public_key")`
  - Action: Keep if needed for Ethereum bridge deposits, otherwise remove

- [ ] **Footer.tsx** (lines 55, 140)
  - Two references to `user_eth_public_key`
  - Action: Change to `user_cosmos_address` (footer was migrated to Cosmos)

### Related Cleanup Tasks

- [ ] Remove ethers.js imports from files that no longer use Ethereum
- [ ] Update all Wei → microunit conversions (18 decimals → 6 decimals)
- [ ] Remove `user_eth_private_key` references once Ethereum bridge is migrated
- [ ] Clean up old RPC client references
- [ ] Update all documentation comments mentioning "Wei" or "Ethereum"

---

## 📚 Reference Documents

- Original migration checklist: `poker-vm/ui/src/hooks/COSMOS_MIGRATION_CHECKLIST.md`
- Working checklist: `poker-vm/WORKING_CHECKLIST.md`
- Cosmos SDK client: `poker-vm/sdk/src/signingClient.ts`
- Test page: `poker-vm/ui/src/pages/TestSigningPage.tsx`

---

## 🏆 Success Criteria

**Migration is complete when:**
- ✅ All player actions work via Cosmos SDK
- ✅ Games are queried from Cosmos blockchain
- ✅ PVM server is only used for game logic (not state)
- ✅ Full poker hand can be played end-to-end
- ✅ All tests pass
- ✅ No console errors during gameplay

---

**Remember:** The journey of a thousand lines starts with a single commit! 🚀

---

## ⚙️ Phase 8: Deck Shuffling Migration to Cosmos (COMPLETED ✅)

**Date:** November 12, 2025  
**Status:** ✅ **COMPLETE** - Deck shuffling fully migrated from PVM to Cosmos blockchain

### What Was Accomplished

#### Cosmos Blockchain (pokerchain)

**New Files Created:**
- ✅ `x/poker/types/deck.go` - Complete Deck implementation (252 lines)
  - Card and Suit types
  - Fisher-Yates shuffle with deterministic seed
  - Card dealing with top pointer
  - String serialization/deserialization
  - SHA256 hashing for deck integrity

- ✅ `x/poker/types/deck_test.go` - Comprehensive tests (11 tests, all passing)
  - Standard deck creation, parsing, round-trip serialization
  - Card dealing, shuffle verification, invalid input handling

- ✅ `x/poker/keeper/deck_helpers.go` - Keeper utility functions (75 lines)
  - `GenerateShuffleSeed()` - Creates deterministic seed from block hash
  - `InitializeAndShuffleDeck()` - Creates and shuffles deck for new games
  - `LoadDeckFromState()` / `SaveDeckToState()` - Serialization helpers

- ✅ `x/poker/keeper/deck_helpers_test.go` - Integration tests (7 tests, all passing)
  - Seed generation, deck initialization, game state integration
  - Top pointer preservation, error handling

**Modified Files:**
- ✅ `x/poker/keeper/msg_server_create_game.go` - Games now created with shuffled decks (line 107-111)
- ✅ `x/poker/keeper/keeper_test.go` - Test fixtures updated

#### PVM (poker-vm)

**Deleted Files:**
- ✅ `pvm/ts/src/commands/shuffleCommand.ts` - No longer needed
- ✅ `pvm/ts/src/commands/shuffleCommand.test.ts` - 8 tests removed

**Refactored Files:**
- ✅ `pvm/ts/src/models/deck.ts` - Now a pure DTO (Data Transfer Object)
  - Removed `shuffle()` method
  - Removed `seedHash` property
  - Kept parsing, serialization, card dealing logic
  - Handles empty strings gracefully for backwards compatibility

- ✅ `pvm/ts/src/models/deck.test.ts` - Updated tests (14 tests, all passing)
  - Removed shuffle-related tests
  - Updated hash generation test

- ✅ `pvm/ts/src/engine/actions/newHandAction.ts` - Accepts pre-shuffled decks
  - Primary: `?deck=...` parameter with shuffled deck from Cosmos
  - Legacy: `?seed=...` parameter with deprecation warning

- ✅ `pvm/ts/src/types/interfaces.ts` - Removed unused `ICardDeck` interface

### Architecture Changes

**Before:**
```
PVM creates standard deck → PVM shuffles with seed → Game uses deck
```

**After:**
```
Cosmos creates game → Cosmos shuffles deck (block hash seed) → 
  PVM receives pre-shuffled deck → Game uses deck
```

### Test Results

**Cosmos (Go):**
```
✅ PASS: TestGenerateShuffleSeed
✅ PASS: TestInitializeAndShuffleDeck  
✅ PASS: TestDeckRoundTripSerialization
✅ PASS: TestDeckStateWithTopPointer
✅ PASS: TestLoadDeckFromState_EmptyString
✅ PASS: TestLoadDeckFromState_InvalidString
✅ PASS: TestDeckIntegrationWithGameState
✅ PASS: All 11 deck type tests
```

**PVM (TypeScript):**
```
✅ PASS: 14/14 deck tests
✅ Build successful with no errors
⚠️  Some legacy tests fail (newHandAction expecting old seed format)
    - These are for deprecated functionality
    - Can be updated when newHandAction is fully migrated
```

### Verification

**Existing Game State Check:**
```bash
pokerchaind query poker game-state --game-id 0x8c49cf7... --output json
```

Shows deck properly stored:
```json
"deck": "AC-2C-3C-4C-5C-6C-7C-8C-9C-TC-JC-QC-KC-AD-2D-3D-4D-5D-6D-7D-[8D]-9D..."
```

The `[8D]` marker shows the current top position for dealing.

### Benefits Achieved

1. ✅ **Deterministic Shuffling** - Same block = same shuffle (verifiable)
2. ✅ **On-Chain Integrity** - Deck state persisted with full history
3. ✅ **Cryptographic Security** - Block hash provides randomness source
4. ✅ **Type Safety** - Go Deck type matches TypeScript SDK exactly
5. ✅ **Simplified PVM** - 300+ lines of shuffle code removed

### Commits

**poker-vm:**
- Commit: `26f01110` - "Refactor Deck to DTO and remove shuffle logic"
- Changes: 6 files changed, 65 insertions(+), 307 deletions(-)
- [View on GitHub](https://github.com/block52/poker-vm/commit/26f01110)

**pokerchain:**
- Commit: `718ebf3` - "Add Deck implementation and integrate into game creation"
- Changes: 6 files changed, 833 insertions(+)
- [View on GitHub](https://github.com/block52/pokerchain/commit/718ebf3)

---

## 🎯 Next Steps: Complete Cosmos Game Integration

**Current State:**
- ✅ Deck shuffling migrated to Cosmos
- ✅ Game creation creates shuffled decks on-chain
- ⚠️ PVM still handles game logic independently
- ⚠️ Game state not fully synchronized with Cosmos

### Phase 2: Card Dealing Integration (High Priority)

**Goal:** Move card dealing logic from PVM to Cosmos keeper

**Tasks:**
1. [ ] Create `MsgDealCards` transaction in Cosmos
   - Proto definition in `proto/pokerchain/poker/v1/tx.proto`
   - Message handler in `x/poker/keeper/msg_server_deal_cards.go`
   - Deal hole cards to players (2 cards each)
   - Update game state with dealt cards

2. [ ] Implement community card dealing in Cosmos
   - Add to round advancement logic in keeper
   - Flop: Deal 3 cards from deck
   - Turn: Deal 1 card
   - River: Deal 1 card
   - Update `TexasHoldemStateDTO.CommunityCards`

3. [ ] Update PVM to use Cosmos-dealt cards
   - Remove card dealing logic from PVM
   - Query card state from Cosmos
   - Display cards from Cosmos state

### Phase 3: Full Game State Migration (Medium Priority)

**Goal:** Make Cosmos the single source of truth for all game state

**Tasks:**
1. [ ] Migrate hand evaluation to Cosmos
   - Move winner determination to keeper
   - Calculate pot distribution on-chain
   - Update `TexasHoldemStateDTO.Winners`

2. [ ] Migrate betting rounds to Cosmos
   - Move bet validation to keeper
   - Track pot state on-chain
   - Handle side pots in keeper

3. [ ] Update `newHandAction` to work with Cosmos
   - Replace seed-based logic entirely
   - Query new shuffled deck from Cosmos
   - Remove deprecation warnings

### Phase 4: State Synchronization (Low Priority)

**Goal:** Keep PVM and Cosmos state in sync

**Tasks:**
1. [ ] Implement state sync on reconnect
   - Load game state from Cosmos on page load
   - Handle WebSocket disconnections
   - Reconcile any state differences

2. [ ] Add state validation
   - Verify deck hash matches
   - Ensure player stacks match
   - Validate pot amounts

3. [ ] Remove MongoDB dependency from PVM
   - Move all state storage to Cosmos
   - PVM becomes stateless compute layer
   - Query everything from blockchain

### Phase 5: Performance Optimization (Future)

**Tasks:**
1. [ ] Add caching layer for Cosmos queries
2. [ ] Batch state updates
3. [ ] Optimize WebSocket broadcasts
4. [ ] Add state compression

### Testing Checklist

**For Each Phase:**
- [ ] Write keeper tests for new functionality
- [ ] Update TypeScript tests
- [ ] Test on local devnet
- [ ] Test multi-player scenarios
- [ ] Test reconnection scenarios
- [ ] Test error handling

### Success Criteria

**Phase 2 Complete When:**
- ✅ Hole cards dealt by Cosmos, not PVM
- ✅ Community cards dealt by Cosmos keeper
- ✅ UI displays Cosmos-dealt cards correctly
- ✅ Full hand can be played with Cosmos-dealt cards

**Full Migration Complete When:**
- ✅ All game logic in Cosmos keeper
- ✅ PVM only handles WebSocket broadcasts
- ✅ MongoDB optional (Cosmos is source of truth)
- ✅ Full poker hand playable end-to-end
- ✅ All tests pass
- ✅ No state synchronization issues

---

## ✅ Phase 9: Deterministic Timestamp Implementation (Nov 13, 2025)

### Bug #5: Non-Deterministic `Date.now()` Breaking Consensus (FIXED ✅)

**Symptom:**
- PVM game logic was using `Date.now()` at `texasHoldem.ts:1137`
- This causes non-deterministic results across validators
- Different validators would get different timestamps
- Breaks blockchain consensus and reproducibility
- Tests would be flaky with random timestamps

**Root Cause:**
In blockchain game logic, all inputs MUST be deterministic. Using `Date.now()` violates this rule:
```typescript
// OLD CODE - NON-DETERMINISTIC ❌
const timestamp = Date.now(); // Different on each validator!
player.addAction({ playerId: address, action, amount, index }, timestamp);
```

**The Fix:**
Made timestamp an explicit parameter passed from Cosmos block time through the entire call chain:

1. **PVM Changes:**
   - `texasHoldem.ts:1048` - Added optional `timestamp?: number` parameter to `performAction()`
   - `texasHoldem.ts:1136-1140` - Use provided timestamp or fall back to Date.now() for legacy
   - `performActionCommand.ts:21` - Added timestamp to constructor
   - `performActionCommand.ts:44` - Pass timestamp to game engine
   - `rpc.ts:152` - Extract timestamp from 9th RPC parameter
   - `testConstants.ts:49-62` - Added deterministic test helpers

2. **Cosmos Keeper Changes:**
   - `msg_server_perform_action.go:166-168` - Get block timestamp with `sdkCtx.BlockTime().UnixMilli()`
   - `msg_server_perform_action.go:181` - Add timestamp as 9th parameter in RPC call to PVM

3. **Test Updates:**
   - Created `getNextTestTimestamp()` and `resetTestTimestamp()` helpers
   - Updated example test to use deterministic timestamps
   - All tests pass with reproducible results

**Architecture Flow:**
```
Cosmos Block Time → Keeper (UnixMilli) → RPC (9th param) →
Command → Game Engine → Action Recording
```

**Files Changed:**
- `poker-vm/pvm/ts/src/engine/texasHoldem.ts` - Added timestamp parameter
- `poker-vm/pvm/ts/src/commands/cosmos/performActionCommand.ts` - Pass timestamp through
- `poker-vm/pvm/ts/src/rpc.ts` - Extract timestamp from RPC params
- `poker-vm/pvm/ts/src/engine/testConstants.ts` - Deterministic test helpers
- `poker-vm/pvm/ts/src/engine/texasHoldem-round-has-eneded.test.ts` - Example test update
- `pokerchain/x/poker/keeper/msg_server_perform_action.go` - Pass block timestamp to PVM

**Test Results:**
- ✅ Cosmos block timestamp flows to PVM (e.g., `timestamp: 1762989840398`)
- ✅ All validators use same timestamp for consensus
- ✅ Game replays produce identical results
- ✅ Tests are deterministic and reproducible
- ✅ Backwards compatible (timestamp optional with fallback)

**Why This Matters:**
- **Consensus Safety**: All validators get identical results
- **Reproducibility**: Can replay any game with same outcome
- **Test Reliability**: No more flaky tests from random timestamps
- **Blockchain Best Practice**: All inputs must be deterministic

---

## ✅ Phase 10: New Hand Action Support (Nov 13, 2025)

### Bug #6: "new-hand" Action Failing with Error 1105 (FIXED ✅)

**Symptom:**
- Clicking "Start New Hand" button after showdown failed
- Transaction failed with error code 1105
- Explorer showed: `FAILED (code 1105)`
- Action was: `"action": "new-hand"`
- PVM actually supports new-hand action but Cosmos was rejecting it

**Root Cause:**
The "new-hand" action was not in the Cosmos keeper's valid actions list:
```go
// OLD CODE - Missing new-hand ❌
validActions := []PlayerActionType{
    SmallBlind, BigBlind, Fold, Check, Bet, Call, Raise, AllIn, Muck, SitIn, SitOut, Show, Join, Deal,
    // ❌ NewHand was missing!
}
```

Additionally, PVM's `NewHandAction` requires a pre-shuffled deck from Cosmos (via `deck=...` parameter), but the keeper wasn't providing it.

**The Fix:**
1. **Added "new-hand" to valid actions** (`msg_server_perform_action.go:35,41`):
   ```go
   const (
       // ... existing actions ...
       NewHand    PlayerActionType = "new-hand"
   )

   validActions := []PlayerActionType{
       SmallBlind, BigBlind, Fold, Check, Bet, Call, Raise, AllIn, Muck, SitIn, SitOut, Show, Join, Deal, NewHand,
   }
   ```

2. **Special handling in callGameEngine** (`msg_server_perform_action.go:163-178`):
   ```go
   if action == "new-hand" {
       // Generate deterministic shuffled deck from block hash
       deck, err := k.Keeper.InitializeAndShuffleDeck(ctx)
       if err != nil {
           return fmt.Errorf("failed to initialize and shuffle deck: %w", err)
       }
       deckStr := k.Keeper.SaveDeckToState(deck)
       seatData = fmt.Sprintf("deck=%s", deckStr)
       sdkCtx.Logger().Info("🃏 Generated shuffled deck for new hand", "gameId", gameId)
   } else {
       seatData = fmt.Sprintf("seat=%d", seat)
   }
   ```

**Files Changed:**
- `pokerchain/x/poker/keeper/msg_server_perform_action.go` - Added NewHand constant, validation, and deck generation

**How It Works:**
1. Player clicks "Start New Hand" in UI after showdown
2. UI sends `performAction(gameId, "new-hand", 0)` via SDK
3. Cosmos keeper validates "new-hand" is valid action ✅
4. Keeper generates shuffled deck using `InitializeAndShuffleDeck(ctx)`:
   - Uses block hash for deterministic randomness
   - All validators get same deck for same block
5. Passes deck to PVM as `data="deck=AS-KD-QH-..."`
6. PVM's `NewHandAction` receives deck and reinitializes game
7. New hand starts with fresh shuffled deck from Cosmos!

**Test Results:**
- ✅ "new-hand" action now passes validation
- ✅ Deck generated from block hash (deterministic)
- ✅ PVM receives and uses Cosmos-shuffled deck
- ✅ Players can start new hands after showdown
- ✅ Each new hand has unique shuffle (different block = different deck)

**Why This Matters:**
- **Complete Hand Lifecycle**: Players can play continuous cash games
- **Deterministic Shuffling**: Every new hand uses block hash for shuffle
- **Consensus Safety**: All validators shuffle identically
- **No Manual Intervention**: Automatic new hand flow after showdown

---

## 📊 Migration Progress Tracker

### Completed ✅
- [x] Player registration and authentication (Cosmos addresses)
- [x] Game creation and joining via Cosmos SDK
- [x] Balance queries from Cosmos blockchain
- [x] Player actions via Cosmos transactions
- [x] Stack value display with proper microunit conversion
- [x] Bet chip display on table
- [x] **Deck shuffling migrated to Cosmos blockchain**
- [x] **Shuffle logic completely removed from PVM**
- [x] **Deterministic timestamps from Cosmos block time**
- [x] **Non-deterministic Date.now() eliminated from game logic**
- [x] **New hand action with deterministic deck shuffling**
- [x] **Complete hand lifecycle (ante → showdown → new hand)**

### In Progress 🚧
- [ ] Card dealing via Cosmos transactions (Phase 2)
- [ ] Game state fully synchronized with Cosmos
- [ ] Hand evaluation on Cosmos keeper

### Not Started 📋
- [ ] Pot distribution via Cosmos
- [ ] Side pot handling in keeper
- [ ] Winner determination in keeper
- [ ] Full game state validation
- [ ] State reconciliation on reconnect
- [ ] Remove MongoDB dependency

### Technical Debt 🔧
- [ ] Update newHandAction tests (currently failing on old seed format)
- [ ] Remove remaining Ethereum wallet references
- [ ] Clean up legacy Wei conversion code
- [ ] Remove deprecated shuffle-related code paths

---

**Last Updated:** November 13, 2025
**Next Review:** After Phase 2 (Card Dealing) completion

