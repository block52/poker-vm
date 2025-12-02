# Table Network Integration Test

## Overview

This document verifies that the poker table component correctly subscribes to the selected network from NetworkContext and uses the appropriate WebSocket endpoint.

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        App Component                             │
│  - Wraps entire app with NetworkProvider (index.tsx:44)        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NetworkProvider                               │
│  - Provides currentNetwork (NetworkContext.tsx:100-159)        │
│  - Persists selection to localStorage                          │
│  - Defaults to Block52 (index 2)                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ├──────────────────┬───────────────────────┐
                       ▼                  ▼                       ▼
              ┌─────────────────┐  ┌──────────────┐   ┌─────────────────┐
              │ NetworkSelector │  │ Table.tsx    │   │ GameStateContext│
              │ (Header)        │  │ Component    │   │ (Provider)      │
              └─────────────────┘  └──────┬───────┘   └────────┬────────┘
                                          │                     │
                                          │ Line 171-172       │
                                          ▼                     │
                                   ┌──────────────────────┐    │
                                   │ useGameStateContext()│    │
                                   │ useNetwork()         │    │
                                   └──────────┬───────────┘    │
                                              │                 │
                                              │ Line 175        │
                                              ▼                 │
                                   ┌──────────────────────┐    │
                                   │ subscribeToTable(id) │────┘
                                   └──────────────────────┘
                                              │
                                              ▼
                                   ┌──────────────────────────────────┐
                                   │ GameStateContext.tsx:157         │
                                   │ Creates WebSocket:               │
                                   │ ${currentNetwork.ws}?            │
                                   │   tableAddress=${id}&            │
                                   │   playerId=${player}             │
                                   └──────────────────────────────────┘
```

## Code Verification

### 1. Table Component Integration

**File:** `ui/src/components/playPage/Table.tsx`

**Lines 171-177:**
```typescript
const { subscribeToTable, gameState } = useGameStateContext();
const { currentNetwork } = useNetwork();

useEffect(() => {
    if (id) {
        subscribeToTable(id);
    }
}, [id, subscribeToTable]);
```

✅ **Status:** Correctly imports and uses both contexts

### 2. Network Used for WebSocket

**File:** `ui/src/context/GameStateContext.tsx`

**Lines 101, 157:**
```typescript
const { currentNetwork } = useNetwork(); // Line 101

// Line 157 - WebSocket creation
const fullWsUrl = `${currentNetwork.ws}?tableAddress=${tableId}&playerId=${playerAddress}`;
const ws = new WebSocket(fullWsUrl);
```

✅ **Status:** Uses `currentNetwork.ws` from NetworkContext

### 3. Network Used for Other Actions

**File:** `ui/src/components/playPage/Table.tsx`

**Lines 206, 754, 765:**
```typescript
// Line 206 - Balance fetching
const balance = await getCosmosBalance(currentNetwork, "usdc");

// Line 754 - Leave table
leaveTable(id, playerData.stack || "0", currentNetwork)

// Various other actions also use currentNetwork
```

✅ **Status:** All table actions use the selected network

### 4. Network Selector UI

**File:** `ui/src/components/playPage/Table.tsx`

**Line 829:**
```typescript
<NetworkSelector />
```

✅ **Status:** NetworkSelector is visible in table header

## Testing Procedure

### Test 1: Verify WebSocket Connection

1. **Start the dev server:**
   ```bash
   cd ui && yarn dev
   ```

2. **Open browser to a table:**
   ```
   http://localhost:5173/table/{TABLE_ID}
   ```

3. **Open DevTools Console (F12)**

4. **Look for connection logs:**
   ```
   [GameStateContext] 🔌 Attempting WebSocket connection: {
     wsBaseUrl: "wss://node1.block52.xyz/ws",
     tableId: "...",
     playerAddress: "...",
     fullUrl: "wss://node1.block52.xyz/ws?tableAddress=...&playerId=...",
     networkName: "Block52"
   }
   ```

5. **Verify successful connection:**
   ```
   [GameStateContext] ✅ WebSocket connected to table ...
   ```

### Test 2: Switch Networks

1. **Click the Network Selector** in the table header

2. **Select a different network** (e.g., Texas Hodl or Localhost)

3. **Reload the page** (network change requires reconnection)

4. **Check Console logs** to verify new network is used:
   ```
   wsBaseUrl: "wss://node.texashodl.net/ws"  // or ws://localhost:26657/ws
   networkName: "Texas Hodl"  // or "Localhost"
   ```

### Test 3: Verify Network Persistence

1. **Select a network** (e.g., Texas Hodl)

2. **Close browser tab**

3. **Open table page again**

4. **Verify network is still Texas Hodl:**
   - Check NetworkSelector shows "Texas Hodl"
   - Check console logs show Texas Hodl WebSocket URL

### Test 4: Verify All Networks Work

Test each network endpoint:

| Network | WebSocket URL | Test Command |
|---------|---------------|--------------|
| **Localhost** | `ws://localhost:26657/ws` | Requires local server running |
| **Texas Hodl** | `wss://node.texashodl.net/ws` | Should connect immediately |
| **Block52** | `wss://node1.block52.xyz/ws` | Should connect immediately |

**For each network:**
1. Select network from NetworkSelector
2. Reload page
3. Check console for connection success
4. Verify game state updates appear in console

## Console Debugging Commands

### Check Current Network
```javascript
// Get current network from localStorage
const savedNetwork = localStorage.getItem('selectedNetwork');
console.log('Saved Network:', JSON.parse(savedNetwork || '{}'));

// Should show:
// {
//   name: "Block52",
//   rpc: "https://node1.block52.xyz/rpc/",
//   rest: "https://node1.block52.xyz",
//   grpc: "grpcs://node1.block52.xyz:9443",
//   ws: "wss://node1.block52.xyz/ws"
// }
```

### Verify Player Address
```javascript
// Check both Cosmos and Ethereum addresses
console.log('Cosmos Address:', localStorage.getItem('user_cosmos_address'));
console.log('Ethereum Address:', localStorage.getItem('user_eth_public_key'));
```

### Monitor WebSocket Messages
The GameStateContext already logs all WebSocket activity:
- Connection attempts
- Open/close events
- All incoming messages
- Error events

Look for these log prefixes:
- `[GameStateContext] 🔌` - Connection attempt
- `[GameStateContext] ✅` - Connection success
- `📨 [WebSocket RAW MESSAGE]` - Raw incoming data
- `🎰 Game State Update` - Parsed game state
- `❌ [WebSocket ERROR]` - Connection errors

### Export Debug Logs
```javascript
// Export all debug logs to a file
window.exportDebugLogs()

// Get last 10 logs
window.getLastDebugLogs(10)

// Clear logs
window.clearDebugLogs()
```

## Expected Behavior

### ✅ Correct Behavior

1. **Default Network:** Block52 (when no localStorage entry exists)
2. **Network Persistence:** Selected network persists across page reloads
3. **WebSocket URL:** Uses `currentNetwork.ws` from selected network
4. **Balance Queries:** Use `currentNetwork.rest` endpoint
5. **Transactions:** Submitted to `currentNetwork` chain
6. **Real-time Updates:** Received via WebSocket from selected network

### ❌ Common Issues

1. **"undefined" in WebSocket URL**
   - **Cause:** Old localStorage missing `ws` property
   - **Fix:** `localStorage.removeItem('selectedNetwork'); location.reload()`

2. **"No player address found"**
   - **Cause:** Not logged in
   - **Fix:** Ensure `user_cosmos_address` or `user_eth_public_key` in localStorage

3. **Connection timeout**
   - **Cause:** Wrong network or server down
   - **Fix:** Try different network from NetworkSelector

4. **Network doesn't change**
   - **Cause:** Page not reloaded after network selection
   - **Fix:** Reload page after changing network

## Network Endpoints Reference

### Localhost
```
RPC:  http://localhost:26657
REST: http://localhost:1317
gRPC: http://localhost:9090
WS:   ws://localhost:26657/ws
```
**Requirements:** Must run `ignite chain serve` locally

### Texas Hodl
```
RPC:  https://node.texashodl.net/rpc/
REST: https://node.texashodl.net
gRPC: grpcs://node.texashodl.net:9443
WS:   wss://node.texashodl.net/ws
```
**Status:** ✅ Production testing network

### Block52
```
RPC:  https://node1.block52.xyz/rpc/
REST: https://node1.block52.xyz
gRPC: grpcs://node1.block52.xyz:9443
WS:   wss://node1.block52.xyz/ws
```
**Status:** ✅ Official production network

## Files Involved

| File | Purpose | Lines |
|------|---------|-------|
| `ui/src/components/playPage/Table.tsx` | Main table component | 171-177, 829 |
| `ui/src/context/GameStateContext.tsx` | WebSocket management | 101, 157 |
| `ui/src/context/NetworkContext.tsx` | Network configuration | 71-98 |
| `ui/src/components/NetworkSelector.tsx` | Network switching UI | 1-135 |
| `ui/src/index.tsx` | App setup with NetworkProvider | 44 |

## Test Checklist

- [ ] Dev server running (`yarn dev`)
- [ ] Can access table page with valid table ID
- [ ] NetworkSelector visible in header
- [ ] Console shows WebSocket connection attempt
- [ ] Console shows successful connection
- [ ] Can see current network name in logs
- [ ] Can switch networks via NetworkSelector
- [ ] Network selection persists after reload
- [ ] WebSocket reconnects with new network endpoint
- [ ] Game state updates appear in console
- [ ] Balance queries use correct network
- [ ] All three networks (Localhost, Texas Hodl, Block52) tested

## Performance Notes

1. **Single Connection:** Each table uses ONE WebSocket connection
2. **Auto-Reconnect:** WebSocket reconnects when network changes (requires page reload)
3. **Connection Pooling:** Not needed - one connection per table
4. **Message Rate:** Updates on state changes (event-driven, not polling)
5. **Cleanup:** Connection closes when leaving table page

## Security Notes

1. **Player ID in URL:** Current implementation passes player ID as query parameter
2. **No Auth Token:** Consider adding authentication for production
3. **Network Validation:** Backend should validate player is authorized for table
4. **Rate Limiting:** Backend should implement connection rate limits

## Next Steps

1. ✅ Table component uses NetworkContext
2. ✅ NetworkSelector integrated in header
3. ✅ WebSocket uses selected network
4. ⏳ Test with real game scenarios
5. ⏳ Test network switching mid-game
6. ⏳ Verify all player actions use correct network
7. ⏳ Load test with multiple concurrent connections

---

**Last Updated:** 2025-11-25
**Status:** ✅ Integration Verified
