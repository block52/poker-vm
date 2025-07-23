# Poker-VM UI

This is the React-based frontend for the Poker Virtual Machine (PVM) project.

## Environment Variables

The following environment variables can be configured in your `.env` file:

### Core Configuration

- **`VITE_PROJECT_ID`** (required)
  - WalletConnect project ID for wallet integration
  - Default: `23ec57c1c95f3f54a97605975d4df7eb`
  - Used in: Wallet connection initialization

- **`VITE_NODE_RPC_URL`** (required)
  - RPC endpoint URL for the poker node
  - Default: `http://localhost:3000` (development) or `https://node1.block52.xyz/` (production)
  - Used in: All RPC calls to the poker game server

- **`VITE_NODE_WS_URL`** (required)
  - WebSocket URL for real-time game state updates
  - Default: `ws://localhost:3000` (development) or `wss://node1.block52.xyz` (production)
  - Used in: Game state context for live updates

### Blockchain Integration

- **`VITE_MAINNET_RPC_URL`** (required)
  - Ethereum mainnet RPC URL
  - Example: `https://mainnet.infura.io/v3/YOUR_API_KEY`
  - Used in: QR deposit functionality

- **`VITE_ETHERSCAN_API_KEY`** (optional)
  - Etherscan API key for blockchain queries
  - Used in: QR deposit functionality for transaction verification

### Payment Integration

- **`VITE_BTCPAY_SERVER_URL`** (optional)
  - BTCPay Server URL for Bitcoin payment processing
  - Used in: QR deposit functionality

- **`VITE_BTCPAY_BASIC_AUTH`** (optional)
  - Basic authentication credentials for BTCPay Server
  - Format: `username:password` (base64 encoded)
  - Used in: BTCPay Server API authentication

### Branding Customization

- **`VITE_CLUB_NAME`** (optional)
  - Name of your poker club
  - Default: `"Block 52"`
  - Used in: Table display and QR deposit page

- **`VITE_CLUB_LOGO`** (optional)
  - URL or path to your club's logo image
  - Default: `/src/assets/YOUR_CLUB.png`
  - Used in: Table display (center of poker table)
  - Supports: External URLs (https://) or local paths

### Game Features

- **`VITE_RANDOMISE_SEAT_SELECTION`** (optional)
  - Enable/disable random seat selection when joining a table
  - Values: `"true"` or `"false"`
  - Default: `"false"`
  - Used in: Join table functionality

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

Example:
```env
VITE_CLUB_NAME="My Poker Club"
VITE_CLUB_LOGO=https://mypokerclub.com/logo.png
```

## Available Scripts

- `yarn dev` - Start development server on port 3002
- `yarn build` - Build for production
- `yarn lint` - Run ESLint
- `yarn lint:fix` - Fix ESLint errors automatically
- `yarn preview` - Preview production build locally