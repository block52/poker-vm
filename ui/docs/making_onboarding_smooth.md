# Making Onboarding Smooth

**Date**: 2025-11-26
**Status**: Phase 1 & 2 Complete

## Problem Statement

New users joining the poker platform face friction:
1. They need **stake tokens** to pay for gas fees (transactions fail without them)
2. They need **USDC** to play poker
3. The navigation menu is cluttered with admin/dev pages that confuse regular users

## Goals

1. **Clean up navigation** - Move admin/dev pages to `/admin` route
2. **Build a faucet** - Allow users to get initial stake/USDC for testing
3. **Smooth first-time experience** - User should be able to play immediately after connecting wallet

---

## Phase 1: Navigation Cleanup

### Current Menu Items (to reorganize)

| Current Item | Keep in Main Nav? | Move to /admin? | Notes |
|--------------|-------------------|-----------------|-------|
| Block 52 | Yes | - | Main app/home |
| Block52 Wallet | Yes | - | User's wallet |
| Genesis State | No | Yes | Dev/debug only |
| Block Explorer | Maybe | Maybe | Could be useful for users |
| Manual Bridge | No | Yes | Admin function |
| Withdrawals | Yes | - | User needs this |
| Test Signing | No | Yes | Dev/debug only |
| Bridge Admin | No | Yes | Admin only |
| Table Admin | No | Yes | Admin only |

### Tasks

- [x] Create `/admin` route with AdminLayout component
- [x] Move admin pages under `/admin/*`:
  - [x] `/admin/genesis` - Genesis State
  - [x] `/admin/bridge` - Bridge Admin Dashboard
  - [x] `/admin/bridge-manual` - Manual Bridge Trigger
  - [x] `/admin/tables` - Table Admin
  - [x] `/admin/test-signing` - Test Signing
- [x] Update main navigation to only show user-facing pages
- [x] Add "Admin" link that only shows in development mode (`VITE_NODE_ENV="development"`)
- [x] Create AdminDashboard landing page at `/admin`

### Files Created/Modified

- `src/pages/admin/AdminDashboard.tsx` - Admin landing page with links to all admin pages
- `src/App.tsx` - Added admin routes, kept legacy routes for backwards compat
- `src/components/GlobalHeader.tsx` - Split menu items into user vs admin sections

---

## Phase 2: Explorer Enhancements (Complete)

### All Accounts Page

Added `/explorer/accounts` page that shows all accounts on the chain, similar to Etherscan:
- Lists all accounts with their full addresses (no truncation)
- Shows USDC balances for each account
- Sortable by balance or address
- Search/filter functionality
- Click through to detailed address page
- **Validator Detection**: Shows validator badge with moniker and status (BONDED/UNBONDED)
- Uses `@cosmjs/encoding` for proper bech32 address conversion (valoper → account)
- Stats cards show: Total Accounts, Accounts With Balance, Validators, Total USDC

### Transaction History

The `/explorer/address/:address` page includes transaction history:
- Shows both sent and received transactions
- Sorted by block height (newest first)
- Click through to transaction details
- Fixed: Uses `query=` parameter instead of `events=` for Cosmos SDK compatibility

### Denom Display Fix

Fixed denomination display to show "USDC" instead of "SDC":
- Added proper denom mapping (usdc → USDC, stake → STAKE)
- Applied to both AllAccountsPage and AddressPage

### Files Created/Modified

- `src/pages/explorer/AllAccountsPage.tsx` - New all accounts page with validator detection
- `src/pages/explorer/AddressPage.tsx` - Fixed tx query parameter and denom display
- `src/pages/explorer/BlocksPage.tsx` - Added navigation links
- `src/App.tsx` - Added route for `/explorer/accounts`

---

## Phase 3: Faucet Module (Pending)

### Why a Faucet?

From the bridge investigation:
> The SIGNER account must already exist on chain to submit transactions.
> `getSequence()` fails because non-existent accounts have no sequence.

New users who deposit USDC via the bridge can't even trigger their own deposit processing because they have no stake for gas!

### Faucet Design Options

#### Option A: Backend Faucet Service (Recommended)
- Faucet wallet holds stake tokens
- User requests tokens via API
- Backend signs and sends tokens to user
- Rate limiting per address (e.g., once per 24h)

#### Option B: Smart Contract Faucet
- Contract-based distribution
- More complex, overkill for testnet

#### Option C: Manual Admin Distribution
- Current approach (admin sends tokens)
- Doesn't scale, bad UX

### Faucet Implementation Tasks

- [ ] Create faucet wallet with stake tokens
- [ ] Build `/api/faucet` endpoint (or use Cosmos module)
- [ ] Create FaucetPage component at `/faucet`
- [ ] Implement rate limiting (1 request per address per 24h)
- [ ] Distribute both:
  - [ ] `stake` - for gas fees (e.g., 100,000 stake)
  - [ ] `usdc` - for playing (e.g., 10 USDC = 10,000,000 usdc)
- [ ] Add loading states and success/error feedback
- [ ] Integrate with wallet connection flow

### Faucet UI Design

```
+------------------------------------------+
|           Get Test Tokens                 |
+------------------------------------------+
| Your Address: b521abc...xyz               |
|                                           |
| [  Request Tokens  ]                      |
|                                           |
| You'll receive:                           |
|   - 100,000 stake (for gas fees)          |
|   - 10 USDC (for playing)                 |
|                                           |
| Rate limit: 1 request per 24 hours        |
+------------------------------------------+
```

---

## Phase 4: Onboarding Flow (Pending)

### Ideal User Journey

1. User connects wallet (generates/imports mnemonic)
2. System detects new account (no balance)
3. Prompt: "Get free test tokens to start playing!"
4. User clicks faucet button
5. Tokens arrive in ~5 seconds
6. User can now join a table

### Tasks

- [ ] Detect new accounts on wallet connection
- [ ] Show onboarding modal for new users
- [ ] One-click faucet request from modal
- [ ] Auto-redirect to tables after tokens received

---

## Implementation Order

1. **Phase 1** (Navigation) - Quick win, improves clarity ✅ DONE
2. **Phase 2** (Explorer Enhancements) - All accounts page + tx history ✅ DONE
3. **Phase 3** (Faucet) - Removes biggest friction point
4. **Phase 4** (Onboarding) - Polish the experience

---

## Files to Create/Modify

### New Files
- `src/pages/admin/AdminDashboard.tsx`
- `src/pages/admin/AdminLayout.tsx`
- `src/pages/FaucetPage.tsx`
- `src/components/OnboardingModal.tsx`

### Modify
- `src/App.tsx` - Add admin routes
- `src/components/Sidebar.tsx` or navigation component
- `src/context/WalletContext.tsx` - Detect new accounts

---

## Questions to Resolve

1. **Faucet backend**:
   - Use existing Express server in pvm/ts?
   - Or add Cosmos SDK faucet module to pokerchain?

2. **Rate limiting storage**:
   - Redis?
   - Simple in-memory (resets on restart)?
   - On-chain tracking?

3. **Token amounts**:
   - How much stake for gas? (100,000 seems good)
   - How much USDC for testing? (10 USDC?)
