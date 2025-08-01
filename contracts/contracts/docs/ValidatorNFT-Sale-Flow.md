# ValidatorNFT and ValidatorSale Flow Diagrams

## Deployment Flow

```mermaid
graph TD
    A[Deploy ValidatorNFT Contract] --> B[ValidatorNFT Deployed]
    B --> C[Deploy ValidatorSale Contract]
    C --> |Pass NFT Address and Treasury Address| D[ValidatorSale Deployed]
    D --> E[Grant MINTER_ROLE to ValidatorSale]
    E --> |validatorNFT.grantRole| F[System Ready for Sales]
    
    style A fill:#f9f,stroke:#333,stroke-width:4px
    style F fill:#9f9,stroke:#333,stroke-width:4px
```

## Sale Process Flow

```mermaid
sequenceDiagram
    participant Buyer
    participant USDC
    participant ValidatorSale
    participant ValidatorNFT
    participant Treasury
    
    Note over Buyer: Buyer wants to purchase NFT 0 - Ace of Clubs
    
    Buyer->>USDC: approve(ValidatorSale, 52000 USDC)
    USDC-->>Buyer: Approval granted
    
    Buyer->>ValidatorSale: buy(tokenId: 0)
    
    ValidatorSale->>USDC: transferFrom(Buyer, ValidatorSale, 52000 USDC)
    USDC-->>ValidatorSale: Transfer complete
    
    Note over ValidatorSale: Calculate 52 percent for treasury
    ValidatorSale->>USDC: transfer(Treasury, 27040 USDC)
    USDC-->>Treasury: 52 percent transferred
    
    Note over ValidatorSale: 48 percent - 24960 USDC - remains for bonding
    
    ValidatorSale->>ValidatorNFT: mintAndTransfer(Buyer, tokenId: 0)
    ValidatorNFT-->>ValidatorNFT: _safeMint(Buyer, 0)
    ValidatorNFT-->>ValidatorNFT: cardMinted 0 equals true
    ValidatorNFT-->>ValidatorNFT: cardDisabled 0 equals true
    ValidatorNFT-->>Buyer: NFT 0 transferred
    
    ValidatorSale-->>Buyer: emit Bought(Buyer, 0)
    ValidatorNFT-->>Buyer: emit ValidatorAdded(Buyer, 0, totalSupply)
    
    Note over Buyer: NFT is disabled by default
    Buyer->>ValidatorNFT: toggleEnable(0)
    ValidatorNFT-->>ValidatorNFT: cardDisabled 0 equals false
    ValidatorNFT-->>Buyer: emit CardEnabled(0)
    Note over Buyer: Now an active validator!
```

## Contract Interactions Overview

```mermaid
graph LR
    subgraph ValidatorNFT["ValidatorNFT Contract"]
        A[MINTER_ROLE]
        B[mintAndTransfer]
        C[toggleEnable]
        D[Card State Management]
    end
    
    subgraph ValidatorSale["ValidatorSale Contract"]
        E[buy]
        F[Treasury Distribution]
        G[Bonding Reserve]
        H[withdrawToTreasury]
    end
    
    subgraph External["External"]
        I[USDC Contract]
        J[Treasury Address]
        K[Buyers]
    end
    
    K -.->|Approve USDC| I
    K -.->|Call buy| E
    E -.->|Transfer USDC| I
    E -.->|Send 52 percent| J
    E -.->|Keep 48 percent| G
    E -.->|Mint NFT| B
    A -.->|Authorizes| B
    K -.->|Enable NFT| C
    H -.->|Emergency| J
```

### Flow Description:
1. **Buyers → USDC Contract**: Approve USDC spending
2. **Buyers → buy()**: Call purchase function
3. **buy() → USDC Contract**: Transfer payment
4. **buy() → Treasury Address**: Send 52%
5. **buy() → Bonding Reserve**: Keep 48%
6. **buy() → mintAndTransfer()**: Mint NFT
7. **MINTER_ROLE → mintAndTransfer()**: Authorizes minting
8. **Buyers → toggleEnable()**: Enable validator NFT
9. **withdrawToTreasury() → Treasury Address**: Emergency withdrawal

## Key Features

### ValidatorNFT
- **52 unique NFTs** representing a deck of cards
- **Access Control**: Only addresses with MINTER_ROLE can mint
- **Default Disabled**: NFTs are disabled when minted
- **Owner Control**: Only token owners can enable/disable their NFTs

### ValidatorSale  
- **Fixed Price**: 52,000 USDC per NFT
- **Treasury Split**: 52% immediately to treasury
- **Bonding Reserve**: 48% held for validator bonding/slashing
- **Mint on Purchase**: No pre-minting required
- **Failsafe**: Owner can withdraw bonding funds if needed

## Deployment Steps

1. Deploy ValidatorNFT with name and symbol
2. Deploy ValidatorSale with ValidatorNFT address and treasury address
3. Grant MINTER_ROLE on ValidatorNFT to ValidatorSale contract
4. System is ready for purchases

## Purchase Steps

### Direct USDC Purchase
1. Buyer approves USDC spending to ValidatorSale
2. Buyer calls `buy(tokenId)` with desired card ID (0-51)
3. Contract transfers 52,000 USDC from buyer
4. Contract sends 27,040 USDC (52%) to treasury
5. Contract keeps 24,960 USDC (48%) for bonding
6. Contract mints and transfers NFT to buyer
7. Buyer calls `toggleEnable(tokenId)` to activate validator status

### Quote System for Other Tokens

The `quote` function allows buyers to check prices in other tokens (ETH, WBTC, etc.) before purchasing:

```mermaid
sequenceDiagram
    participant Buyer
    participant ValidatorSale
    participant UniswapQuoter
    participant UniswapRouter
    
    Note over Buyer: Buyer has ETH but needs to know how much ETH equals 52000 USDC
    
    Buyer->>ValidatorSale: quote(WETH, 3000)
    Note over ValidatorSale: Fee 3000 = 0.3% pool
    ValidatorSale->>UniswapQuoter: quoteExactOutputSingle
    Note over UniswapQuoter: Calculate: How much WETH needed to get 52000 USDC?
    UniswapQuoter-->>ValidatorSale: Returns amount of WETH needed
    ValidatorSale-->>Buyer: Returns WETH amount
    
    Note over Buyer: Now buyer knows they need X amount of WETH
    
    Buyer->>UniswapRouter: Swap WETH for USDC
    UniswapRouter-->>Buyer: Receive 52000 USDC
    
    Buyer->>ValidatorSale: buy(tokenId)
    Note over ValidatorSale: Standard purchase flow continues
```

#### Why the Quote Function?

1. **Price Discovery**: Buyers can check how much of any token (ETH, WBTC, DAI) they need to purchase an NFT
2. **Multi-token Support**: While the sale only accepts USDC, buyers can plan their token swaps
3. **Fee Tiers**: Supports different Uniswap pool fee tiers (0.05%, 0.3%, 1%)
4. **Exact Output**: Calculates the exact input needed to get 52,000 USDC

#### Example Usage:
```solidity
// Check how much WETH is needed
uint256 wethNeeded = validatorSale.quote(WETH_ADDRESS, 3000);

// Check how much WBTC is needed  
uint256 wbtcNeeded = validatorSale.quote(WBTC_ADDRESS, 500);

// Buyer then swaps their token for USDC on Uniswap before purchasing
```

### Quote System Flow Overview

```mermaid
graph TD
    A[Buyer has ETH/WBTC/other tokens] --> B{Wants to buy NFT}
    B --> C[Call quote function]
    C --> D[Get amount needed in their token]
    D --> E[Decision: Proceed?]
    E -->|Yes| F[Swap tokens for USDC on DEX]
    E -->|No| G[Cancel purchase]
    F --> H[Now has 52000 USDC]
    H --> I[Call buy function]
    I --> J[NFT purchased]
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style J fill:#9f9,stroke:#333,stroke-width:2px
```

## Testing Setup

### Mainnet Forking for Quote Function Testing

The quote function requires interaction with Uniswap contracts on mainnet. To test this functionality locally, you need to set up mainnet forking:

#### 1. Get an RPC Provider
Sign up for a free account at:
- [Alchemy](https://www.alchemy.com/)
- [Infura](https://infura.io/)

#### 2. Configure Environment
Create a `.env` file in the contracts directory:
```bash
FORK_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
```

#### 3. Update Hardhat Config
Add forking configuration to `hardhat.config.ts`:
```typescript
networks: {
  hardhat: {
    forking: {
      url: process.env.FORK_URL || "",
      blockNumber: 18500000 // Optional: Pin to specific block
    }
  }
}
```

#### 4. Run Tests

Copy and paste these commands to run specific test suites:

```bash
# Run all tests
npm run hh:test

# ValidatorNFT Tests
npm run hh:test -- contracts/test/ValidatorNFT.test.ts

# ValidatorSale Integration Tests  
npm run hh:test -- contracts/test/ValidatorSale.test.ts

# ValidatorNFT and Sale Integration Tests
npm run hh:test -- contracts/test/ValidatorNFTSale.integration.test.ts

# Quote Function Tests (Simple - No Forking Required)
npm run hh:test -- contracts/test/ValidatorSale.quote.simple.test.ts

# Quote Function Tests (Full - Requires Mainnet Forking)
npm run hh:test -- contracts/test/ValidatorSale.quote.test.ts

# Run Multiple Specific Tests
npm run hh:test -- contracts/test/ValidatorNFT.test.ts contracts/test/ValidatorSale.test.ts

# Run Tests with Gas Reporting
REPORT_GAS=true npm run hh:test

# Run Tests with Coverage
npm run hh:coverage
```

#### Test File Descriptions

| Test File | Description | Forking Required |
|-----------|-------------|------------------|
| `ValidatorNFT.test.ts` | Core NFT functionality, minting, toggling | No |
| `ValidatorSale.test.ts` | Purchase flow with mocked USDC | No |
| `ValidatorNFTSale.integration.test.ts` | Integration between NFT and Sale contracts | No |
| `ValidatorSale.quote.simple.test.ts` | Basic quote validation tests | No |
| `ValidatorSale.quote.test.ts` | Full quote tests with real Uniswap | **Yes** |

### Why Mainnet Forking?
- The quote function calls Uniswap V3 Quoter at `0x61fFE014bA17989E743c5F6cB21bF9697530B21e`
- This contract only exists on mainnet
- Forking creates a local copy with all mainnet contracts and state
- Enables realistic testing without spending real money