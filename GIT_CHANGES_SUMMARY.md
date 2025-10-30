# Git Changes Summary - Ready for Commit

## 📦 RECOMMENDED TO STAGE & COMMIT

### Group 1: SDK Core Fixes (✅ CRITICAL - Commit This!)
**Summary:** Fixed Long type encoding for `joinGame()` and `performAction()` + added missing SEED key

**Files:**
- `sdk/src/signingClient.ts` - Added Long.fromNumber/fromString conversions for joinGame() and performAction()
- `sdk/src/types/game.ts` - Added SEED: "seed" to KEYS object
- `sdk/package.json` - Bumped version to 3.0.2-debug (change back to 3.0.2 before commit)

**Commit Message:**
```
fix(sdk): add Long type conversions for joinGame and performAction

- Convert seat parameter to Long.fromNumber(seat, true) in joinGame()
- Convert buyInAmount and amount to Long.fromString() in joinGame() and performAction()
- Add SEED key to KEYS object in types/game.ts
- Fixes "empty address string is not allowed" error when encoding protobuf messages
- Verified working: joinGame transaction 40458971B0A2F96078675FDE0330CDE70F88A79E79A929E436324F7F87162639
```

---

### Group 2: PVM Configuration Updates (✅ SAFE - Commit This!)
**Summary:** Added required `restEndpoint` field to all Cosmos config objects

**Files:**
- `pvm/ts/src/state/cosmos/config.ts` - Added restEndpoint to all config objects
- `pvm/ts/src/examples/frontendCosmosExample.ts` - Added restEndpoint
- `pvm/ts/src/utils/cosmosAccountService.ts` - Added restEndpoint
- `pvm/ts/src/commands/cosmos/cosmosAccountCommand.test.ts` - Added restEndpoint

**Commit Message:**
```
fix(pvm): add restEndpoint to all CosmosConfig objects

- Add restEndpoint: "http://localhost:1317" to DEFAULT_COSMOS_CONFIG
- Add restEndpoint to TEST, DEV, and PROD configs
- Update example files and tests to include restEndpoint
- Fixes TypeScript compilation errors for CosmosConfig interface
```

---

### Group 3: Auto-Generated Protobuf Files (⚠️ LARGE - Commit Separately!)
**Summary:** Regenerated TypeScript protobuf clients with updated tx.proto

**Files in SDK:**
- `sdk/src/pokerchain.poker.v1/types/**/*.ts` (13 files)

**Files in Pokerchain:**
- `pokerchain/ts-client/**/*.ts` (hundreds of files)
- `pokerchain/proto/pokerchain/poker/v1/tx.proto`

**Commit Message for SDK:**
```
chore(sdk): regenerate protobuf types from pokerchain

- Regenerated from pokerchain/ts-client after proto updates
- Includes updated MsgJoinGame and MsgPerformAction with correct types
```

**Commit Message for Pokerchain:**
```
chore(pokerchain): regenerate ts-client from proto definitions

- Regenerated all TypeScript client code via ignite generate ts-client
- Updated tx.proto for poker module
- Auto-generated files only, no manual changes
```

---

### Group 4: Documentation (✅ SAFE - Commit This!)
**Summary:** New comprehensive migration checklist

**Files:**
- `STRADBROKE_ISLAND.md` (NEW)

**Commit Message:**
```
docs: add Stradbroke Island migration checklist

- Comprehensive checklist for Cosmos SDK migration
- Tracks all hooks that need migration
- Documents completed milestones (joinGame, createGame working!)
- Organized by phase with clear next steps
```

---

## ⚠️ NOT RECOMMENDED TO COMMIT YET

### Group 5: Yarn Lock Files
**Files:**
- `pvm/ts/yarn.lock`
- `ui/yarn.lock`

**Reason:** Generated dependency lock files. Wait until all code changes are finalized.

**Action:** Skip for now, commit later with final version

---

## 📋 SUGGESTED COMMIT ORDER

1. **First:** Group 1 (SDK Core Fixes)
   - Most critical
   - Fixes the actual bug
   - Small, focused change

2. **Second:** Group 2 (PVM Config)
   - Related to SDK changes
   - Also a bug fix
   - Small, focused change

3. **Third:** Group 4 (Documentation)
   - No code changes
   - Safe to commit anytime

4. **Fourth:** Group 3 (Protobuf - SDK)
   - Larger commit
   - Auto-generated files
   - Depends on Group 1

5. **Last:** Group 3 (Protobuf - Pokerchain)
   - Huge commit (hundreds of files)
   - Auto-generated files
   - Separate repo, commit separately

---

## 🚫 TEMPORARY/DEBUG FILES TO REMOVE BEFORE COMMIT

### Remove debug logging from signingClient.ts
**File:** `sdk/src/signingClient.ts`

**Lines to remove:**
- Line 238-246: All the `console.log("🔍 DEBUG..."` lines
- Keep only the actual Long conversions

**Clean version should be:**
```typescript
const seatLong = Long.fromNumber(seat, true);
const buyInLong = Long.fromString(buyInAmount.toString(), true);

const msgJoinGame = {
    player,
    gameId,
    seat: seatLong,
    buyInAmount: buyInLong
};
```

### Revert version bump
**File:** `sdk/package.json`

**Change:**
- From: `"version": "3.0.2-debug"`
- To: `"version": "3.0.2"`

---

## 🎯 READY-TO-RUN GIT COMMANDS

### Clean up debug code first:
```bash
cd /Users/alexmiller/projects/pvm_cosmos_under_one_roof/poker-vm
```

### Commit Group 1 (SDK fixes):
```bash
cd /Users/alexmiller/projects/pvm_cosmos_under_one_roof/poker-vm
git add sdk/src/signingClient.ts sdk/src/types/game.ts sdk/package.json
git commit -m "fix(sdk): add Long type conversions for joinGame and performAction

- Convert seat parameter to Long.fromNumber(seat, true) in joinGame()
- Convert buyInAmount and amount to Long.fromString() in joinGame() and performAction()
- Add SEED key to KEYS object in types/game.ts
- Fixes 'empty address string is not allowed' error when encoding protobuf messages
- Verified working: joinGame transaction 40458971B0A2F96078675FDE0330CDE70F88A79E79A929E436324F7F87162639"
```

### Commit Group 2 (PVM config):
```bash
git add pvm/ts/src/state/cosmos/config.ts \
        pvm/ts/src/examples/frontendCosmosExample.ts \
        pvm/ts/src/utils/cosmosAccountService.ts \
        pvm/ts/src/commands/cosmos/cosmosAccountCommand.test.ts

git commit -m "fix(pvm): add restEndpoint to all CosmosConfig objects

- Add restEndpoint: 'http://localhost:1317' to DEFAULT_COSMOS_CONFIG
- Add restEndpoint to TEST, DEV, and PROD configs
- Update example files and tests to include restEndpoint
- Fixes TypeScript compilation errors for CosmosConfig interface"
```

### Commit Group 4 (docs):
```bash
git add STRADBROKE_ISLAND.md

git commit -m "docs: add Stradbroke Island migration checklist

- Comprehensive checklist for Cosmos SDK migration
- Tracks all hooks that need migration
- Documents completed milestones (joinGame, createGame working!)
- Organized by phase with clear next steps"
```

### Commit Group 3 (SDK protobuf) - OPTIONAL:
```bash
git add sdk/src/pokerchain.poker.v1/

git commit -m "chore(sdk): regenerate protobuf types from pokerchain

- Regenerated from pokerchain/ts-client after proto updates
- Includes updated MsgJoinGame and MsgPerformAction with correct types"
```

---

## 📊 SUMMARY

**Total files changed:** 21 in poker-vm, 400+ in pokerchain

**Recommended to commit now:**
- ✅ 7 files (SDK fixes + PVM config + docs)

**Commit later:**
- ⏸️ 2 files (yarn.lock files)
- ⏸️ 13 files (SDK protobuf - optional)
- ⏸️ 400+ files (Pokerchain protobuf - separate repo)

**Remove before commit:**
- 🗑️ Debug logging in signingClient.ts (lines 238-246)
- 🗑️ "-debug" suffix in sdk/package.json version

---

**Status:** Ready to commit after cleaning up debug code! 🚀
