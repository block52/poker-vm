# Poker Solver Implementation for Issue #1159

## Problem Summary

**Issue #1159**: Critical bug in poker hand evaluation where straight loses to high card

### Root Cause Analysis

The issue was caused by inconsistencies in the `pokersolver` npm package:

1. **Inconsistent Methods**: The `compare()` and `winners()` methods in pokersolver return contradictory results
2. **Specific Bug**: When comparing a pair of 10s vs a pair of 5s:
    - `compare()` returns `-1` (indicating Player 2 with pair of 5s wins)
    - `winners()` returns Player 1 (pair of 10s) as the winner
3. **Impact**: This inconsistency leads to incorrect winner determination in poker games

### Bug Reproduction

```typescript
// Test case from bugs.test.ts
const PokerSolver = require("pokersolver");
const community = ["7D", "3C", "TC", "6D", "8H"];
const player1Cards = ["TD", "5C"].concat(community); // Pair of 10s
const player2Cards = ["5D", "5H"].concat(community); // Pair of 5s

const player1Hand = PokerSolver.Hand.solve(player1Cards);
const player2Hand = PokerSolver.Hand.solve(player2Cards);

const comparison = player1Hand.compare(player2Hand);
const winners = PokerSolver.Hand.winners([player1Hand, player2Hand]);

// BUG: Inconsistent results
console.log(comparison); // -1 (Player 2 wins)
console.log(winners); // [Player 1 hand] (Player 1 wins)
```

## Solution: Custom Poker Solver

We implemented a custom TypeScript poker solver that:

1. **Uses Block52 Card Structure**: Integrates with existing `Card` and `SUIT` types
2. **Consistent Logic**: Both comparison and winner determination use the same evaluation algorithm
3. **Texas Hold'em Optimized**: Specifically designed for 7-card poker (2 hole cards + 5 community cards)
4. **Comprehensive Testing**: Full test suite covering all hand types and edge cases

### Key Features

#### Hand Types Supported

-   High Card
-   Pair
-   Two Pair
-   Three of a Kind
-   Straight (including low straight A-2-3-4-5)
-   Flush
-   Full House
-   Four of a Kind
-   Straight Flush
-   Royal Flush

#### Core Methods

```typescript
// Find best 5-card hand from 7 cards
PokerSolver.findBestHand(cards: Card[]): HandEvaluation

// Compare two hands (consistent with winners)
PokerSolver.compareHands(hand1: HandEvaluation, hand2: HandEvaluation): number

// Find winners from multiple hands
PokerSolver.findWinners(hands: HandEvaluation[]): number[]
```

#### Card Integration

```typescript
// Uses existing Block52 card structure
interface Card {
    suit: SUIT; // CLUBS=1, DIAMONDS=2, HEARTS=3, SPADES=4
    rank: number; // 1=Ace, 2-10=number cards, 11=J, 12=Q, 13=K
    value: number; // Unique card identifier
    mnemonic: string; // e.g., "AS", "KH", "2C"
}
```

### Implementation Details

#### Rank Handling

-   **Input**: Ace = 1, King = 13 (Block52 format)
-   **Internal**: Ace = 14 for high-ace calculations
-   **Special Case**: Low straight (A-2-3-4-5) where Ace = 1

#### Hand Evaluation Algorithm

1. **Generate Combinations**: All possible 5-card hands from 7 cards (21 combinations)
2. **Evaluate Each**: Determine hand type and ranking values
3. **Find Best**: Select highest-ranking hand
4. **Consistent Comparison**: Same logic for `compareHands` and `findWinners`

#### Tiebreaking System

Each hand evaluation includes `rankValues` array for tiebreaking:

-   **Pair**: `[pair_rank, kicker1, kicker2, kicker3]`
-   **Two Pair**: `[high_pair, low_pair, kicker]`
-   **Straight**: `[high_card]` (5 for wheel)
-   **Flush**: `[card1, card2, card3, card4, card5]` (high to low)

### Test Results

#### Original Pokersolver (Buggy)

```
Player 1: Pair, 10's - cards: ['10d', '10c', '8h', '7d', '6d']
Player 2: Pair, 5's - cards: ['5d', '5h', '10c', '8h', '7d']
compare() result: -1 (Player 2 wins)
winners() result: ["Pair, 10's"] (Player 1 wins)
BUG CONFIRMED: pokersolver methods are inconsistent!
```

#### Custom Solver (Fixed)

```
Player 1: Pair - rank values: [10, 8, 7, 6]
Player 2: Pair - rank values: [5, 10, 8, 7]
Custom compare() result: 1 (Player 1 wins)
Custom winners() result: Player [1]
SUCCESS: Custom poker solver is consistent!
```

### Files Created/Modified

1. **`/src/models/pokerSolver.ts`**: Main poker solver implementation
2. **`/tests/pokerSolver.test.ts`**: Comprehensive test suite (17 test cases)
3. **`/tests/bugs.test.ts`**: Added comparison between buggy and fixed solvers

### Performance

-   **Combinations**: Evaluates all 21 possible 5-card combinations from 7 cards
-   **Efficiency**: Fast evaluation suitable for real-time poker games
-   **Memory**: Minimal memory footprint with no external dependencies

### Integration

The custom solver can be easily integrated into the existing game engine:

```typescript
import { PokerSolver } from "./models/pokerSolver";

// Replace pokersolver usage
const handEvaluation = PokerSolver.findBestHand(playerCards);
const winners = PokerSolver.findWinners(allPlayerHands);
```

### Future Considerations

1. **Omaha Support**: Extend for 4-hole-card variants
2. **Performance Optimization**: Lookup tables for common patterns
3. **Tournament Features**: Side pot calculations
4. **Validation**: Additional edge case testing

## Conclusion

The custom poker solver successfully resolves issue #1159 by providing:

-   ✅ Consistent hand comparison logic
-   ✅ Accurate winner determination
-   ✅ Integration with existing Block52 card system
-   ✅ Comprehensive test coverage
-   ✅ Texas Hold'em optimization

This implementation eliminates the poker hand evaluation inconsistencies that were causing incorrect game results.
