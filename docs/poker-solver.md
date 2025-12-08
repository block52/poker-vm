# Poker Solver Implementation

## Overview

Custom TypeScript poker solver for Texas Hold'em that fixes the critical bug (Issue #1159) where the original pokersolver npm package had inconsistent hand evaluation.

## Problem Solved

The original pokersolver package had inconsistent methods:
- `compare()` and `winners()` returned contradictory results
- Example: Pair of 10s vs Pair of 5s would give different winners depending on method used

## Solution

We implemented a custom poker solver that:
1. Uses Block52 Card Structure - integrates with existing `Card` and `SUIT` types
2. Consistent Logic - both comparison and winner determination use the same algorithm
3. Texas Hold'em Optimized - designed for 7-card poker (2 hole + 5 community)

## Hand Types Supported

- High Card
- Pair
- Two Pair
- Three of a Kind
- Straight (including low straight A-2-3-4-5)
- Flush
- Full House
- Four of a Kind
- Straight Flush
- Royal Flush

## Core API

```typescript
import { PokerSolver } from "./models/pokerSolver";
import { PokerGameIntegration } from "./models/pokerGameIntegration";

// Find best 5-card hand from 7 cards
const evaluation = PokerSolver.findBestHand(sevenCards);

// Compare two hands
const result = PokerSolver.compareHands(hand1, hand2); // 1, -1, or 0

// Find winners from multiple hands
const winnerIndices = PokerSolver.findWinners(allHands);

// Game integration - evaluate showdown
const { winners, evaluations } = PokerGameIntegration.evaluateShowdown(playerHands);
```

## Card Format

Uses existing Block52 card structure:

```typescript
interface Card {
    suit: SUIT;      // CLUBS=1, DIAMONDS=2, HEARTS=3, SPADES=4
    rank: number;    // 1=Ace, 2-10=number, 11=J, 12=Q, 13=K
    value: number;   // Unique card identifier
    mnemonic: string; // e.g., "AS", "KH", "2C"
}
```

## Files

- `/pvm/ts/src/models/pokerSolver.ts` - Core poker evaluation engine
- `/pvm/ts/src/models/pokerGameIntegration.ts` - Game integration utilities
- `/pvm/ts/tests/pokerSolver.test.ts` - Test suite (17 test cases)
- `/pvm/ts/tests/pokerGameIntegration.test.ts` - Integration tests

## Test Results

All tests passing:
- 17/17 core solver tests
- 6/6 integration tests
- All 10 poker hand types correctly identified
- Consistent comparison and winner logic
- Proper tiebreaking with rank values
