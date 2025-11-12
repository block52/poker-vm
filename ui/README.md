# Poker-VM UI

This is the React-based frontend for the Poker Virtual Machine (PVM) project.

## Environment Variables

The following environment variables can be configured in your `.env` file:

### Core Configuration

-   **`VITE_NODE_ENV`** (optional)

    -   Environment mode for the application
    -   Values: `"development"` or `"production"`
    -   Default: `"production"`
    -   Used in: Enables development features like layout debug indicator and game results display

-   **`VITE_PROJECT_ID`** (required)

    -   WalletConnect project ID for wallet integration
    -   Default: `23ec57c1c95f3f54a97605975d4df7eb`
    -   Used in: Wallet connection initialization

-   **`VITE_NODE_RPC_URL`** (required)

    -   RPC endpoint URL for the poker node
    -   Default: `http://localhost:8545` (development) or `https://node1.block52.xyz/` (production)
    -   Used in: All RPC calls to the poker game server

-   **`VITE_NODE_WS_URL`** (required)
    -   WebSocket URL for real-time game state updates
    -   Default: `ws://localhost:8545` (development) or `wss://node1.block52.xyz` (production)
    -   Used in: Game state context for live updates

### Blockchain Integration

-   **`VITE_MAINNET_RPC_URL`** (required)

    -   Ethereum mainnet RPC URL
    -   Example: `https://mainnet.infura.io/v3/YOUR_API_KEY`
    -   Used in: QR deposit functionality

-   **`VITE_ALCHEMY_URL`** (required for bridge admin)

    -   Alchemy API endpoint for Base Chain (Layer 2)
    -   Example: `https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
    -   **How to get your API key:**
        1. Go to [https://www.alchemy.com/](https://www.alchemy.com/)
        2. Sign up for a free account
        3. Create a new app on "Base Mainnet"
        4. Copy the HTTPS endpoint URL
    -   Used in: Bridge Admin Dashboard (`/admin/bridge-dashboard`) to query deposit events from Base Chain bridge contract
    -   **Best practices:**
        -   Use the free tier for development (300M compute units/month)
        -   Never commit your API key to version control
        -   Use different API keys for development and production
        -   Enable "Base Mainnet" network when creating your Alchemy app
        -   Monitor usage in Alchemy dashboard to avoid rate limits
    -   **Error handling:** The Bridge Admin Dashboard will display a warning banner if this variable is not configured
    -   **Fallback:** Falls back to `VITE_MAINNET_RPC_URL` if not set, but this is not recommended for production

-   **`VITE_ETHERSCAN_API_KEY`** (optional)
    -   Etherscan API key for blockchain queries
    -   Used in: QR deposit functionality for transaction verification

### Cosmos/Pokerchain Integration

-   **`VITE_COSMOS_REST_URL`** (required for bridge)

    -   Cosmos SDK REST API endpoint (LCD endpoint)
    -   Development: `http://localhost:1317`
    -   Production: `https://block52.xyz`
    -   Used in: Bridge Admin Dashboard to query processed deposit status

-   **`VITE_COSMOS_RPC_URL`** (required for bridge)

    -   Cosmos Tendermint RPC endpoint
    -   Development: `http://localhost:26657`
    -   Production: `https://block52.xyz/rpc`
    -   Used in: Signing transactions on Pokerchain

-   **`VITE_COSMOS_GRPC_URL`** (optional)
    -   Cosmos gRPC endpoint
    -   Development: `http://localhost:9090`
    -   Production: `grpcs://block52.xyz:9443`
    -   Used in: Advanced blockchain queries

### Payment Integration

-   **`VITE_BTCPAY_SERVER_URL`** (optional)

    -   BTCPay Server URL for Bitcoin payment processing
    -   Used in: QR deposit functionality

-   **`VITE_BTCPAY_BASIC_AUTH`** (optional)
    -   Basic authentication credentials for BTCPay Server
    -   Format: `username:password` (base64 encoded)
    -   Used in: BTCPay Server API authentication

### Branding Customization

-   **`VITE_CLUB_NAME`** (optional)

    -   Name of your poker club
    -   Default: `"Block 52"`
    -   Used in: Table display and QR deposit page

-   **`VITE_CLUB_LOGO`** (optional)

    -   URL or path to your club's logo image
    -   Default: `/src/assets/YOUR_CLUB.png`
    -   Used in: Table display (center of poker table)
    -   Supports: External URLs (https://) or local paths

-   **`VITE_FAVICON_URL`** (optional)
    -   URL or path to your club's favicon
    -   Default: `/b52favicon.svg`
    -   Used in: Browser tab icon and bookmarks
    -   Supports: External URLs (https://) or local paths (relative to public directory)

### Color Customization

The UI supports extensive color theming through environment variables. All colors accept hex values (e.g., `#3b82f6`) or rgba values (e.g., `rgba(59,130,246,0.2)`).

#### Brand Colors

-   **`VITE_BRAND_COLOR_PRIMARY`** (optional)

    -   Primary brand color used throughout the UI
    -   Default: `#3b82f6` (blue)
    -   Used in: Buttons, links, highlights

-   **`VITE_BRAND_COLOR_SECONDARY`** (optional)
    -   Secondary brand color
    -   Default: `#1a2639` (dark navy)
    -   Used in: Headers, secondary elements

#### Table Background Colors

-   **`VITE_TABLE_BG_GRADIENT_START`** (optional)

    -   Header/navigation gradient start color
    -   Default: `#1a2639`

-   **`VITE_TABLE_BG_GRADIENT_MID`** (optional)

    -   Header/navigation gradient middle color
    -   Default: `#2a3f5f`

-   **`VITE_TABLE_BG_GRADIENT_END`** (optional)

    -   Header/navigation gradient end color
    -   Default: `#1a2639`

-   **`VITE_TABLE_BG_BASE`** (optional)

    -   Main background base color
    -   Default: `#111827` (dark gray)

-   **`VITE_TABLE_BORDER_COLOR`** (optional)
    -   Border color for table elements
    -   Default: `#3a546d`

#### Animation Colors

These colors are used in the animated gradient backgrounds:

-   **`VITE_ANIM_COLOR_1`** through **`VITE_ANIM_COLOR_5`** (optional)
    -   Animation gradient colors
    -   Defaults: `#3d59a1`, `#2a488f`, `#4263af`, `#1e346b`, `#324f97`

#### Accent Colors

-   **`VITE_ACCENT_COLOR_GLOW`** (optional)

    -   Glow effect color
    -   Default: `#64ffda` (cyan)
    -   Used in: Hover effects, glows

-   **`VITE_ACCENT_COLOR_SUCCESS`** (optional)

    -   Success state color
    -   Default: `#10b981` (green)
    -   Used in: Success messages, winning states

-   **`VITE_ACCENT_COLOR_DANGER`** (optional)
    -   Danger/error state color
    -   Default: `#ef4444` (red)
    -   Used in: Error messages, warnings

#### UI Element Colors

-   **`VITE_UI_BG_DARK`** (optional)

    -   Dark background for UI elements
    -   Default: `#1f2937` (gray-800)

-   **`VITE_UI_BG_MEDIUM`** (optional)

    -   Medium background for UI elements
    -   Default: `#374151` (gray-700)

-   **`VITE_UI_BORDER_COLOR`** (optional)
    -   Border color for UI elements
    -   Default: `rgba(59,130,246,0.2)` (blue with transparency)

### Testing Color Customization

To customize the color scheme of your poker room:

1. Copy the `.env.example` file to `.env` if you haven't already:

    ```bash
    cp .env.example .env
    ```

2. Edit the `.env` file and add your custom color values. For example, to create a red theme:

    ```env
    # Red theme example
    VITE_BRAND_COLOR_PRIMARY=#dc2626
    VITE_BRAND_COLOR_SECONDARY=#7f1d1d
    VITE_TABLE_BG_GRADIENT_START=#7f1d1d
    VITE_TABLE_BG_GRADIENT_MID=#991b1b
    VITE_TABLE_BG_GRADIENT_END=#7f1d1d
    VITE_ACCENT_COLOR_GLOW=#fbbf24
    ```

3. Restart your development server to apply the changes:
    ```bash
    yarn dev
    ```

The color changes will be visible throughout the application, including:

-   Dashboard backgrounds and gradients
-   Table page headers and backgrounds
-   Button colors and hover states
-   Animation effects

### Game Features

-   **`VITE_RANDOMISE_SEAT_SELECTION`** (optional)
    -   Enable/disable random seat selection when joining a table
    -   Values: `"true"` or `"false"`
    -   Default: `"false"`
    -   Used in: Join table functionality

### Development Features

#### Layout Debug Indicator

When `VITE_NODE_ENV="development"` is set in your `.env` file, a layout debug indicator appears on the poker table page. This helps developers understand which responsive layout is currently active.

The indicator displays:

-   **Current viewport mode**: One of `mobile-portrait`, `mobile-landscape`, `tablet`, or `desktop`
-   **Window dimensions**: Current width x height in pixels
-   **Orientation**: Whether the device is in landscape or portrait mode

This is particularly useful when:

-   Testing responsive layouts across different screen sizes
-   Debugging player positioning issues on different devices
-   Adjusting table layout configurations in `src/config/tableLayoutConfig.ts`

To enable the layout debug indicator:

1. Set `VITE_NODE_ENV="development"` in your `.env` file
2. Restart the development server
3. Navigate to any poker table page
4. The debug info will appear in the top-right corner

The viewport modes are determined by these breakpoints:

-   **mobile-portrait**: width ≤ 414px and portrait orientation
-   **mobile-landscape**: width ≤ 926px and landscape orientation
-   **tablet**: 927px ≤ width ≤ 1024px
-   **desktop**: width > 1024px

## Quick Start

1. Copy `.env.example` to `.env`:

    ```bash
    cp .env.example .env
    ```

2. Update the environment variables in `.env` according to your needs

3. Install dependencies:

    ```bash
    yarn install
    ```

4. Start the development server:
    ```bash
    yarn dev
    ```

## Custom Branding

To customize the branding of your poker room:

1. Set `VITE_CLUB_NAME` to your club's name
2. Set `VITE_CLUB_LOGO` to your logo URL or path
    - For external logos: `VITE_CLUB_LOGO=https://example.com/logo.png`
    - For local logos: Place your logo in `src/assets/` and reference it
3. Set `VITE_FAVICON_URL` to your favicon URL or path
    - For external favicons: `VITE_FAVICON_URL=https://example.com/favicon.ico`
    - For local favicons: Place your favicon in `public/` and reference it (e.g., `/favicon.ico`)

The branding will be displayed in:

-   **Browser Tab**: Your favicon will appear in the browser tab and bookmarks
-   **Dashboard**: Club logo and name centered above the "Start Playing Now" title
-   **Play Page**: Club logo and name in the center of the poker table

Example:

```env
VITE_CLUB_NAME="My Poker Club"
VITE_CLUB_LOGO=https://mypokerclub.com/logo.png
VITE_FAVICON_URL=https://mypokerclub.com/favicon.ico
```

### Testing Custom Branding Locally

To test the custom branding feature locally:

1. Copy the `.env.example` file to `.env` if you haven't already:

    ```bash
    cp .env.example .env
    ```

2. Edit the `.env` file and add your custom values:

    ```env
    VITE_CLUB_NAME="Your Club Name"
    VITE_CLUB_LOGO=https://your-logo-url.com/logo.png
    VITE_FAVICON_URL=https://your-logo-url.com/favicon.ico
    ```

    Or for local files:

    ```env
    VITE_CLUB_NAME="Your Club Name"
    VITE_CLUB_LOGO=/src/assets/your-logo.png
    VITE_FAVICON_URL=/your-favicon.ico
    ```

3. Start the development server:

    ```bash
    yarn dev
    ```

4. Navigate to:

    - Browser Tab: Check that your custom favicon appears in the browser tab
    - Dashboard: `http://localhost:5173` - You should see your logo and club name above "Start Playing Now"
    - Play Page: `http://localhost:5173/play/:tableId` - You should see your logo and club name in the center of the poker table

5. If the branding doesn't appear, check:
    - The URLs are correct and accessible
    - For local images, ensure the file exists in the correct directory:
        - Logos: `src/assets/`
        - Favicons: `public/`
    - Clear your browser cache and reload
    - Check the browser console for any errors

## Available Scripts

-   `yarn dev` - Start development server on port 5173
-   `yarn build` - Build for production
-   `yarn lint` - Run ESLint
-   `yarn lint:fix` - Fix ESLint errors automatically
-   `yarn preview` - Preview production build locally
