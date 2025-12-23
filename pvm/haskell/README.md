# Texas Hold'em - Pure Functional Haskell Implementation

A deterministic, pure functional implementation of Texas Hold'em poker game logic in Haskell. Designed for integration with blockchain-based poker applications where reproducibility and determinism are essential.

## Features

- **Pure Functional**: All game logic is pure with no side effects
- **Deterministic**: Same inputs always produce same outputs (critical for blockchain)
- **Complete Hand Evaluation**: Full poker hand ranking from High Card to Royal Flush
- **Side Pot Support**: Proper calculation of main and side pots for all-in situations
- **Action Validation**: Comprehensive validation of all player actions
- **Modular Design**: Clean separation of concerns across modules

## Project Structure

```text
pvm/haskell/
├── src/
│   └── TexasHoldem/
│       ├── Card.hs        -- Card, Suit, Rank types
│       ├── Deck.hs        -- Deck management
│       ├── Hand.hs        -- Hole cards, community cards
│       ├── Evaluation.hs  -- Hand ranking and comparison
│       ├── Player.hs      -- Player state
│       ├── Action.hs      -- Player actions
│       ├── Round.hs       -- Betting rounds
│       ├── Pot.hs         -- Pot calculations
│       └── GameState.hs   -- Complete game state
│   └── TexasHoldem.hs     -- Main module (re-exports)
├── app/
│   └── Main.hs            -- Demo application
├── test/
│   └── Main.hs            -- Test suite
└── texas-holdem.cabal     -- Build configuration
```

## Building

```bash
# Build the library
cabal build

# Run the demo
cabal run texas-holdem-demo

# Run tests
cabal test
```

## Usage

```haskell
import TexasHoldem

-- Create a game with players
main :: IO ()
main = do
    let config = defaultConfig
        -- Deterministic shuffle using a seed (from blockchain)
        deck = shuffleDeck 12345 newDeck
        players = [("alice", 0, 100), ("bob", 1, 100)]
        game = newGame config deck players

    -- Deal cards
    case dealHoleCards game of
        Left err -> print err
        Right game' -> do
            -- Process actions...
            print $ gsRound game'

-- Evaluate a hand
evaluateExample :: IO ()
evaluateExample = do
    let cards = mapMaybe fromMnemonic ["AS", "KS", "QS", "JS", "TS"]
    case evaluateHand cards of
        Just eh -> putStrLn $ rankName (ehRank eh)  -- "Royal Flush"
        Nothing -> putStrLn "Invalid hand"

-- Find best hand from 7 cards
bestHandExample :: IO ()
bestHandExample = do
    let cards = mapMaybe fromMnemonic
            ["AS", "KS", "QS", "JS", "TS", "2H", "3D"]
    case evaluateBestHand cards of
        Just eh -> putStrLn $ rankName (ehRank eh)  -- "Royal Flush"
        Nothing -> putStrLn "Not enough cards"
```

## Hand Rankings

Hands are ranked from lowest to highest:

1. **High Card** - No matching cards
2. **One Pair** - Two cards of same rank
3. **Two Pair** - Two different pairs
4. **Three of a Kind** - Three cards of same rank
5. **Straight** - Five consecutive ranks (Ace can be low: A-2-3-4-5)
6. **Flush** - Five cards of same suit
7. **Full House** - Three of a kind plus a pair
8. **Four of a Kind** - Four cards of same rank
9. **Straight Flush** - Straight with all same suit
10. **Royal Flush** - A-K-Q-J-T of same suit

## Card Notation

Cards use two-character mnemonics:
- **Ranks**: A, 2, 3, 4, 5, 6, 7, 8, 9, T, J, Q, K
- **Suits**: C (Clubs), D (Diamonds), H (Hearts), S (Spades)

Examples: `AS` (Ace of Spades), `TH` (Ten of Hearts), `2C` (Two of Clubs)

## Game Flow

1. **Ante**: Small blind and big blind are posted
2. **PreFlop**: Hole cards dealt, first betting round
3. **Flop**: Three community cards dealt, betting round
4. **Turn**: Fourth community card dealt, betting round
5. **River**: Fifth community card dealt, final betting round
6. **Showdown**: Remaining players reveal cards, winner determined

## Determinism for Blockchain

The library is designed for blockchain integration:

- `shuffleDeck` takes a seed (Integer) for reproducible shuffling from blockchain randomness
- `shuffleWithBytes` accepts raw bytes (e.g., from a block hash) for shuffling
- All game state transitions are pure functions
- No hidden state or randomness during gameplay
- Actions can be replayed to verify game state

### Seed-Based Shuffling

```haskell
-- Using an integer seed (e.g., from VRF)
let deck = shuffleDeck 12345 newDeck

-- Using bytes from a block hash
let blockHash = [0xAB, 0xCD, 0xEF, ...]  -- 32 bytes
    deck = shuffleWithBytes blockHash newDeck
```

The shuffle uses xorshift64 PRNG with Fisher-Yates algorithm - deterministic and unbiased.

## License

MIT License - see LICENSE file
