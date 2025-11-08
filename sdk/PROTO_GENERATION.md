# Proto Type Generation & SDK Maintenance Guide

**Created**: 2025-11-08
**Purpose**: Complete guide for regenerating TypeScript proto types from Pokerchain for the SDK

---

## Table of Contents

1. [Quick Start (Automated Scripts)](#quick-start-automated-scripts)
2. [Why Regenerate Proto Types?](#why-regenerate-proto-types)
3. [Automated Scripts Reference](#automated-scripts-reference)
4. [Manual Generation Methods](#manual-generation-methods-advanced)
5. [Verification & Testing](#verification--testing)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)
8. [Resources](#resources)

---

## Quick Start (Automated Scripts)

### The Easiest Way: Use the Scripts! 🚀

We've created automated bash scripts that handle everything for you.

**Basic workflow** (most common):

```bash
cd poker-vm/sdk

# Full regeneration: proto types + update PVM & UI
yarn proto:full

# Or use npm/yarn scripts:
yarn proto:generate        # Just regenerate types
yarn proto:update-deps     # Just update PVM/UI dependencies
```

**Or run scripts directly**:

```bash
# 1. Regenerate proto types from Pokerchain
./regenerate-proto-types.sh

# 2. Update dependencies in PVM and UI
./update-dependencies.sh
```

That's it! The scripts handle:
- ✅ Automatic backups
- ✅ Running `ignite generate ts-client`
- ✅ Copying to correct locations
- ✅ Verification
- ✅ Building SDK
- ✅ Updating PVM and UI dependencies
- ✅ Rollback on failure

**Continue reading** for detailed documentation, manual methods, and troubleshooting.

---

## Why Regenerate Proto Types?

The SDK contains auto-generated TypeScript types from Pokerchain's protobuf definitions. These types are **critical** for:

1. **Message Signing**: Creating and signing transactions (MsgCreateGame, MsgJoinGame, etc.)
2. **Encoding/Decoding**: Converting between JSON and binary protobuf format
3. **Type Safety**: Ensuring TypeScript types match the actual blockchain messages
4. **Registry**: Registering message types for transaction broadcasting

### When to Regenerate

**✅ Always regenerate after**:
- Adding new message types to Pokerchain (MsgFoo)
- Modifying existing proto files (fields, types, etc.)
- Changing denomination constants in proto files
- After major Cosmos SDK version upgrade
- When SDK types are older than Pokerchain proto files

**❌ Don't need to regenerate after**:
- Only cosmosClient.ts or SDK wrapper code changed
- Only SDK utility functions changed
- Only config files (types.ts constants) changed
- Pokerchain proto files haven't changed

### Current Status

**Last SDK generation**: October 30, 2024
**Proto commits since then**: 125+ commits (including denomination changes)

**Known changes**:
- Oct 7: TokenDenom updated to `uusdc`
- Multiple keeper logic updates
- Bridge-related changes (MsgMint, MsgBurn)

---

## Automated Scripts Reference

### Script 1: `regenerate-proto-types.sh`

Regenerates TypeScript proto types from Pokerchain and updates the SDK.

**Usage**:
```bash
cd poker-vm/sdk
./regenerate-proto-types.sh [OPTIONS]
```

**Options**:
- `--help` - Show help message
- `--skip-backup` - Skip creating backup (faster, less safe)
- `--skip-rebuild` - Skip rebuilding SDK after copying types

**What it does**:

```
1. Pre-flight Checks
   ✓ Verifies directories exist
   ✓ Checks required tools (ignite, yarn, git)
   ✓ Confirms we're in SDK directory

2. Creates Backup
   ✓ Backs up current types to .backup/YYYYMMDD_HHMMSS/
   ✓ Saves backup location for potential rollback

3. Generates TypeScript Client
   ✓ Runs: ignite generate ts-client --yes
   ✓ Creates: pokerchain/ts-client/

4. Copies Generated Types
   ✓ Removes old: src/pokerchain.poker.v1/
   ✓ Copies new: pokerchain/ts-client/pokerchain.poker.v1 → src/
   ✓ Updates Cosmos modules (bank, auth, etc.) if available

5. Verifies Generated Types
   ✓ Checks key files exist (module.ts, registry.ts, tx.ts)
   ✓ Verifies message types (MsgCreateGame, MsgJoinGame, MsgMint)

6. Rebuilds SDK
   ✓ Runs: yarn build
   ✓ Offers rollback if build fails

7. Displays Summary
   ✓ Shows what changed
   ✓ Provides next steps
```

**Example output**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Proto Type Regeneration - Pre-flight Checks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️  Checking directories...
ℹ️  Checking required tools...
✅ All pre-flight checks passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Creating Backup of Current Types
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Backed up pokerchain.poker.v1 to .backup/20251108_123456

✅ SDK built successfully
🎉 Proto type regeneration completed successfully!
```

### Script 2: `update-dependencies.sh`

Updates local SDK dependency in PVM and UI projects.

**Usage**:
```bash
cd poker-vm/sdk
./update-dependencies.sh [OPTIONS]
```

**Options**:
- `--help` - Show help message
- `--pvm-only` - Only update PVM dependencies
- `--ui-only` - Only update UI dependencies

**What it does**:

```
1. Checks SDK is Built
   ✓ Verifies SDK dist/ directory exists
   ✓ Builds SDK if needed

2. Updates PVM (unless --ui-only)
   ✓ Removes: pvm/ts/node_modules/@bitcoinbrisbane/block52
   ✓ Removes: pvm/ts/yarn.lock
   ✓ Runs: yarn install
   ✓ Verifies SDK linked correctly

3. Updates UI (unless --pvm-only)
   ✓ Removes: ui/node_modules/@bitcoinbrisbane/block52
   ✓ Removes: ui/yarn.lock
   ✓ Runs: yarn install
   ✓ Verifies SDK linked correctly

4. Displays Summary
   ✓ Shows what was updated
   ✓ Provides verification steps
```

### Complete Workflows

#### Scenario 1: Proto Files Changed in Pokerchain

```bash
cd poker-vm/sdk

# Full regeneration and update
yarn proto:full

# Or step by step:
./regenerate-proto-types.sh
./update-dependencies.sh

# Verify
cd ../pvm/ts && yarn build
cd ../../ui && yarn dev
```

#### Scenario 2: Only SDK Code Changed (No Proto Changes)

```bash
cd poker-vm/sdk

# Just rebuild and update
yarn build
./update-dependencies.sh

# Test
cd ../pvm/ts && yarn build
```

#### Scenario 3: Quick PVM-Only Update

```bash
cd poker-vm/sdk
./update-dependencies.sh --pvm-only
cd ../pvm/ts && yarn build
```

#### Scenario 4: Fast Regeneration (No Backup)

```bash
cd poker-vm/sdk
./regenerate-proto-types.sh --skip-backup && ./update-dependencies.sh
```

### One-Liner Commands

```bash
# Full regeneration + update
cd poker-vm/sdk && yarn proto:full

# Or with direct scripts:
cd poker-vm/sdk && ./regenerate-proto-types.sh && ./update-dependencies.sh

# Fast mode (no backup)
./regenerate-proto-types.sh --skip-backup && ./update-dependencies.sh

# Just update PVM
./update-dependencies.sh --pvm-only

# Just update UI
./update-dependencies.sh --ui-only
```

### NPM/Yarn Scripts

The following scripts are available in `package.json`:

```json
{
  "scripts": {
    "proto:generate": "./regenerate-proto-types.sh",
    "proto:update-deps": "./update-dependencies.sh",
    "proto:full": "./regenerate-proto-types.sh && ./update-dependencies.sh"
  }
}
```

**Usage**:
```bash
yarn proto:full         # Complete workflow
yarn proto:generate     # Just generate types
yarn proto:update-deps  # Just update dependencies

# Or with npm:
npm run proto:full
```

---

## Manual Generation Methods (Advanced)

For advanced users or when automated scripts don't work.

### Option 1: Using Ignite CLI (Recommended)

Ignite CLI has built-in TypeScript client generation.

**Step 1: Generate TypeScript Client**

```bash
cd /Users/alexmiller/projects/pvm_cosmos_under_one_roof/pokerchain

# Generate TypeScript client
ignite generate ts-client --yes

# This creates:
# pokerchain/ts-client/
#   ├── pokerchain.poker.v1/
#   ├── cosmos.bank.v1beta1/
#   └── ...
```

**Step 2: Copy Generated Types to SDK**

```bash
cd /Users/alexmiller/projects/pvm_cosmos_under_one_roof/poker-vm/sdk

# Backup current types
mkdir -p .backup/$(date +%Y%m%d)
cp -r src/pokerchain.poker.v1 .backup/$(date +%Y%m%d)/

# Copy new generated types
rm -rf src/pokerchain.poker.v1
cp -r ../../pokerchain/ts-client/pokerchain.poker.v1 src/

# Optional: Update standard Cosmos modules if needed
# rm -rf src/cosmos.bank.v1beta1
# cp -r ../../pokerchain/ts-client/cosmos.bank.v1beta1 src/
```

**Step 3: Verify and Rebuild**

```bash
cd /Users/alexmiller/projects/pvm_cosmos_under_one_roof/poker-vm/sdk

# Check for import errors
grep -r "from.*pokerchain.poker.v1" src/

# Rebuild SDK
yarn build

# Run tests
yarn test
```

### Option 2: Using Telescope

[Telescope](https://github.com/cosmology-tech/telescope) is a powerful proto → TypeScript generator.

**Step 1: Install Telescope**

```bash
cd /Users/alexmiller/projects/pvm_cosmos_under_one_roof/poker-vm/sdk
npm install --save-dev @cosmology/telescope
```

**Step 2: Create Telescope Config**

Create `telescope.config.js` in SDK root:

```javascript
module.exports = {
  protoDirs: [
    '../../pokerchain/proto',
    '../../pokerchain/third_party/proto'
  ],
  outPath: './src',
  options: {
    prototypes: {
      enabled: true,
      parser: {
        keepCase: false
      },
      methods: {
        encode: true,
        decode: true,
        fromJSON: true,
        toJSON: true
      },
      typingsFormat: {
        useExact: false,
        timestamp: 'date',
        duration: 'duration'
      }
    },
    aminoEncoding: {
      enabled: true
    },
    lcdClients: {
      enabled: false  // We use custom REST client
    },
    rpcClients: {
      enabled: false  // We use custom gRPC client
    }
  }
};
```

**Step 3: Run Telescope**

```bash
npx telescope generate
```

### Option 3: Manual Proto Compilation

For full control over the generation process.

```bash
cd /Users/alexmiller/projects/pvm_cosmos_under_one_roof/pokerchain

# Generate TypeScript files from proto
protoc \
  --plugin=protoc-gen-ts_proto=./node_modules/.bin/protoc-gen-ts_proto \
  --ts_proto_out=./ts-client \
  --ts_proto_opt=esModuleInterop=true,forceLong=string,useOptionals=messages \
  --proto_path=./proto \
  --proto_path=./third_party/proto \
  $(find ./proto/pokerchain -name '*.proto')

# Copy to SDK
cp -r ts-client/pokerchain.poker.v1 \
  /Users/alexmiller/projects/pvm_cosmos_under_one_roof/poker-vm/sdk/src/
```

---

## Verification & Testing

### Verification Checklist

After regenerating types, verify:

#### 1. Message Type Registry

```bash
cat src/pokerchain.poker.v1/registry.ts
```

Should include:
- `MsgCreateGame`
- `MsgJoinGame`
- `MsgPerformAction`
- `MsgLeaveGame`
- `MsgMint` (if bridge is implemented)
- `MsgBurn` (if bridge is implemented)

#### 2. Type Exports

```bash
cat src/pokerchain.poker.v1/types.ts
```

Should export all message and query types.

#### 3. Denomination Constants

```bash
grep -r "usdc\|stake\|b52usdc\|uusdc" src/pokerchain.poker.v1/
```

Should match current pokerchain proto definitions.

#### 4. Build Success

```bash
cd /Users/alexmiller/projects/pvm_cosmos_under_one_roof/poker-vm/sdk
yarn build

# Should complete without errors
```

#### 5. Integration Test

```bash
# Test in PVM
cd /Users/alexmiller/projects/pvm_cosmos_under_one_roof/poker-vm/pvm/ts
rm -rf node_modules/@bitcoinbrisbane/block52
yarn install
yarn build

# Test in UI
cd /Users/alexmiller/projects/pvm_cosmos_under_one_roof/poker-vm/ui
rm -rf node_modules/@bitcoinbrisbane/block52
yarn install
yarn dev
```

### Unit Test Example

Create `tests/proto-types.test.ts`:

```typescript
import { MsgCreateGame } from "../src/pokerchain.poker.v1/types/pokerchain/poker/v1/tx";
import { Game } from "../src/pokerchain.poker.v1/types/pokerchain/poker/v1/query";

describe("Proto Generated Types", () => {
  test("MsgCreateGame encodes and decodes correctly", () => {
    const msg: MsgCreateGame = {
      creator: "b52...",
      minBuyIn: Long.fromNumber(1000000),
      maxBuyIn: Long.fromNumber(10000000),
      minPlayers: Long.fromNumber(2),
      maxPlayers: Long.fromNumber(6),
      smallBlind: Long.fromNumber(500),
      bigBlind: Long.fromNumber(1000),
      timeout: Long.fromNumber(30),
      gameType: "no-limit-holdem",
    };

    // Encode to bytes
    const bytes = MsgCreateGame.encode(msg).finish();

    // Decode from bytes
    const decoded = MsgCreateGame.decode(bytes);

    expect(decoded).toEqual(msg);
  });
});
```

Run tests:

```bash
yarn test tests/proto-types.test.ts
```

### Verify Types Command Line

```bash
# Check SDK exports
cd poker-vm/sdk
node -e "const sdk = require('./dist/index.js'); console.log(Object.keys(sdk));"

# Check COSMOS_CONSTANTS
node -e "const sdk = require('./dist/index.js'); console.log(sdk.COSMOS_CONSTANTS);"

# In PVM, verify imports work
cd ../pvm/ts
node -e "const sdk = require('@bitcoinbrisbane/block52'); console.log(sdk.COSMOS_CONSTANTS);"
```

---

## Troubleshooting

### Script Issues

#### "ignite: command not found"

Install Ignite CLI:
```bash
brew install ignite
# Or from source: https://docs.ignite.com/welcome/install
```

#### "Permission denied"

Make scripts executable:
```bash
chmod +x regenerate-proto-types.sh
chmod +x update-dependencies.sh
```

#### Build Fails After Regenerating Types

The script will offer to rollback automatically. Or manually rollback:

```bash
# Find backup directory
ls -lt .backup/

# Restore from backup (replace TIMESTAMP)
rm -rf src/pokerchain.poker.v1
cp -r .backup/TIMESTAMP/pokerchain.poker.v1 src/
yarn build
```

### Import/Type Issues

#### Import Path Errors

After regeneration, imports may break. Update paths in `cosmosClient.ts`:

```typescript
// Old
import { MsgCreateGame } from "./pokerchain.poker.v1/types/tx";

// New (if structure changed)
import { MsgCreateGame } from "./pokerchain.poker.v1/module";
```

#### Type Mismatches

Check proto → TS type mappings:
- `uint64` → `Long` (string representation, prevents overflow)
- `bytes` → `Uint8Array`
- `repeated` → `Array<T>`
- `map<K,V>` → `Record<K, V>`

#### Missing Message Types

Ensure proto files have proper annotations:

```protobuf
// In tx.proto
option go_package = "github.com/username/pokerchain/x/poker/types";

service Msg {
  rpc CreateGame(MsgCreateGame) returns (MsgCreateGameResponse);
  // ... other RPCs
}
```

#### Denomination Mismatches

1. Verify proto files have correct denomination
2. Regenerate types
3. Clear build cache: `rm -rf dist/ && yarn build`

### Dependency Issues

#### PVM/UI Doesn't See Updated Types

```bash
# Force clean install in PVM
cd poker-vm/pvm/ts
rm -rf node_modules yarn.lock
yarn install
yarn build

# Force clean install in UI
cd ../../ui
rm -rf node_modules yarn.lock
yarn install
```

#### SDK Not Linked Properly

Verify symlinks:

```bash
# Check PVM
ls -la poker-vm/pvm/ts/node_modules/@bitcoinbrisbane/block52
# Should point to: ../../../sdk

# Check UI
ls -la poker-vm/ui/node_modules/@bitcoinbrisbane/block52
# Should point to: ../../sdk
```

If not linked, check `package.json`:

```json
{
  "dependencies": {
    "@bitcoinbrisbane/block52": "file:../../sdk"  // PVM
    // or
    "@bitcoinbrisbane/block52": "file:../sdk"     // UI
  }
}
```

---

## Best Practices

### Before Regenerating

1. **Commit changes**: `git add . && git commit -m "Before proto regeneration"`
2. **Check proto files**: `git log --oneline proto/` to see what changed
3. **Review changes**: Look at proto file diffs

### During Regeneration

1. **Use backups**: Don't skip backups unless absolutely certain
2. **Read output**: Scripts provide detailed feedback
3. **Check warnings**: Yellow warnings may indicate issues

### After Regenerating

1. **Review changes**: `git diff src/pokerchain.poker.v1/`
2. **Test thoroughly**: Run PVM and UI after updating
3. **Document changes**: Update CHANGELOG if proto structure changed
4. **Commit**: `git add . && git commit -m "Regenerate proto types: [reason]"`

### Automation Tips

Add git hooks for automatic checks:

```bash
# .git/hooks/pre-push
#!/bin/bash
cd poker-vm/sdk
if ! yarn build; then
    echo "SDK build failed! Fix before pushing."
    exit 1
fi
```

---

## File Structure Reference

### Pokerchain Proto Files (Source)

```
pokerchain/proto/pokerchain/poker/v1/
├── tx.proto                    # Message definitions (MsgCreateGame, etc.)
├── query.proto                 # Query definitions
├── game.proto                  # Game state structures (if exists)
├── genesis.proto               # Genesis state
└── params.proto                # Module parameters
```

### SDK Generated Types (Destination)

```
poker-vm/sdk/src/pokerchain.poker.v1/
├── index.ts                    # Main exports
├── module.ts                   # Module client class with message types
├── registry.ts                 # Message type registry
├── rest.ts                     # REST API client
├── types.ts                    # Type re-exports
└── types/
    ├── amino/                  # Amino encoding types
    ├── cosmos/                 # Cosmos SDK types
    ├── cosmos_proto/           # Cosmos proto annotations
    ├── gogoproto/              # Gogo proto types
    ├── google/                 # Google proto types
    └── pokerchain/
        └── poker/
            └── v1/
                ├── tx.ts       # MsgCreateGame, MsgJoinGame, etc.
                ├── query.ts    # QueryGameRequest, etc.
                ├── genesis.ts  # GenesisState
                └── params.ts   # Params
```

### Backup Location

```
poker-vm/sdk/.backup/
├── 20251108_120000/           # Timestamped backup
│   └── pokerchain.poker.v1/
├── 20251108_150000/
│   └── pokerchain.poker.v1/
└── ...
```

### Integration Points

```
poker-vm/
├── sdk/
│   ├── src/pokerchain.poker.v1/          # Generated types
│   ├── src/cosmosClient.ts               # Uses generated types
│   └── dist/                             # Built SDK
├── pvm/ts/
│   └── node_modules/@bitcoinbrisbane/block52/ → ../../sdk
└── ui/
    └── node_modules/@bitcoinbrisbane/block52/ → ../sdk
```

---

## Resources

### Documentation

- **Project README**: `/Users/alexmiller/projects/pvm_cosmos_under_one_roof/CLAUDE.md`
- **Pokerchain README**: `/Users/alexmiller/projects/pvm_cosmos_under_one_roof/pokerchain/readme.md`
- **Pokerchain CLAUDE**: `/Users/alexmiller/projects/pvm_cosmos_under_one_roof/pokerchain/CLAUDE.md`

### Scripts

- **Regenerate types**: `poker-vm/sdk/regenerate-proto-types.sh`
- **Update dependencies**: `poker-vm/sdk/update-dependencies.sh`

### Proto Files

- **Poker module**: `pokerchain/proto/pokerchain/poker/v1/`
- **Generated output**: `pokerchain/ts-client/`

### External Resources

**Ignite CLI**:
- Docs: https://docs.ignite.com/
- TypeScript client: https://docs.ignite.com/clients/typescript
- Install: https://docs.ignite.com/welcome/install

**Telescope**:
- GitHub: https://github.com/cosmology-tech/telescope
- Docs: https://github.com/cosmology-tech/telescope/blob/main/README.md

**ts-proto**:
- GitHub: https://github.com/stephenh/ts-proto
- Docs: https://github.com/stephenh/ts-proto/blob/main/README.markdown

**Protocol Buffers**:
- Language Guide: https://protobuf.dev/programming-guides/proto3/
- Cosmos SDK Proto: https://docs.cosmos.network/main/build/architecture/adr-019-protobuf-state-encoding

---

**Last Updated**: 2025-11-08
**Next Review**: After next Pokerchain proto modification
**Maintainer**: SDK Team
