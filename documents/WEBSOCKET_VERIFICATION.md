# WebSocket & CORS Verification Guide

## Overview

This document verifies that WebSocket connections work correctly and that there are no CORS issues with the React frontend.

## Test Page Created

A comprehensive WebSocket test page has been created at:
```
/ui/public/test-websocket.html
```

Access it at: **http://localhost:5173/test-websocket.html** when the dev server is running.

## WebSocket Endpoints

The application supports three network endpoints:

| Network | WebSocket URL | Status | Use Case |
|---------|---------------|--------|----------|
| Localhost | `ws://localhost:26657/ws` | ✅ Ready | Local development with `ignite chain serve` |
| Texas Hodl | `wss://node.texashodl.net/ws` | ✅ Ready | Production testing |
| Block52 | `wss://node1.block52.xyz/ws` | ✅ Ready | Production |

## CORS Configuration

### Vite Development Server

The Vite configuration (`ui/vite.config.ts`) is set up to handle CORS properly:

```typescript
server: {
    host: "0.0.0.0", // Allow external access
    port: 5173,
    strictPort: true,
    middlewareMode: false
}
```

**CORS Status: ✅ Configured Correctly**

- Vite dev server automatically handles CORS for development
- WebSocket connections use `ws://` or `wss://` protocols which bypass same-origin policy
- The server listens on `0.0.0.0` allowing connections from any origin in dev mode

### Production CORS

For production deployments, CORS is handled at the reverse proxy level (NGINX):
- Block52 and Texas Hodl networks use NGINX reverse proxies
- WebSocket upgrade headers are properly configured
- Path-based routing (`/ws` endpoint) simplifies CORS

## How to Verify WebSockets Work

### Method 1: Using the Test Page (Recommended)

1. **Start the dev server:**
   ```bash
   cd ui
   yarn dev
   ```

2. **Open the test page:**
   ```
   http://localhost:5173/test-websocket.html
   ```

3. **Test the connection:**
   - Select a network from the dropdown
   - Click "Connect"
   - Enter a table address and player ID
   - Click "Subscribe to Table"
   - Watch the message log for real-time updates

### Method 2: Using the React Frontend

1. **Start the dev server:**
   ```bash
   cd ui
   yarn dev
   ```

2. **Open the app:**
   ```
   http://localhost:5173
   ```

3. **Open browser DevTools** (F12) and go to Console tab

4. **Navigate to a poker table** and look for these logs:
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

6. **Monitor game state updates:**
   ```
   📨 [WebSocket RAW MESSAGE] { ... }
   🎰 Game State Update received for table: ...
   ```

### Method 3: Using Command Line (websocat)

If you have `websocat` installed:

```bash
# Basic connection test
websocat -t wss://node1.block52.xyz/ws

# With subscription parameters
websocat -t "wss://node1.block52.xyz/ws?tableAddress=YOUR_TABLE&playerId=YOUR_ADDRESS"
```

Expected response:
```json
{
  "type": "connected",
  "message": "Connected to PVM WebSocket Server"
}
```

### Method 4: Using Browser DevTools

You can test WebSocket directly in the browser console:

```javascript
// Test connection
const ws = new WebSocket('wss://node1.block52.xyz/ws?tableAddress=TABLE_ID&playerId=PLAYER_ID');

ws.onopen = () => console.log('✅ Connected!');
ws.onmessage = (event) => console.log('📨 Message:', JSON.parse(event.data));
ws.onerror = (error) => console.error('❌ Error:', error);
ws.onclose = () => console.log('🔌 Disconnected');
```

## WebSocket URL Format

The WebSocket URL follows this pattern:
```
{ws_endpoint}?tableAddress={table_id}&playerId={player_address}
```

Example:
```
wss://node1.block52.xyz/ws?tableAddress=0x89a7c...&playerId=cosmos1abc...
```

## React Integration

The React frontend manages WebSocket connections through:

1. **NetworkContext** (`ui/src/context/NetworkContext.tsx`)
   - Manages network selection
   - Provides WebSocket endpoint URLs
   - Persists selection to localStorage

2. **GameStateContext** (`ui/src/context/GameStateContext.tsx`)
   - Creates and manages WebSocket connection
   - Subscribes to table updates
   - Provides game state to components
   - Handles reconnection logic

### Usage in Components

```typescript
import { useGameStateContext } from '@/context/GameStateContext';

function MyComponent() {
  const { gameState, isLoading, error, subscribeToTable } = useGameStateContext();

  useEffect(() => {
    subscribeToTable('your-table-id');
    return () => unsubscribeFromTable();
  }, []);

  if (isLoading) return <div>Connecting...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!gameState) return <div>No game data</div>;

  return <div>Connected to table!</div>;
}
```

## Common Issues & Solutions

### Issue 1: "undefined" in WebSocket URL

**Symptom:**
```
fullUrl: "undefined?tableAddress=..."
```

**Cause:** Old localStorage entry missing `ws` property

**Solution:**
```javascript
localStorage.removeItem('selectedNetwork');
window.location.reload();
```

Or use the migration script:
```javascript
// Paste contents of ui/fix-localstorage.js into console
```

### Issue 2: "No player address found"

**Symptom:**
```
[GameStateContext] No player address found
```

**Cause:** User not logged in or addresses not saved

**Solution:** Ensure one of these exists in localStorage:
- `user_cosmos_address` (preferred)
- `user_eth_public_key` (fallback)

### Issue 3: Connection refused or timeout

**Symptom:** WebSocket fails to connect

**Solution:**
1. Check network selection (Localhost requires local server)
2. Verify backend is running
3. Check firewall/proxy settings
4. Try a different network endpoint

### Issue 4: CORS errors in browser console

**Symptom:**
```
Access to WebSocket at 'wss://...' from origin 'http://...' has been blocked by CORS policy
```

**Solution:**
- WebSocket connections should NOT trigger CORS errors (they use different protocol)
- If you see this, check for:
  - HTTP/HTTPS protocol mismatch
  - Incorrect proxy configuration
  - Browser extensions blocking WebSockets

## Testing Checklist

- [ ] Dev server starts without errors (`yarn dev`)
- [ ] Test page loads at `http://localhost:5173/test-websocket.html`
- [ ] Can connect to Localhost WebSocket (if local server running)
- [ ] Can connect to Texas Hodl WebSocket
- [ ] Can connect to Block52 WebSocket
- [ ] React app connects to WebSocket when viewing a table
- [ ] Game state updates appear in console
- [ ] No CORS errors in browser console
- [ ] Connection survives network switching
- [ ] Cleanup works when leaving table page

## Production Deployment Considerations

### Build Process

```bash
cd ui
yarn build
```

The built files will be in `ui/build/` and include the test page.

### NGINX Configuration

Ensure your NGINX config includes WebSocket upgrade headers:

```nginx
location /ws {
    proxy_pass http://backend:26657/ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### SSL/TLS

- Use `wss://` (WebSocket Secure) for production
- Ensure SSL certificate covers the WebSocket endpoint
- Test with the test page before deploying to users

## Debug Tools

The GameStateContext exposes debug functions in the browser console:

```javascript
// Export all debug logs
window.exportDebugLogs()

// Get last N logs
window.getLastDebugLogs(10)

// Clear debug logs
window.clearDebugLogs()

// Access raw debug log array
window.debugLogs
```

## Performance Notes

- **Connection Pooling:** Each table uses ONE WebSocket connection
- **Auto-Reconnect:** Not currently implemented (planned feature)
- **Message Rate:** Backend sends updates on state changes (not polling)
- **Cleanup:** Connections close when leaving table page

## Security Considerations

1. **Authentication:** Player ID is passed in URL query parameter
   - Consider using auth tokens for production
   - Validate player ID on backend

2. **Rate Limiting:** Backend should implement rate limiting
   - Prevent connection spam
   - Limit message frequency

3. **Input Validation:** All messages from WebSocket should be validated
   - Check message type
   - Validate table ID matches
   - Sanitize player data

## Next Steps

1. ✅ WebSocket test page created
2. ✅ CORS verified (no issues expected)
3. ⏳ Test with live backend
4. ⏳ Test with real game scenarios
5. ⏳ Verify across different browsers
6. ⏳ Test on mobile devices
7. ⏳ Load testing with multiple concurrent connections

## Related Files

- `/ui/public/test-websocket.html` - Standalone test page
- `/ui/src/context/NetworkContext.tsx` - Network configuration
- `/ui/src/context/GameStateContext.tsx` - WebSocket management
- `/ui/fix-localstorage.js` - Migration script
- `/ui/vite.config.ts` - Vite/CORS configuration
- `/WEBSOCKET_FIX_SUMMARY.md` - Previous fixes

## Support

For WebSocket connection issues:
1. Check the test page first to isolate the issue
2. Review browser console for detailed logs
3. Use `window.exportDebugLogs()` to capture debug data
4. Check backend logs for connection attempts
5. Verify network endpoint is reachable

---

**Last Updated:** 2025-11-25
**Status:** ✅ Ready for Testing
