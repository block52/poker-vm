# Block52 Poker Desktop

Electron-based desktop application for Block52 Poker.

## Overview

This desktop app wraps the web UI (`/ui`) in an Electron shell, providing a native desktop experience with:
- Native window management
- Application menus
- Keyboard shortcuts
- Cross-platform builds (macOS, Windows, Linux)

## Quick Start

### Prerequisites
- Node.js 20+
- Yarn

### Development

1. **Build and run the desktop app:**
   ```bash
   cd desktop
   ./scripts/build.sh
   yarn start:dev
   ```

2. **Or run with existing UI build:**
   ```bash
   cd desktop
   ./scripts/build.sh --skip-ui
   yarn start:dev
   ```

### Building for Distribution

```bash
# Build for macOS
./scripts/build.sh --mac

# Build for Windows
./scripts/build.sh --win

# Build for Linux
./scripts/build.sh --linux

# Build for all platforms
./scripts/build.sh --all
```

Build artifacts will be in the `dist/` directory.

## Project Structure

```
desktop/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # Context bridge for renderer
├── scripts/
│   └── build.sh         # Build script
├── assets/
│   ├── icons/           # App icons (icns, ico, png)
│   └── entitlements.mac.plist
├── app/                  # UI build (generated)
├── dist/                 # Distribution builds (generated)
├── package.json
├── electron-builder.yml
└── README.md
```

## How It Works

1. The build script (`scripts/build.sh`) runs `yarn build` in the `/ui` directory
2. The built UI files are copied to `/desktop/app`
3. Electron loads the UI from the local files
4. electron-builder packages everything for distribution

## Icons

Place your app icons in `assets/icons/`:
- `icon.icns` - macOS (required for mac builds)
- `icon.ico` - Windows (required for win builds)
- `icon.png` - Linux (512x512 recommended)

Generate icons from a single PNG using [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder):
```bash
npx electron-icon-builder --input=icon.png --output=./assets/icons/
```

## Router Configuration

The UI uses `HashRouter` for Electron compatibility. This ensures that navigation works correctly when loading from local files.

## Native Features

### Application Menu
- **Wallet**: Import/Export keys, Settings
- **Game**: Quick Play, Join Table, Game History
- **View**: Reload, Fullscreen, DevTools
- **Help**: How to Play, Shortcuts, About

### Electron API
The preload script exposes `window.electronAPI` with:
- `getAppInfo()` - Get app name, version, platform
- `minimize()`, `maximize()`, `close()` - Window controls
- `onMenuEvent(callback)` - Listen for menu events
- `isElectron` - Check if running in Electron

## Development Notes

- The UI codebase remains unchanged - it's the single source of truth
- Desktop-specific features are handled in Electron's main process
- Use `window.electronAPI?.isElectron` to detect desktop environment in the UI
