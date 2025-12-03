# Proto Regeneration - Important Notes

## Custom Settings That Must Be Preserved

### Gas Settings in `module.ts`

**Location:** `src/pokerchain.poker.v1/module.ts`

```typescript
// Gasless transactions - chain has minimum-gas-prices = "0.0stake"
// Note: Poker actions require ~203,000 gas, so 250,000 provides safety margin
const defaultFee = {
  amount: [],
  gas: "250000",  // <-- DO NOT CHANGE THIS VALUE
};
```

**Why this matters:**
- Poker actions (like `performAction`) require ~203,000 gas
- The default ignite template uses `200000` which is NOT enough
- We use `250000` to provide a safety margin
- If this gets overwritten, transactions will fail with "out of gas" errors

## Safe Regeneration Process

The `regenerate-proto-types.sh` script is configured in **SAFE MODE**:

### What Gets Copied (Safe)
- `types/` folder - Message interfaces (MsgCreateGame, etc.)
- `registry.ts` - Type URL registrations
- `rest.ts` - REST API client
- `index.ts` - Module exports

### What Does NOT Get Copied (Has Custom Settings)
- `module.ts` - Contains custom gas settings

## When New Messages Are Added

If you add a new message type to the proto files (e.g., `MsgNewAction`), you need to:

1. Run `yarn proto:full` - This updates the types
2. **Manually update `module.ts`** to add the new message functions
3. Copy the new `sendMsgXxx` and `msgXxx` functions from the generated file
4. Keep the custom `defaultFee` settings

### Example: Adding a New Message

1. Generated file has new function:
```typescript
// In generated ts-client/pokerchain.poker.v1/module.ts
sendMsgNewAction({ value, fee, memo }: sendMsgNewActionParams): Promise<DeliverTxResponse> {
  // ...
}
```

2. Copy to SDK's module.ts, keeping gas settings intact

## Running the Script

```bash
cd poker-vm/sdk
yarn proto:full
```

The script will:
1. Generate fresh TypeScript from pokerchain protos
2. Copy only safe files (types, registry, rest, index)
3. Skip module.ts (preserves gas settings)
4. Warn you if new messages were detected

## Troubleshooting

### "Out of gas" errors after regeneration
- Check if `module.ts` was accidentally overwritten
- Restore gas setting to `250000`

### New message types not working
- Check if they were added to `module.ts`
- Copy the functions manually from generated file

### Script shows "New message types detected"
- Review the generated `module.ts` in `pokerchain/ts-client/`
- Manually add new functions to SDK's `module.ts`
