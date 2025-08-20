# Block52 Proxy Server

This proxy server handles cryptocurrency payment processing and bridges deposits into the Block52 poker ecosystem.

## Private Keys Configuration

This service uses two different private keys for different deposit systems:

### 1. TEXAS_HODL_PRIVATE_KEY
- **Type**: ETHEREUM PRIVATE KEY (not Bitcoin!)
- **Purpose**: Used for Bitcoin-originated deposits via BTCPay Server
- **Location**: `/src/bitcoin/webhooks/btcpayWebhook.js`
- **Function**: 
  - When users pay with Bitcoin via BTCPay, this Ethereum wallet processes the deposit
  - Converts BTC payment notifications to USDC deposits on Ethereum
  - Calls the Bridge contract's `depositUnderlying` function
  - This is the Ethereum wallet that executes transactions when Bitcoin is received
- **Contract Interaction**: Bridge contract at `0x092eEA7cE31C187Ff2DC26d0C250B011AEC1a97d`
- **Important**: This must be an Ethereum private key that has ETH for gas fees

### 2. DEPOSIT_PRIVATE_KEY  
- **Type**: ETHEREUM PRIVATE KEY
- **Purpose**: Used for QR code USDC deposit system
- **Location**: `/src/routes/depositSessions.js`
- **Function**:
  - This is the private key of the account that OWNS the Deposit.sol contract
  - Handles direct USDC deposits via QR code scanning
  - Manages deposit sessions for the QR payment flow
  - Calls the Deposit contract's `forwardDepositUnderlying` function
  - Processes deposits from users scanning QR codes with USDC
- **Contract Interaction**: Deposit contract at `0xADB8401D85E203F101aC715D5Aa7745a0ABcd42C`
- **Important**: This account must be the owner of the Deposit.sol contract to execute deposits

## Environment Setup

Create a `.env` file in this directory with both private keys:

```env
# Bitcoin deposit system (BTCPay)
TEXAS_HODL_PRIVATE_KEY=0x... # Your Bitcoin deposits wallet private key

# QR deposit system  
DEPOSIT_PRIVATE_KEY=0x... # Your QR deposits wallet private key

# Other required variables
RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
PORT=8080
NODE_URL=http://localhost:3000

# BTCPay configuration
BTC_PAY_SERVER=https://btcpay.bitcoinpokertour.com
BTC_PAY_SERVER_STORE_ID=your_store_id
BTC_PAY_SERVER_WEBHOOK_SECRET=your_webhook_secret
BTCPAY_BASIC_AUTH=base64_encoded_credentials
```

## Key Differences Summary

| Aspect | TEXAS_HODL_PRIVATE_KEY | DEPOSIT_PRIVATE_KEY |
|--------|------------------------|---------------------|
| **Blockchain** | Ethereum | Ethereum |
| **Triggers When** | Bitcoin payment received via BTCPay | User scans QR code with USDC |
| **Contract Called** | Bridge.sol | Deposit.sol |
| **Special Requirement** | Needs ETH for gas | Must be Deposit.sol contract owner |
| **Payment Flow** | BTC → BTCPay → Webhook → Ethereum TX | USDC → QR Code → Direct Ethereum TX |

## Important Security Notes

1. **Both are ETHEREUM private keys** (not Bitcoin!)
2. **Never commit private keys** to version control
3. **Keep `.env` in `.gitignore`** to prevent accidental exposure
4. **Use different wallets** for each system to isolate risk
5. **Ensure proper access controls** on the server hosting this service
6. **Private key format**: Must start with `0x` followed by 64 hexadecimal characters (total 66 chars)
7. **Both wallets need ETH** for gas fees on Ethereum mainnet

## Running the Service

```bash
# Install dependencies
yarn install

# Development mode (with auto-reload)
yarn dev

# Production mode
yarn start
```

## API Endpoints

- `/bitcoin` - BTCPay webhook handler (uses TEXAS_HODL_PRIVATE_KEY)
- `/bitcoin/create` - Create BTCPay invoice
- `/bitcoin/health` - Health check for Bitcoin service
- `/deposit-sessions` - QR deposit sessions (uses DEPOSIT_PRIVATE_KEY)
- `/docs` - Swagger API documentation