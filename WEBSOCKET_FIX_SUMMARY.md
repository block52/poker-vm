# WebSocket Connection Fix Summary

## Issues Fixed

### 1. **Undefined WebSocket URL (currentNetwork.ws = undefined)**

-   **Problem**: Old localStorage entries from before the `ws` property was added don't have the WebSocket endpoint
-   **Impact**: WebSocket connection attempts with `undefined?tableAddress=...` URL
-   **Fix**:
    -   Added validation in NetworkProvider to detect missing `ws` property and reset to default
    -   Added validation in GameStateContext to check for missing `ws` before creating WebSocket
    -   Created migration script (`ui/fix-localstorage.js`) to clear old localStorage entries
-   **How to Fix**:
    ```javascript
    // Run in browser console:
    localStorage.removeItem("selectedNetwork");
    window.location.reload();
    ```
    Or paste the contents of `ui/fix-localstorage.js` into the console.

### 2. **Critical React Hook Error in GameStateContext.tsx**

-   **Problem**: `useNetwork()` hook was being called inside the `debugLog()` function, which is not a React component or hook
-   **Impact**: This violates React Hook rules and would cause runtime errors
-   **Fix**: Removed the invalid `useNetwork()` call from the debugLog function (line 48)

### 3. **Missing React Hook Dependencies**

-   **Problem**: `useCallback` for `subscribeToTable` was missing `currentNetwork` dependency
-   **Impact**: Could cause stale closures and WebSocket connections to wrong endpoints
-   **Fix**: Added `currentNetwork` (the entire object) to the dependency array

### 4. **Double NetworkProvider Nesting**

-   **Problem**: `NetworkProvider` was wrapped twice:
    -   Once in `index.tsx` (line 44)
    -   Again in `App.tsx` (line 109)
-   **Impact**: Could cause context confusion and incorrect network values
-   **Fix**: Removed the duplicate `NetworkProvider` from `App.tsx`, keeping only the one in `index.tsx`

### 5. **Enhanced WebSocket Connection Debugging**

-   Added detailed console logging for WebSocket connection attempts
-   Logs include: base URL, table ID, player address, full URL, network name
-   Connection success/failure is now clearly visible in console

## Testing the WebSocket Connection

### Method 1: Using websocat (CLI)

```bash
# Basic connection test
websocat -t wss://node1.block52.xyz/ws

# With table and player parameters
websocat -t "wss://node1.block52.xyz/ws?tableAddress=YOUR_TABLE_ID&playerId=YOUR_PLAYER_ADDRESS"
```

Expected output:

```json
{ "type": "connected", "message": "Connected to PVM WebSocket Server" }
```

### Method 2: Using the HTML Test Page

1. Open `/home/lucascullen/GitHub/block52/poker-vm/ui/test-websocket.html` in a browser
2. Enter the WebSocket URL: `wss://node1.block52.xyz/ws`
3. Enter your table address and player address (optional)
4. Click "Connect"
5. Watch the logs for connection status and messages

### Method 3: Using Browser DevTools Console

Open the UI in a browser and check the console for:

```
[GameStateContext] 🔌 Attempting WebSocket connection: {
  wsBaseUrl: "wss://node1.block52.xyz/ws",
  tableId: "...",
  playerAddress: "...",
  fullUrl: "wss://node1.block52.xyz/ws?tableAddress=...&playerId=...",
  networkName: "Block52"
}
```

Then look for:

```
[GameStateContext] ✅ WebSocket connected to table ...
```

## Network Configuration

The WebSocket endpoints are configured in `ui/src/context/NetworkContext.tsx`:

```typescript
export const NETWORK_PRESETS: NetworkEndpoints[] = [
    {
        name: "Localhost",
        ws: "ws://localhost:26657/ws" // For local development
    },
    {
        name: "Texas Hodl",
        ws: "wss://texashodl.net/ws" // Production testing
    },
    {
        name: "Block52",
        ws: "wss://node1.block52.xyz/ws" // Production
    }
];
```

## Debugging Commands

### Check Current Network Selection

Open browser console and run:

```javascript
// Get the current network from context
window.localStorage.getItem("selectedNetworkIndex");

// Should be 0 (Localhost), 1 (Texas Hodl), or 2 (Block52)
```

### Check Player Address

```javascript
// Cosmos address (preferred)
localStorage.getItem("user_cosmos_address");

// Ethereum address (fallback)
localStorage.getItem("user_eth_public_key");
```

### Monitor WebSocket State

The GameStateContext now logs detailed connection information:

-   Connection attempts with full URL
-   Open/close events
-   All incoming messages
-   Error events

## Quick Fix for "undefined" WebSocket URL

If you see `"fullUrl": "undefined?tableAddress=..."` in the console:

**Option 1: Browser Console (Fastest)**

```javascript
localStorage.removeItem("selectedNetwork");
window.location.reload();
```

**Option 2: Use Migration Script**

1. Open DevTools (F12)
2. Copy contents of `ui/fix-localstorage.js`
3. Paste into console and press Enter
4. Follow the prompts

**Option 3: Clear All Browser Data**

-   Open DevTools → Application → Storage → Clear site data

## Common Issues

### Issue: WebSocket URL shows "undefined"

**Solution**: Your localStorage has an old network configuration without the `ws` property.
Run: `localStorage.removeItem('selectedNetwork'); window.location.reload();`

### Issue: "No player address found"

**Solution**: Make sure you're logged in and have either:

-   `user_cosmos_address` in localStorage (preferred), or
-   `user_eth_public_key` in localStorage (fallback)

### Issue: WebSocket connects but no messages

**Solution**:

1. Verify the table ID is correct
2. Check that the player is actually seated at the table
3. Verify the backend is sending updates for that table

### Issue: Connection refused or timeout

**Solution**:

1. Check network selection (Localhost vs Production)
2. Verify the backend server is running
3. Check NGINX/proxy configuration if using production endpoints

## Files Modified

1. `/home/lucascullen/GitHub/block52/poker-vm/ui/src/context/GameStateContext.tsx`

    - Fixed React Hook violations
    - Added missing dependencies
    - Enhanced connection logging

2. `/home/lucascullen/GitHub/block52/poker-vm/ui/src/App.tsx`

    - Removed duplicate NetworkProvider

3. `/home/lucascullen/GitHub/block52/poker-vm/ui/src/context/NetworkContext.tsx`

    - Updated comments to document the `ws` property

4. `/home/lucascullen/GitHub/block52/poker-vm/ui/test-websocket.html` (NEW)
    - Standalone WebSocket testing tool

## Next Steps

1. **Start the UI dev server**: `cd ui && yarn dev`
2. **Open browser console** and watch for WebSocket logs
3. **Navigate to a table** and verify connection
4. **Check for errors** in the console
5. **Use the test page** if you need to isolate WebSocket issues from React

## Expected Behavior

When you navigate to a poker table page:

1. GameStateContext should log: "🔌 Attempting WebSocket connection"
2. Connection should open: "✅ WebSocket connected to table"
3. Initial game state should be received
4. Updates should come in real-time as game progresses
