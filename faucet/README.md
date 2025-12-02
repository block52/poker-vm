# Block52 Testnet Faucet

A simple Express server that dispenses STAKE tokens for gas fees on the Block52 testnet.

## Features

- Dispenses 10 STAKE per request
- Rate limited: 1 request per address per 24 hours
- CORS enabled for frontend access
- Health check and info endpoints

## Setup

1. **Install dependencies:**
   ```bash
   cd poker-vm/faucet
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your faucet wallet mnemonic
   ```

3. **Fund the faucet wallet:**
   ```bash
   # Get the faucet address first
   npm run dev
   # Then fund it from a wallet with STAKE
   pokerchaind tx bank send <your-address> <faucet-address> 1000000000stake --chain-id pokerchain
   ```

## Running

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## API Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "faucetAmount": 10,
  "rateLimitHours": 24
}
```

### GET /info
Get faucet configuration and status.

**Response:**
```json
{
  "configured": true,
  "faucetAddress": "b52...",
  "faucetAmount": 10,
  "rateLimitHours": 24,
  "network": {
    "rpc": "https://node.texashodl.net/rpc/",
    "rest": "https://node.texashodl.net",
    "chainId": "pokerchain"
  }
}
```

### GET /check/:address
Check if an address can request tokens (rate limit check).

**Response:**
```json
{
  "canRequest": true,
  "waitTimeMs": 0,
  "waitTimeFormatted": null
}
```

Or if rate limited:
```json
{
  "canRequest": false,
  "waitTimeMs": 3600000,
  "waitTimeFormatted": "1h 0m"
}
```

### POST /faucet
Request STAKE tokens.

**Request Body:**
```json
{
  "address": "b521844ehuvm59rvyc3sek78vu29hyfxrge5y47f0c"
}
```

**Success Response:**
```json
{
  "success": true,
  "txHash": "ABC123...",
  "amount": 10,
  "denom": "STAKE",
  "message": "Successfully sent 10 STAKE to b52..."
}
```

**Error Responses:**
- `400` - Invalid address
- `429` - Rate limited
- `500` - Server error
- `503` - Faucet not configured or empty

## Deployment (Digital Ocean)

1. Create a new App or Droplet
2. Set environment variables:
   - `FAUCET_MNEMONIC` - Your faucet wallet seed phrase
   - `PORT` - Server port (default 3001)
3. Run `npm install && npm run build && npm start`

## Security Notes

- The `FAUCET_MNEMONIC` should NEVER be exposed to the frontend
- Rate limiting is in-memory (resets on restart) - use Redis for production
- For mainnet, implement additional security measures (captcha, etc.)
