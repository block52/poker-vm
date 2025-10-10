# Player Timeout Management System

This document explains the implementation of the automatic player timeout system in the poker frontend.

## Overview

The system automatically handles player timeouts by:

1. **Monitoring all players** for timeout violations
2. **Auto-folding** players who fail to act within the time limit
3. **Auto-sitting out** players who repeatedly timeout
4. **Providing visual feedback** in development mode

## Components

### 1. `usePlayerTimeoutManager` Hook

**Location**: `/ui/src/hooks/usePlayerTimeoutManager.ts`

**Purpose**: Monitors all players and automatically performs timeout actions.

**Key Features**:

-   Tracks timeout counts per player address
-   Differentiates between current user and other players
-   Implements progressive penalties (fold → sit out)
-   Prevents duplicate actions for the same turn
-   Respects existing `usePlayerTimer` for current user

**Configuration**:

```typescript
const TIMEOUT_DURATION = gameOptions?.timeout || 30000; // 30 seconds default
const MAX_TIMEOUTS_BEFORE_SITOUT = 3; // Sit out after 3 consecutive timeouts
```

**Timeout Actions**:

-   **Auto-check**: Handled by existing `usePlayerTimer` for current user
-   **Auto-fold**: Applied to other players who can only fold (no check option)
-   **Auto-sit out**: Applied after 3 consecutive timeouts

### 2. `PlayerTimeoutDebug` Component

**Location**: `/ui/src/components/playPage/PlayerTimeoutDebug.tsx`

**Purpose**: Development-only visual feedback for timeout management.

**Features**:

-   Shows timeout manager status
-   Displays current next-to-act player
-   Lists timeout counts per player
-   Only visible when `VITE_NODE_ENV=development`

### 3. Integration with Table Component

**Location**: `/ui/src/components/playPage/Table.tsx`

**Integration**:

```typescript
// Import the timeout manager
import { usePlayerTimeoutManager } from "../../hooks/usePlayerTimeoutManager";
import { PlayerTimeoutDebug } from "./PlayerTimeoutDebug";

// Inside Table component
usePlayerTimeoutManager(id); // Activate timeout management
<PlayerTimeoutDebug tableId={id} />; // Debug display
```

## How It Works

### 1. Turn Detection

The system detects new turns by monitoring `gameState.previousActions` timestamps:

-   When a new action occurs, the timestamp changes
-   This triggers a reset of processed players for the new turn
-   Prevents duplicate timeout actions

### 2. Player Monitoring

Every 2 seconds, the system:

1. Gets the current player who should act (`gameState.nextToAct`)
2. Calculates elapsed time since last action
3. Checks if player has exceeded timeout duration
4. Skips current user (handled by `usePlayerTimer`)

### 3. Timeout Action Logic

```typescript
// Determine action based on timeout history and legal actions
if (currentTimeouts >= MAX_TIMEOUTS_BEFORE_SITOUT) {
    return "sitout"; // Too many timeouts - sit player out
}

if (canFold && !canCheck) {
    return "fold"; // Can only fold - auto-fold
}

return "skip"; // Let usePlayerTimer handle (current user with check option)
```

### 4. Action Execution

When a timeout occurs:

1. **Fold Action**: Calls `foldHand(tableId)` via SDK
2. **Sit Out Action**: Calls `sitOut(tableId)` via SDK
3. **Timeout Tracking**: Increments/resets timeout counts
4. **Logging**: Provides console feedback for debugging

## SDK Integration

The system uses existing SDK methods:

-   `foldHand(tableId)`: Auto-fold timed-out players
-   `sitOut(tableId)`: Auto-sit out repeat offenders

Both methods use the `client.playerAction()` method with appropriate action types:

-   `PlayerActionType.FOLD`
-   `PlayerActionType.SIT_OUT`

## Coordination with Existing Timer

The new system **complements** the existing `usePlayerTimer` hook:

-   **Current User**: `usePlayerTimer` handles auto-check/fold with time extensions
-   **Other Players**: `usePlayerTimeoutManager` handles auto-fold/sit-out
-   **No Conflicts**: System explicitly skips current user to avoid duplicate actions

## Testing and Debugging

### Development Mode

Set `VITE_NODE_ENV=development` to see:

-   Timeout manager status in bottom-right corner
-   Current next-to-act player information
-   Timeout counts per player
-   Console logs for timeout events

### Console Logging

The system provides detailed console output:

```
🔄 New turn detected, clearing processed players
⏱️ Player 0x1234 (seat 2): 25000ms elapsed, timeout at 30000ms
⏰ Player 0x1234 (seat 2) has timed out!
🎯 Timeout action for player: fold
⏰ Auto-folding player 0x1234... (seat 2) due to timeout
```

### Configuration Options

Adjust timeout behavior by modifying:

```typescript
// In usePlayerTimeoutManager.ts
const TIMEOUT_DURATION = gameOptions?.timeout || 30000; // Timeout duration
const MAX_TIMEOUTS_BEFORE_SITOUT = 3; // Tolerance before sit-out
```

## Error Handling

The system includes robust error handling:

-   **Failed Actions**: Logged but don't break the game
-   **Invalid Players**: Skipped safely
-   **Race Conditions**: Prevented with processing flags
-   **Duplicate Actions**: Avoided with turn-based tracking

## Performance Considerations

-   **Efficient Polling**: Only checks every 2 seconds
-   **Smart Filtering**: Only processes relevant players
-   **Memory Management**: Cleans up timeout counts for departed players
-   **Minimal Re-renders**: Uses refs and callbacks to avoid unnecessary updates

## Future Enhancements

Possible improvements:

1. **Configurable Penalties**: Allow different timeout thresholds per game type
2. **Warning System**: Give players advance warning before timeout
3. **Reconnection Handling**: Reset timeout counts on player reconnection
4. **Analytics**: Track timeout patterns for game balance
5. **Custom Actions**: Allow different timeout behaviors per game mode

## Usage

The timeout manager is automatically active when:

1. A table ID is provided
2. Game state contains active players
3. The system detects a player who should be acting

No additional configuration or manual activation is required - simply include the hook in your Table component and it handles the rest automatically.
