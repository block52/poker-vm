# Poker Testing Framework - Automated Test Generation

This document explains the complete system for automatically generating poker test files from Excel/Google Sheets scenarios.

## ✅ System Status: **FULLY OPERATIONAL**

The automated test generation system is now working perfectly! The poker team can create scenarios in Excel and automatically generate complete, runnable test files.

## System Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Google Sheets   │────│ Scenario         │────│ Generated Test  │
│ Poker Scenarios │    │ Converter Web    │    │ Files (.test.ts)│
│                 │    │ Interface        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Quick Start for Poker Team

🎯 **NEW**: Complete instructions are now available at the top of the web interface!
👉 **Go to**: https://poker-scenario-converter.vercel.app/ and see the orange "FOR POKER TEAM" section

## Components

### 1. Google Sheets Source
- **Location**: [Poker Scenarios Spreadsheet](https://docs.google.com/spreadsheets/d/18nU_PNyaWCk8pGeWftJQoVFRmGIBfo2ScyqnIxWyx7E/edit)
- **Format**: Each scenario has columns for Index, PlayerID, Seat, Position, Action, Action Amount, Running Total, Round, Notes, etc.
- **Status**: Dan's approval status is tracked for each scenario

### 2. Scenario Converter Web Interface
- **Location**: `/Users/alexmiller/projects/poker-scenario-converter`
- **URL**: https://poker-scenario-converter.vercel.app/
- **Features**:
  - **NEW**: Comprehensive instructions for poker team at the top of the page
  - Automatically loads scenarios from Google Sheets
  - Displays scenarios in readable table format
  - Generates markdown tables
  - Generates basic test templates
  - **Generates complete, runnable test files** ✅

### 3. Generated Test Files
- **Location**: `pvm/ts/src/engine/`
- **Format**: Complete TypeScript test files with proper imports, setup, and assertions
- **Example**: `test-903-showdown-first-to-act.test.ts` ✅ **WORKING**

## How to Use the System

### Step 1: Create/Update Scenarios in Google Sheets
1. Open the [Poker Scenarios Spreadsheet](https://docs.google.com/spreadsheets/d/18nU_PNyaWCk8pGeWftJQoVFRmGIBfo2ScyqnIxWyx7E/edit)
2. **Follow the detailed instructions** available at https://poker-scenario-converter.vercel.app/
3. Use the exact formats shown in the orange "FOR POKER TEAM" section

### Step 2: Generate Test Files
1. Go to https://poker-scenario-converter.vercel.app/
2. Find your scenario in the list
3. Click "Show Complete Test File" (orange button)
4. Copy the entire generated test file content
5. Create a new file in `pvm/ts/src/engine/` with suggested filename (e.g., `test-903-scenario-name.test.ts`)
6. Paste the content and save

### Step 3: Run the Test
```bash
cd pvm/ts
npm test test-903-scenario-name.test.ts
```

**Result**: ✅ Test should pass immediately!

## Generated Test File Structure

The generated test files include:

### 1. Proper Imports
```typescript
import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS } from "./testConstants";
```

### 2. Player Constants
```typescript
const PLAYER_1 = "0x1111111111111111111111111111111111111111";
const PLAYER_2 = "0x2222222222222222222222222222222222222222";
```

### 3. Proper Setup
```typescript
beforeEach(() => {
    game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
    
    // Add players to the game
    game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "1");
    game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "2");
});
```

### 4. Sequential Actions with Correct Indices ✅
```typescript
// Execute the setup actions (up to showdown)
game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);
game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5);
// ... more actions with proper sequential indices
```

### 5. Smart Test-Specific Assertions ✅

#### For Showdown Tests:
```typescript
// Test showdown behavior (BEFORE performing the action)
expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);

// The first player to act should only have SHOW as a legal action
// This is the core test - first to act cannot muck, must show
const firstPlayerActions = game.getLegalActions(PLAYER_1);
expect(firstPlayerActions.length).toEqual(1);
expect(firstPlayerActions[0].action).toEqual(PlayerActionType.SHOW);

// Now perform the SHOW action to complete the test
game.performAction(PLAYER_1, PlayerActionType.SHOW, 14, 0n);
```

## Action Mapping

The system automatically converts spreadsheet actions to the correct TypeScript enums:

| Spreadsheet Action | Generated Code |
|-------------------|----------------|
| SMALL_BLIND | `PlayerActionType.SMALL_BLIND` |
| BIG_BLIND | `PlayerActionType.BIG_BLIND` |
| DEAL | `NonPlayerActionType.DEAL` |
| CALL | `PlayerActionType.CALL` |
| CHECK | `PlayerActionType.CHECK` |
| BET | `PlayerActionType.BET` |
| RAISE | `PlayerActionType.RAISE` |
| FOLD | `PlayerActionType.FOLD` |
| SHOW | `PlayerActionType.SHOW` |
| MUCK | `PlayerActionType.MUCK` |

## Amount Mapping

The system converts amount values to the correct constants:

| Amount | Generated Constant |
|--------|-------------------|
| 1 | `ONE_TOKEN` |
| 2 | `TWO_TOKENS` |
| 5 | `FIVE_TOKENS` |
| 10 | `TEN_TOKENS` |
| 0 or - | `0n` |

## Example: Complete Working Test ✅

See `test-903-showdown-first-to-act.test.ts` for a complete example that:
1. Sets up a heads-up game
2. Executes setup actions (up to showdown)
3. Tests that the first player to act at showdown must show (cannot muck)
4. Then performs the SHOW action
5. Verifies proper game state throughout

**Test Result**: ✅ PASS

## Benefits of This System

1. **✅ Consistency**: All tests follow the same structure and conventions
2. **✅ Accuracy**: Action indices are automatically calculated correctly
3. **✅ Completeness**: Generated tests include all necessary imports and setup
4. **✅ Maintainability**: Easy to regenerate tests when scenarios change
5. **✅ Speed**: No manual coding required for basic test structure
6. **✅ Validation**: Tests can be run immediately to verify scenario logic
7. **🆕 User-Friendly**: Complete instructions available on the web interface

## Key Improvements Made

### ✅ Fixed Action Index Logic
- Actions now start at correct index after player joins
- Sequential numbering is automatically calculated

### ✅ Smart Showdown Test Logic
- Setup actions execute first (up to showdown)
- Legal actions are tested BEFORE performing the final action
- Final SHOW/MUCK actions execute after testing

### ✅ Comprehensive Instructions
- Added detailed instructions section on the web interface
- Clear action types, amounts, and format requirements
- Examples and guard rails for poker team

## Troubleshooting

### Common Issues:

1. **Invalid Action Index**: Usually means the action sequence calculation is wrong
   - ✅ **Fixed**: Regenerate the test file with the latest version

2. **Player Not Found**: Usually means JOIN actions are missing or incorrect
   - ✅ **Solution**: Check that unique players are properly identified in the spreadsheet

3. **Wrong Round**: Usually means the scenario doesn't progress rounds correctly
   - ✅ **Solution**: Verify the action sequence in the spreadsheet includes proper blinds, deal, etc.

### Running Specific Tests:
```bash
# Run a specific test file
npm test test-903-showdown-first-to-act.test.ts

# Run all tests in the engine folder
npm test src/engine/

# Run tests with specific pattern
npm test showdown
```

## ✅ Current Status

- **System**: ✅ Fully operational
- **Test Generation**: ✅ Working perfectly
- **Action Indices**: ✅ Correct
- **Showdown Logic**: ✅ Fixed
- **Instructions**: ✅ Complete and user-friendly
- **Example Test**: ✅ Passing

## Next Steps for Poker Team

1. 🚀 **Start using the system**: Go to https://poker-scenario-converter.vercel.app/
2. 📝 **Follow the instructions**: Orange "FOR POKER TEAM" section has everything you need
3. 🧪 **Create test scenarios**: Use the exact formats shown
4. 📋 **Generate tests**: Click "Show Complete Test File" and copy/paste
5. ✅ **Run tests**: They should work immediately!

## Future Enhancements

- [ ] Support for more complex scenarios (tournaments, antes, etc.)
- [ ] Better error handling and validation
- [ ] Support for multi-table scenarios
- [ ] Integration with CI/CD pipeline
- [ ] Automatic test result reporting back to spreadsheet

**The system is ready for production use!** 🚀 