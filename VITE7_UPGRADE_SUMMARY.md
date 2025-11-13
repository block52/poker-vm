# Vite 7 Upgrade Summary

## Overview

Successfully upgraded the UI project from Vite 6.0.5 to Vite 7.2.2, resolving import resolution issues and ensuring compatibility with the locally-linked SDK package.

## Changes Made

### 1. Updated Dependencies

-   **vite**: `6.0.5` → `7.2.2`
-   **@vitejs/plugin-react**: `4.3.2` → `5.1.1`

Also updated as peer dependencies:

-   `@babel/core`: `7.28.5`
-   `react-refresh`: `0.18.0`

### 2. SDK Package Linking

Added the SDK as a local dependency using Yarn's link protocol:

```bash
yarn add link:../sdk
```

This ensures proper module resolution in Vite 7, which is stricter about path resolution than Vite 6.

### 3. Vite Configuration Updates (`vite.config.ts`)

#### Before:

```typescript
resolve: {
    alias: {
        "@bitcoinbrisbane/block52": "../sdk/dist/index.esm.js",  // Relative path
        crypto: "crypto-browserify",
        // ... other aliases as string references
    },
},
```

#### After:

```typescript
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

resolve: {
    alias: {
        // Removed SDK alias - now resolved via package linking
        crypto: path.resolve(__dirname, "node_modules/crypto-browserify"),
        stream: path.resolve(__dirname, "node_modules/stream-browserify"),
        buffer: path.resolve(__dirname, "node_modules/buffer"),
        process: path.resolve(__dirname, "node_modules/process/browser.js"),
        util: path.resolve(__dirname, "node_modules/util"),
        events: path.resolve(__dirname, "node_modules/events"),
    },
    dedupe: ["@cosmjs/stargate", "@cosmjs/proto-signing", "ethers"],
},
```

**Key Changes:**

-   Removed hardcoded SDK alias (now uses package resolution)
-   Changed polyfill aliases from string names to absolute paths
-   Added explicit `__dirname` resolution for ESM compatibility
-   Added `dedupe` for Cosmos dependencies to prevent version conflicts

### 4. Removed Obsolete Type Workarounds

Removed `@ts-expect-error` comments that were no longer needed after proper SDK linking:

-   `src/pages/BridgeAdminDashboard.tsx` (line ~198)
-   `src/pages/ManualBridgeTrigger.tsx` (line ~75)
-   `src/pages/explorer/DistributionPage.tsx` (lines ~58, ~64)

### 5. Package.json Cleanup

Removed workspace-related fields that were causing warnings:

-   Removed `overrides` field (npm-specific)
-   Removed `pnpm.overrides` field (pnpm-specific)
-   Kept `resolutions` field (Yarn-specific)

## Why These Changes Were Necessary

### Vite 7 Behavior Changes

1. **Stricter Path Resolution**: Vite 7 requires more explicit module resolution. Relative paths in aliases don't work reliably.
2. **ESM-First**: Vite 7 is more strictly ESM-oriented, requiring proper `__dirname` handling.
3. **Polyfill Resolution**: Browser polyfills need absolute paths to resolve correctly when imported by external packages.

### SDK Import Resolution

The SDK's built output (`dist/index.esm.js`) imports Node.js builtins (`crypto`, `events`) that need browser polyfills. Vite 7 requires these to be resolvable as actual packages, not just string aliases.

## Verification

### Build Success

```bash
cd ui
yarn build
# ✓ built in 35.44s
# Done in 43.40s.
```

### Dev Server Success

```bash
cd ui
yarn dev
# VITE v7.2.2 ready in 318 ms
# ➜  Local:   http://localhost:5173/
```

### Known Warnings

-   **Workspace warnings** during `yarn install`: These appear because we use `link:../sdk` without a full Yarn workspace setup. They're harmless and can be ignored.
-   **Large chunk warnings**: The main bundle is >500KB. Consider code-splitting in the future.

## Benefits

1. **Latest Vite Features**: Access to Vite 7's performance improvements and bug fixes
2. **Better Module Resolution**: More reliable SDK import resolution
3. **Type Safety**: SDK types now work properly without workarounds
4. **Build Reliability**: Explicit paths prevent resolution ambiguities

## Potential Issues & Mitigation

### Issue: Workspace Warnings

**Cause**: Using `link:../sdk` without Yarn workspace configuration  
**Mitigation**: Warnings are harmless. To eliminate them, either:

-   Convert to a proper Yarn workspace
-   Or accept the warnings as non-blocking

### Issue: Large Bundle Size

**Cause**: SDK includes Cosmos libraries (~6.5MB bundle)  
**Mitigation**: Consider:

-   Dynamic imports for rarely-used features
-   Manual chunk splitting in `rollupOptions.output.manualChunks`

## Related Files Modified

-   `/ui/vite.config.ts` - Updated resolve configuration
-   `/ui/package.json` - Updated dependencies, added SDK link
-   `/ui/src/pages/BridgeAdminDashboard.tsx` - Removed type workaround
-   `/ui/src/pages/ManualBridgeTrigger.tsx` - Removed type workaround
-   `/ui/src/pages/explorer/DistributionPage.tsx` - Removed type workarounds

## Commands Used

```bash
# Upgrade Vite and React plugin
cd ui
yarn upgrade vite@latest @vitejs/plugin-react@latest

# Link SDK package
yarn add link:../sdk

# Test build
yarn build

# Test dev server
yarn dev
```

## Conclusion

The Vite 7 upgrade is complete and stable. Both development and production builds work correctly with proper SDK integration. The explicit path resolution in the Vite config ensures compatibility with Vite 7's stricter module resolution while maintaining all existing functionality.
