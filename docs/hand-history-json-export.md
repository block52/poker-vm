# Hand History JSON Export

## Overview

The Poker VM UI now supports exporting complete hand history as JSON format. This feature allows developers and testers to:
- Debug game play issues
- Analyze game state at any point
- Share specific hands for review
- Create test cases from real games

## How to Use

1. Navigate to any active poker table
2. Open the History sidebar (click the sidebar toggle button on the right side of the screen)
3. In the History panel header, you'll see two buttons:
   - **Copy** button (clipboard icon) - Copies human-readable action log
   - **Copy as JSON** button (download icon) - Copies complete game state as JSON
4. Click the "Copy as JSON" button
5. The complete game state will be copied to your clipboard as formatted JSON
6. A success notification will appear and the button icon will briefly change to a checkmark

### Button Location
```
┌──────────────────────────────────┐
│ History                    📋 📥 │ ← Buttons in header
├──────────────────────────────────┤
│ Action log entries...            │
│                                  │
│ player1 (Seat 1): Raise $50     │
│ player2 (Seat 2): Call $50      │
│ ...                              │
└──────────────────────────────────┘

Legend:
📋 = Copy history as text
📥 = Copy hand history as JSON (NEW)
```

## JSON Structure

The exported JSON contains the complete `TexasHoldemStateDTO` object, which includes:

### Game Information
- `type`: Game type (cash, sit-and-go, tournament)
- `address`: Table address/ID
- `gameOptions`: Game configuration (blinds, buy-ins, timeouts, etc.)
- `handNumber`: Current hand number
- `actionCount`: Total actions in current hand
- `round`: Current round (ante, preflop, flop, turn, river, showdown, end)

### Players
- `players`: Array of player objects with:
  - `address`: Player's blockchain address
  - `seat`: Seat number (1-9)
  - `stack`: Current chip stack (as string for BigInt precision)
  - `isSmallBlind`, `isBigBlind`, `isDealer`: Position flags
  - `holeCards`: Player's hole cards (visible only to that player)
  - `status`: Player status (active, folded, all-in, sitting-out, etc.)
  - `lastAction`: Last action performed by the player
  - `legalActions`: Available actions for the player
  - `sumOfBets`: Total amount bet in current round

### Board and Pots
- `communityCards`: Array of community cards on the board
- `pots`: Array of pot amounts (main pot and side pots)
- `deck`: Encrypted deck (for security)

### Action History
- `previousActions`: Complete history of all actions taken, including:
  - `playerId`: Player address
  - `seat`: Player's seat number
  - `action`: Action type (fold, call, raise, check, etc.)
  - `amount`: Amount involved (for bets/raises)
  - `round`: Round when action occurred
  - `index`: Action sequence number
  - `timestamp`: Unix timestamp

### Game Results
- `winners`: Array of winner objects with payout information
- `results`: Tournament/sit-and-go placement results
- `nextToAct`: Seat number of next player to act
- `lastActedSeat`: Seat number of last player who acted

## Example JSON

```json
{
  "type": "cash",
  "address": "0x1234...abcd",
  "gameOptions": {
    "minBuyIn": "20000000",
    "maxBuyIn": "100000000",
    "smallBlind": "10000",
    "bigBlind": "20000",
    "minPlayers": 2,
    "maxPlayers": 9,
    "timeout": 30
  },
  "handNumber": 42,
  "actionCount": 15,
  "round": "river",
  "players": [
    {
      "address": "cosmos1abc...",
      "seat": 1,
      "stack": "1500000",
      "isDealer": true,
      "isSmallBlind": false,
      "isBigBlind": false,
      "holeCards": ["AS", "KH"],
      "status": "active",
      "sumOfBets": "50000"
    }
  ],
  "communityCards": ["QH", "JD", "TC", "9S", "2C"],
  "pots": ["150000"],
  "previousActions": [
    {
      "playerId": "cosmos1abc...",
      "seat": 1,
      "action": "raise",
      "amount": "50000",
      "round": "river",
      "index": 14,
      "timestamp": 1704067200
    }
  ],
  "nextToAct": 2,
  "winners": []
}
```

## Use Cases

### Debugging
Export hand history when encountering unexpected behavior to share with developers.

### Testing
Create test cases based on real game scenarios by exporting the state at specific points.

### Analysis
Analyze betting patterns, pot odds, and decision-making by reviewing complete game history.

### Reporting Issues
When reporting bugs, include the hand history JSON to provide complete context.

## Privacy Note

The JSON export includes:
- Your own hole cards (visible to you)
- Other players' hole cards (only if revealed during showdown)
- All player addresses and chip stacks
- Complete betting history

Be mindful when sharing hand history as it may contain sensitive information.
