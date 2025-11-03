# SDK Type Duplication Analysis

## 🔍 Summary

The SDK has significant type duplication between `types-legacy.ts` and the `types/` directory. This happened when the original `types.d.ts` was renamed to `types-legacy.ts` during the build fix, but there's already a well-organized `types/` directory.

## 📊 Duplicate Types Found

### 1. **CosmosConfig** (DUPLICATE)
- ❌ `types-legacy.ts` lines 101-109
- ✅ `types/index.ts` lines 3-11
- **Status**: Same definition, can merge

### 2. **GameState** (CONFLICT)
- ❌ `types-legacy.ts` lines 34-37 - Loose type: `{ [key: string]: any }`
- ✅ `types/index.ts` lines 13-21 - Properly typed with specific fields
- **Status**: Keep the typed version, remove loose version

### 3. **LegalAction** (CONFLICT)
- ❌ `types-legacy.ts` lines 44-47 - Loose type: `{ [key: string]: any }`
- ✅ `types/index.ts` lines 42-46 - Properly typed
- **Status**: Keep the typed version, remove loose version

### 4. **GameStateResponse** (CONFLICT - Different purposes)
- ❌ `types-legacy.ts` lines 112-114 - API response: `{ game_state: string }`
- ✅ `types/game.ts` lines 206-208 - SDK response: `{ state: TexasHoldemStateDTO }`
- **Status**: These serve different purposes, need to rename one

### 5. **Game** (CONFLICT)
- ❌ `types-legacy.ts` lines 39-42 - Loose type: `{ [key: string]: any }`
- ✅ `types/index.ts` has `GameInfo` (proper typed version)
- **Status**: Remove loose version

## 📁 Types in `types-legacy.ts` that DON'T have duplicates

These need to be moved to appropriate files:

### Chain/Cosmos Types (move to `types/chain.ts`):
- `AccountResponse` (lines 2-8)
- `TxResponse` (lines 10-25)
- `BlockResponse` (lines 27-31)
- `Coin` (lines 96-99)
- `COSMOS_CONSTANTS` (lines 73-80)
- `CreateGameParams` (lines 83-93)

### API Response Types (move to `types/api.ts` - NEW FILE):
- `GameStateResponse` (lines 112-114) - rename to `GameStateApiResponse`
- `GameResponse` (lines 116-118)
- `LegalActionsResponse` (lines 120-122)
- `ListGamesResponse` (lines 124-126)
- `PlayerGamesResponse` (lines 128-130)

### Keplr Types (keep in `types-legacy.ts` temporarily or move to dedicated file):
- `KeplrIntereactionOptions` (lines 51-53)
- `KeplrSignOptions` (lines 55-59)
- `CustomKeplr` (lines 60-64)
- Global Window augmentation (lines 50-68)

## 📂 Current File Usage

### Files importing from `types-legacy.ts`:
1. `IClient.ts` - imports Coin, CosmosConfig, AccountResponse, TxResponse, BlockResponse, GameState, Game, LegalAction
2. `cosmosClient.ts` - imports all of the above + COSMOS_CONSTANTS, GameStateResponse, GameResponse, ListGamesResponse
3. `signingClient.ts` - imports CosmosConfig

### Files importing from `types/`:
1. `index.ts` - exports everything from `types/game`, `types/rpc`, `types/chain`, `types/index`
2. `pokerSolver.ts` - imports Card, SUIT from `types/game`
3. `pokerGameIntegration.ts` - imports Card from `types/game`

## ✅ Recommended Refactoring Plan

### Step 1: Create `types/api.ts`
Move API response types from `types-legacy.ts`:
```typescript
export interface GameStateApiResponse {
  game_state: string; // JSON string
}
export interface GameResponse {
  game: string; // JSON string
}
// ... etc
```

### Step 2: Update `types/chain.ts`
Add missing chain types:
```typescript
export interface Coin {
  denom: string;
  amount: string;
}
export interface AccountResponse { ... }
export interface TxResponse { ... }
export interface BlockResponse { ... }
```

### Step 3: Update `types/index.ts`
Add COSMOS_CONSTANTS and CreateGameParams

### Step 4: Create `types/keplr.ts`
Move Keplr-specific types and global augmentation

### Step 5: Update all imports
- `IClient.ts` → import from `types/chain` and `types/index`
- `cosmosClient.ts` → import from `types/chain`, `types/api`, `types/index`
- `signingClient.ts` → import from `types/index`

### Step 6: Delete `types-legacy.ts`

## 📈 Benefits

1. ✨ **Better Organization**: Types grouped by purpose
2. 🎯 **Type Safety**: Remove loose `[key: string]: any` types
3. 📦 **Smaller Bundles**: Better tree-shaking
4. 🔧 **Maintainability**: Clear separation of concerns
5. 🚀 **Developer Experience**: Easier to find types

## ⚠️ Risk Assessment

**LOW RISK** - Only 3 files import from `types-legacy.ts`, all internal to the SDK.

