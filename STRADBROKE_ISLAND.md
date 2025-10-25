# 🏝️ Stradbroke Island - Cosmos SDK Migration Checklist

**Created:** October 25, 2025
**Goal:** Complete migration from PVM RPC to Cosmos SDK for all poker game interactions

---

## 🎉 COMPLETED MILESTONES

### ✅ Phase 1: Core SDK Functions (DONE!)
- [x] **joinGame()** - Working with Long type fix! 🎊
  - Transaction: `40458971B0A2F96078675FDE0330CDE70F88A79E79A929E436324F7F87162639`
  - Fixed by converting `seat` and `buyInAmount` to Long objects
  - SDK: `poker-vm/sdk/src/signingClient.ts:241-242`
- [x] **createGame()** - Working!
  - Transaction: `714CBDD7611116791D68C3E4117D36FFB4672782F0E33697F19269675C4C8AD8`
- [x] **Initialize Client** - Working!
  - Connected to: `http://localhost:26657` (RPC) + `http://localhost:1317` (REST)

---

## 🚧 Phase 2: Remaining SDK Functions

### High Priority
- [ ] **performAction()** - Test all poker actions
  - Location: `poker-vm/sdk/src/signingClient.ts:276-295`
  - Actions to test: Fold, Check, Call, Bet, Raise, All-in
  - Uses Long.fromString() for amount (already fixed)
  - **Next Step:** Test on `/test-signing` page

### Medium Priority
- [ ] **sendTokens()** - Transfer USDC between players
  - Location: `poker-vm/sdk/src/signingClient.ts:185-216`
  - Test sending tokens between test accounts

---

## 🎮 Phase 3: Migrate Player Action Hooks

All hooks in `poker-vm/ui/src/hooks/playerActions/`:

### Critical Game Actions (Must migrate first)
- [ ] **foldHand** (`foldHand.ts`) → Use `performAction()`
- [ ] **checkHand** (`checkHand.ts`) → Use `performAction()`
- [ ] **callHand** (`callHand.ts`) → Use `performAction()`
- [ ] **betHand** (`betHand.ts`) → Use `performAction()`
- [ ] **raiseHand** (`raiseHand.ts`) → Use `performAction()`

### Table Management Actions
- [ ] **joinTable** (`joinTable.ts`) → Use `joinGame()`
- [ ] **leaveTable** (`leaveTable.ts`) → Use `performAction()` or new SDK method
- [ ] **sitIn** (`sitIn.ts`) → Use `performAction()`
- [ ] **sitOut** (`sitOut.ts`) → Use `performAction()`

### Hand Flow Actions
- [ ] **startNewHand** (`startNewHand.ts`) → Use `performAction()`
- [ ] **dealCards** (`dealCards.ts`) → Use `performAction()`
- [ ] **showCards** (`showCards.ts`) → Use `performAction()`
- [ ] **muckCards** (`muckCards.ts`) → Use `performAction()`
- [ ] **postSmallBlind** (`postSmallBlind.ts`) → Use `performAction()`
- [ ] **postBigBlind** (`postBigBlind.ts`) → Use `performAction()`

### Support Hooks
- [ ] **usePlayerLegalActions** (`usePlayerLegalActions.ts`) - Validate actions
- [ ] **types.ts** - Update action type definitions

---

## 🎯 Phase 4: UI Component Migration

### Primary Components (Touch these)
- [ ] **Dashboard** (`ui/src/pages/Dashboard.tsx`)
  - Replace game list fetching with Cosmos queries
  - Use `client.queryGames()` or similar

- [ ] **Table** (`ui/src/components/playPage/Table.tsx`)
  - This is where all player actions are triggered!
  - Replace all `usePlayerAction` hooks with Cosmos SDK calls
  - Test each action: fold, check, call, bet, raise

### Secondary Components (DON'T touch yet)
- [ ] **Footer** (`ui/src/components/Footer.tsx`) - Leave as-is for now

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

## 🎯 NEXT IMMEDIATE STEPS

1. **Test performAction()** on `/test-signing` page
   - Try folding, checking, calling, betting
   - Verify transactions succeed on blockchain

2. **Migrate first critical hook:** `foldHand.ts`
   - Replace PVM RPC call with `signingClient.performAction()`
   - Test on actual poker table

3. **Repeat for each player action hook**
   - One hook at a time
   - Test after each migration

4. **Update Dashboard game list**
   - Query games from Cosmos instead of PVM

5. **Full integration test**
   - Play a complete poker hand using only Cosmos SDK

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
