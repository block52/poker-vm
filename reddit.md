# 🎰 Block52 Poker VM - Open Source Decentralized Poker (Alpha Testing Now Open!)

Hey Reddit! We're excited to announce **alpha testing** for Block52 Poker VM - the first fully open-source, decentralized poker platform built on blockchain technology.

## 🔥 What is Block52 Poker VM?

Block52 is a **stateless execution layer for poker** that runs on top of a blockchain. Unlike traditional online poker sites, everything is:

- ✅ **100% Open Source** - All code is public on GitHub
- ✅ **Provably Fair** - Game logic runs on-chain, verifiable by anyone
- ✅ **Self-Hostable** - Run your own poker node and website
- ✅ **Decentralized** - No central authority controls the games
- ✅ **Non-Custodial** - You control your funds via blockchain wallet

## 🎮 How to Play (Alpha)

### Option 1: Play on Our Hosted Instance
The easiest way to get started:

1. **Visit** https://texashodl.net or https://node1.block52.xyz
2. **Connect Wallet** - Use any Web3 wallet (MetaMask, WalletConnect, etc.)
3. **Deposit USDC** - Bridge stablecoins to the poker VM via smart contract:
   - Contract: `0x092eEA7cE31C187Ff2DC26d0C250B011AEC1a97d` (Ethereum Mainnet)
   - Supports USDC deposits with automatic conversion to poker chips
4. **Create or Join a Table** - Start playing immediately!
   - Cash games (buy-in from $0.10 to $1000+)
   - Sit & Go tournaments
   - Create your own private tables

### Option 2: Run Your Own Node 🚀

Want to host your own poker room? Here's how:

#### Quick Start (Docker)
```bash
# Clone the repository
git clone https://github.com/block52/poker-vm.git
cd poker-vm

# Build and run PVM backend
cd pvm/ts
docker build -t poker-vm .
docker run -p 8545:8545 poker-vm

# Build and run UI (optional - customize your brand!)
cd ../../ui
docker build -t poker-ui .
docker run -p 5173:5173 poker-ui
```

#### From Source (Node.js)
```bash
# Prerequisites: Node.js 20+, Yarn
git clone https://github.com/block52/poker-vm.git
cd poker-vm

# Run the PVM (Poker Virtual Machine)
cd pvm/ts
yarn install
yarn build
yarn start

# Run the UI
cd ../../ui
yarn install
yarn dev
```

Your poker room is now live at:
- 🔧 **Backend**: http://localhost:8545
- 🎰 **Frontend**: http://localhost:5173

#### Customize Your Poker Room

The UI is fully customizable via environment variables:

```bash
# .env file in ui/
VITE_CLUB_NAME="My Poker Club"
VITE_CLUB_LOGO="https://example.com/logo.png"
VITE_BRAND_COLOR_PRIMARY="#FF0000"
VITE_BRAND_COLOR_SECONDARY="#000000"
VITE_FAVICON_URL="/custom-favicon.svg"
```

You can white-label the entire frontend and run your own branded poker site!

## 🏗️ Technical Architecture

### Why This Is Different

Traditional online poker sites are **black boxes** - you can't verify the shuffle, the randomness, or even if the game is fair. Block52 flips this model:

```
┌─────────────────────────────────┐
│  Your Browser / Mobile App      │  ← Open source UI (React/TypeScript)
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  PVM (Poker Virtual Machine)    │  ← Stateless execution layer
│  - Validates all actions        │  ← 100% open source (579 unit tests)
│  - Enforces poker rules         │  ← No database, no state
│  - Provably fair shuffles       │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  Block52 Blockchain             │  ← Cosmos SDK based
│  - Stores all game state        │  ← Single source of truth
│  - Manages player balances      │  ← Cryptographic security
│  - Handles deposits/withdrawals │
└─────────────────────────────────┘
```

### Key Features

**Stateless Design**
- The PVM has **no database** - all state lives on-chain
- Spin up 100 PVM nodes globally for low-latency gameplay
- Any node can handle any request (perfect horizontal scaling)
- Instant failover if a node goes down

**Provably Fair**
- All game logic is deterministic and open source
- Card shuffles use blockchain randomness (verifiable)
- Anyone can audit the code and verify fairness
- Players can run their own nodes to validate every action

**Real-Time Gameplay**
- WebSocket connections for instant updates
- Sub-100ms latency on global PVM nodes
- Automatic reconnection handling
- Mobile-friendly responsive UI

**Developer Friendly**
- TypeScript SDK for building bots and tools
- JSON-RPC API for integrations
- Comprehensive documentation
- 579 passing unit tests (62 test suites)

## 🤖 Build Poker Bots

We provide SDKs in TypeScript and Python for building poker bots:

```typescript
import { Block52Client } from "@bitcoinbrisbane/block52";

const client = new Block52Client({
  rpc: "https://node1.block52.xyz/rpc/",
  rest: "https://node1.block52.xyz",
  grpc: "grpcs://node1.block52.xyz:9443"
});

// Join a table
await client.poker.join({
  tableId: "0x123...",
  buyIn: "100000000000000000000" // 100 USDC
});

// Play poker programmatically
await client.poker.bet({
  tableId: "0x123...",
  amount: "20000000000000000000" // 20 USDC
});
```

Perfect for:
- Algorithm testing
- Game theory research
- Automated tournament play
- Training AI models

## 🔐 Security & Trust

**Smart Contract Audits**: Our deposit bridge contract is deployed on Ethereum mainnet and handles real funds. We take security seriously.

**Open Source**: Every line of code is public on GitHub. If you don't trust us, audit it yourself!

**Non-Custodial**: Your funds are secured by blockchain cryptography, not our servers. We can't access your money.

**CVE-2025-55182 Status**: ✅ Not affected (verified React 18.3.1, no Next.js)

## 🎯 What We're Looking For (Alpha Testers)

We're looking for alpha testers who want to:

1. **Play Real Games** - Test cash games and tournaments with real USDC
2. **Break Things** - Find bugs, edge cases, exploits (responsibly!)
3. **Provide Feedback** - UI/UX improvements, feature requests
4. **Run Nodes** - Host your own PVM instance and report issues
5. **Build Bots** - Test our SDK and build poker AI

**Alpha Tester Benefits:**
- Early access to platform
- Direct communication with dev team
- Influence on roadmap and features
- Potential rewards for critical bug finds
- NFT badge for alpha testers (coming soon)

## 📚 Resources

- **GitHub**: https://github.com/block52/poker-vm
- **Live Poker Rooms**:
  - https://texashodl.net
  - https://node1.block52.xyz
- **Bridge Contract**: `0x092eEA7cE31C187Ff2DC26d0C250B011AEC1a97d`
- **Documentation**: See [README.md](https://github.com/block52/poker-vm/blob/main/README.md)
- **Contact**: pitboss@block52.xyz (PGP key in repo)

## 🛣️ Roadmap

**Q1 2025 (Current - Alpha)**
- ✅ Cash games (No-Limit Texas Hold'em)
- ✅ Sit & Go tournaments
- ✅ WebSocket real-time gameplay
- ✅ USDC deposits via Ethereum bridge
- 🔄 Bug fixes and stability improvements

**Q2 2025**
- Multi-table tournaments (MTTs)
- Tournament lobbies and scheduling
- Player statistics and hand history
- Rake system for table hosts
- Mobile app (iOS/Android)

**Q3 2025**
- Omaha Hold'em variant
- Private club features
- Staking and backing platform
- Affiliate/referral system
- Validator rewards program

**Q4 2025**
- Additional poker variants (7-Card Stud, etc.)
- Cross-chain deposits (Polygon, Arbitrum, BSC)
- Decentralized governance (DAO)
- Professional tournament series

## 💬 Join the Community

We're building this in public and want your input!

- **Issues/Bugs**: https://github.com/block52/poker-vm/issues
- **Discussions**: https://github.com/block52/poker-vm/discussions
- **Email**: pitboss@block52.xyz

## 🚀 Getting Started Right Now

1. Visit https://texashodl.net
2. Connect your Web3 wallet
3. Deposit USDC (start small - this is alpha!)
4. Join a cash game table
5. Play some hands and report any bugs you find

Or clone the repo and run your own poker room in 5 minutes!

```bash
git clone https://github.com/block52/poker-vm.git
cd poker-vm/pvm/ts
yarn install && yarn dev
```

## ⚠️ Alpha Disclaimer

This is **ALPHA software**. Expect bugs, UI glitches, and potential issues. Do not deposit more than you're willing to lose while testing. All code is provided "as is" under MIT license.

That said - the blockchain ensures your funds are safe and withdrawable even if the PVM goes down!

---

**TL;DR**: Open-source decentralized poker you can play right now, audit the code yourself, or host your own white-labeled poker room. Alpha testing is live!

What questions do you have? Drop them below! 👇
