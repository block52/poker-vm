{-|
Module      : TexasHoldem.Deck
Description : Deck management with deterministic seed-based shuffling
Copyright   : (c) Block52, 2025
License     : MIT
Maintainer  : dev@block52.xyz

This module provides a pure functional interface for managing a deck of cards.
Shuffling is done via a seed, making it deterministic and suitable for
blockchain integration where the seed is provided by the consensus layer.
-}
module TexasHoldem.Deck
    ( -- * Types
      Deck(..)
    , Seed
      -- * Constructors
    , newDeck
    , fromCards
    , fromMnemonics
      -- * Shuffling (seed-based, deterministic)
    , shuffleDeck
    , shuffleWithBytes
      -- * Operations
    , draw
    , drawN
    , peek
    , peekN
    , remaining
    , isEmpty
    ) where

import TexasHoldem.Card

import Data.Bits (xor, shiftL, shiftR)
import Data.Word (Word64)
import Data.List (foldl')

-- | Seed for deterministic shuffling
-- Can be derived from blockchain randomness (block hash, VRF output, etc.)
type Seed = Integer

-- | A deck of cards represented as a list (top of deck is head)
newtype Deck = Deck { unDeck :: [Card] }
    deriving (Eq, Show)

-- | Create a new standard 52-card deck in sorted order
newDeck :: Deck
newDeck = Deck allCards

-- | Create a deck from a list of cards
fromCards :: [Card] -> Deck
fromCards = Deck

-- | Create a deck from card mnemonics (e.g., ["AS", "KH", "QD"])
fromMnemonics :: [String] -> Maybe Deck
fromMnemonics mnemonics = Deck <$> traverse fromMnemonic mnemonics

-- | Shuffle the deck using a seed
-- This is the primary shuffling function - deterministic and reproducible.
-- Same seed always produces the same shuffle.
--
-- Example:
-- @
-- let seed = 12345  -- From blockchain
--     deck = shuffleDeck seed newDeck
-- @
shuffleDeck :: Seed -> Deck -> Deck
shuffleDeck seed (Deck cards) = Deck $ fisherYatesShuffle (mkPRNG seed) cards

-- | Shuffle using a list of bytes (e.g., from a hash)
-- Converts the bytes to a seed and shuffles.
--
-- Example:
-- @
-- let blockHash = [0xAB, 0xCD, 0xEF, ...]  -- 32 bytes from blockchain
--     deck = shuffleWithBytes blockHash newDeck
-- @
shuffleWithBytes :: [Word8] -> Deck -> Deck
shuffleWithBytes bytes = shuffleDeck (bytesToSeed bytes)
  where
    bytesToSeed :: [Word8] -> Seed
    bytesToSeed = foldl' (\acc b -> acc * 256 + fromIntegral b) 0

type Word8 = Word64  -- Simplified, using Word64 for compatibility

-- | Draw the top card from the deck
-- Returns Nothing if deck is empty
draw :: Deck -> Maybe (Card, Deck)
draw (Deck [])     = Nothing
draw (Deck (c:cs)) = Just (c, Deck cs)

-- | Draw n cards from the top of the deck
-- Returns Nothing if not enough cards
drawN :: Int -> Deck -> Maybe ([Card], Deck)
drawN n (Deck cs)
    | n < 0          = Nothing
    | n > length cs  = Nothing
    | otherwise      = Just (take n cs, Deck (drop n cs))

-- | Look at the top card without removing it
peek :: Deck -> Maybe Card
peek (Deck [])    = Nothing
peek (Deck (c:_)) = Just c

-- | Look at the top n cards without removing them
peekN :: Int -> Deck -> Maybe [Card]
peekN n (Deck cs)
    | n < 0         = Nothing
    | n > length cs = Nothing
    | otherwise     = Just (take n cs)

-- | Get the number of cards remaining in the deck
remaining :: Deck -> Int
remaining (Deck cs) = length cs

-- | Check if the deck is empty
isEmpty :: Deck -> Bool
isEmpty (Deck cs) = null cs

--------------------------------------------------------------------------------
-- Internal: Deterministic PRNG and Fisher-Yates shuffle
--------------------------------------------------------------------------------

-- | Simple PRNG state using xorshift algorithm
-- Deterministic: same seed always produces same sequence
newtype PRNG = PRNG Word64

-- | Create a PRNG from a seed
mkPRNG :: Seed -> PRNG
mkPRNG seed = PRNG $ fromIntegral (abs seed `mod` (2^63 - 1)) .|. 1
  where
    (.|.) = xor  -- Ensure non-zero

-- | Generate next random value and updated PRNG (xorshift64)
nextRandom :: PRNG -> (Word64, PRNG)
nextRandom (PRNG s) = (s', PRNG s')
  where
    a = s `xor` (s `shiftL` 13)
    b = a `xor` (a `shiftR` 7)
    s' = b `xor` (b `shiftL` 17)

-- | Generate a random number in range [0, n)
randomInRange :: Int -> PRNG -> (Int, PRNG)
randomInRange n prng = (fromIntegral (r `mod` fromIntegral n), prng')
  where
    (r, prng') = nextRandom prng

-- | Fisher-Yates shuffle using our deterministic PRNG
-- O(n²) but fine for 52 cards
fisherYatesShuffle :: PRNG -> [a] -> [a]
fisherYatesShuffle _ [] = []
fisherYatesShuffle prng xs = go prng (length xs - 1) xs
  where
    go _ 0 ys = ys
    go g i ys =
        let (j, g') = randomInRange (i + 1) g
            ys' = swapAt i j ys
        in go g' (i - 1) ys'

-- | Swap elements at positions i and j in a list
swapAt :: Int -> Int -> [a] -> [a]
swapAt i j xs
    | i == j    = xs
    | i > j     = swapAt j i xs  -- Ensure i < j
    | otherwise =
        let (before, xi:middle) = splitAt i xs
            (between, xj:after) = splitAt (j - i - 1) middle
        in before ++ [xj] ++ between ++ [xi] ++ after
