# SDK - Claude Code Instructions

## Proto Regeneration - CRITICAL

When regenerating proto types, the `module.ts` file contains **custom gas settings** that must be preserved.

### Current Gas Setting (DO NOT CHANGE)
```typescript
const defaultFee = {
  amount: [],
  gas: "250000",  // <-- Required for poker actions (~203,000 gas)
};
```

### Safe Regeneration Command
```bash
yarn proto:full
```

This script is configured in **SAFE MODE**:
- Copies: `types/`, `registry.ts`, `rest.ts`, `index.ts`
- **Skips**: `module.ts` (preserves gas settings)

## When to Manually Update module.ts

### Adding NEW Fields to Existing Messages
**No action needed** - the `types/` folder contains the interfaces, and existing functions pass through all fields.

### Adding NEW Message Types
If you add a new message type (e.g., `MsgSitOut`), you MUST manually:
1. Run `yarn proto:full` to get the new types
2. Copy the new `sendMsgXxx` and `msgXxx` functions from the generated file at `pokerchain/ts-client/pokerchain.poker.v1/module.ts`
3. Add them to `src/pokerchain.poker.v1/module.ts`
4. Keep the custom `defaultFee` with `gas: "250000"`

## Current Message Types

| Message Type | Purpose |
|-------------|---------|
| `MsgCreateGame` | Create a new poker game |
| `MsgJoinGame` | Join an existing game |
| `MsgLeaveGame` | Leave a game |
| `MsgDealCards` | Deal cards to players |
| `MsgPerformAction` | Perform poker action (bet, call, fold, raise, check, all-in) |
| `MsgMint` | Mint tokens (bridge deposit from Ethereum) |
| `MsgBurn` | Burn tokens (bridge withdrawal to Ethereum) |
| `MsgProcessDeposit` | Process a deposit transaction |
| `MsgInitiateWithdrawal` | Start a withdrawal request |
| `MsgSignWithdrawal` | Sign a withdrawal (validator) |
| `MsgUpdateParams` | Update module parameters (governance) |

## Related Documentation

- `PROTO_REGENERATION.md` - Detailed regeneration guide
- `../tom/PROTO_LIFECYCLE.md` - When to update protos (with mermaid charts)

## Common Issues

### "Out of gas" errors
- Check if `module.ts` was accidentally overwritten
- Restore gas setting to `250000`

### New message types not working
- Functions weren't added to `module.ts`
- Copy them manually from generated file

### Build fails after proto update
- Run `yarn install` to get new dependencies
- Check for type mismatches
