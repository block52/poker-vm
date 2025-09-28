# Block52 Poker VM Desktop

A desktop client for the Block52 Poker Virtual Machine, built with Electron.

## Features

-   Full poker game interface using the existing web UI
-   Native desktop menus and controls
-   Quick game access
-   Tournament support
-   Bot management tools
-   Game statistics and history

## Development

### Prerequisites

-   Node.js (v18 or higher)
-   Yarn package manager

### Setup

1. Install dependencies:

    ```bash
    yarn install
    ```

2. Start the UI development server (in the `../ui` directory):

    ```bash
    cd ../ui
    yarn dev
    ```

3. Start the Electron app in development mode:
    ```bash
    yarn dev
    ```

### Production

1. Build the UI:

    ```bash
    yarn build-ui
    ```

2. Start the Electron app:
    ```bash
    yarn start
    ```

## Menu Structure

### File Menu

-   **New Game** (Cmd/Ctrl+N) - Start a new poker game
-   **Join Game** (Cmd/Ctrl+J) - Join an existing game
-   **Settings** (Cmd/Ctrl+,) - Open application settings
-   **Quit** (Cmd/Ctrl+Q) - Exit the application

### Game Menu

-   **Quick Play** (Cmd/Ctrl+Q) - Jump into a quick game
-   **Tournament** (Cmd/Ctrl+T) - Join or create tournaments
-   **Game History** - View past games
-   **Statistics** - View game statistics

### Tools Menu

-   **Bot Manager** - Manage poker bots
-   **Hand Analyzer** - Analyze poker hands
-   **Developer Tools** (Cmd/Ctrl+Shift+I) - Open developer console

### Help Menu

-   **How to Play** - Game instructions
-   **Keyboard Shortcuts** - List of shortcuts
-   **About** - Application information

## Architecture

The desktop app is a wrapper around the existing web-based poker UI (`../ui`). In development mode, it connects to the Vite dev server running on port 5173. In production, it serves the built static files.

## Security

-   Node integration is disabled
-   Context isolation is enabled
-   Remote module is disabled
-   Web security is enabled
-   New window creation is blocked
