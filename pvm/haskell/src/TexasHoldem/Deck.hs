{-|
Module      : TexasHoldem.Deck
Description : Deck management with deterministic seed-based shuffling
Copyright   : (c) Block52, 2025
License     : MIT
Maintainer  : dev@block52.xyz

This module provides a pure functional interface for managing a deck of cards.
Shuffling is done via a seed, making it deterministic and suitable for
blockchain integration where the seed is provided by the consensus layer.

The serialization format is compatible with the TypeScript implementation:
cards separated by dashes (e.g., "AC-2C-3C-...-[7S]-...") where brackets
indicate the current top position.
-}
module TexasHoldem.Deck
    ( -- * Types
      Deck(..)
    , DeckState(..)
    , Seed
      -- * Constructors
    , newDeck
    , fromCards
    , fromMnemonics
    , mkDeckState
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
    , getNext
    , deal
      -- * Serialization (TypeScript compatible)
    , deckToString
    , deckFromString
    , deckStateToString
    , deckStateFromString
    ) where

import TexasHoldem.Card

import Data.Bits (xor, shiftL, shiftR, (.|.))
import Data.Word (Word64, Word8)
import Data.List (foldl', intercalate)
import Data.Maybe (mapMaybe)

-- | Seed for deterministic shuffling
-- Can be derived from blockchain randomness (block hash, VRF output, etc.)
type Seed = Integer

-- | A deck of cards represented as a list (top of deck is head)
-- This is the pure functional representation.
newtype Deck = Deck { unDeck :: [Card] }
    deriving (Eq, Show)

-- | Deck state with position tracking (for TypeScript compatibility)
-- Tracks both the full deck and the current top position.
data DeckState = DeckState
    { dsCards :: ![Card]  -- ^ All 52 cards in order
    , dsTop   :: !Int     -- ^ Current top position (0-indexed)
    } deriving (Eq, Show)

-- | Create a new standard 52-card deck in sorted order
-- Order: Clubs (A-K), Diamonds (A-K), Hearts (A-K), Spades (A-K)
newDeck :: Deck
newDeck = Deck allCards

-- | Create a deck from a list of cards
fromCards :: [Card] -> Deck
fromCards = Deck

-- | Create a deck from card mnemonics (e.g., ["AS", "KH", "QD"])
fromMnemonics :: [String] -> Maybe Deck
fromMnemonics mnemonics = Deck <$> traverse fromMnemonic mnemonics

-- | Create a DeckState from a Deck (position starts at 0)
mkDeckState :: Deck -> DeckState
mkDeckState (Deck cards) = DeckState cards 0

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

-- | Get next card from DeckState (TypeScript compatible)
-- Returns the card and updated state with advanced position
getNext :: DeckState -> Maybe (Card, DeckState)
getNext ds
    | dsTop ds >= length (dsCards ds) = Nothing
    | otherwise = Just (dsCards ds !! dsTop ds, ds { dsTop = dsTop ds + 1 })

-- | Deal multiple cards from DeckState (TypeScript compatible)
deal :: Int -> DeckState -> Maybe ([Card], DeckState)
deal n ds
    | n < 0 = Nothing
    | dsTop ds + n > length (dsCards ds) = Nothing
    | otherwise = Just (cards, ds { dsTop = dsTop ds + n })
  where
    cards = take n $ drop (dsTop ds) (dsCards ds)

--------------------------------------------------------------------------------
-- Serialization (TypeScript compatible)
--------------------------------------------------------------------------------

-- | Convert a Deck to string format: "AC-2C-3C-...-KS"
-- No position tracking (all cards from beginning)
deckToString :: Deck -> String
deckToString (Deck cards) = intercalate "-" $ map toMnemonic cards

-- | Parse a Deck from string format: "AC-2C-3C-...-KS"
-- Ignores any position markers (brackets)
deckFromString :: String -> Maybe Deck
deckFromString str = do
    let mnemonics = map stripBrackets $ splitOn '-' str
    cards <- traverse fromMnemonic mnemonics
    if length cards == 52
        then Just $ Deck cards
        else Nothing

-- | Convert a DeckState to string format: "AC-2C-...-[7S]-8S-..."
-- Position is indicated by brackets around the card at top position
deckStateToString :: DeckState -> String
deckStateToString ds = intercalate "-" $ zipWith formatCard [0..] (dsCards ds)
  where
    formatCard i card
        | i == dsTop ds = "[" ++ toMnemonic card ++ "]"
        | otherwise     = toMnemonic card

-- | Parse a DeckState from string format: "AC-2C-...-[7S]-8S-..."
-- Bracket position becomes the top index
deckStateFromString :: String -> Maybe DeckState
deckStateFromString str = do
    let parts = splitOn '-' str
    (cards, mTop) <- parseCardsWithPosition parts
    if length cards == 52
        then Just $ DeckState cards (maybe 0 id mTop)
        else Nothing
  where
    parseCardsWithPosition :: [String] -> Maybe ([Card], Maybe Int)
    parseCardsWithPosition parts = go parts 0 [] Nothing
      where
        go [] _ acc pos = Just (reverse acc, pos)
        go (p:ps) i acc pos
            | hasBrackets p = do
                card <- fromMnemonic (stripBrackets p)
                go ps (i+1) (card:acc) (Just i)
            | otherwise = do
                card <- fromMnemonic p
                go ps (i+1) (card:acc) pos

    hasBrackets s = not (null s) && head s == '[' && last s == ']'

-- | Strip brackets from a string "[XX]" -> "XX"
stripBrackets :: String -> String
stripBrackets s
    | length s >= 2 && head s == '[' && last s == ']' = init (tail s)
    | otherwise = s

-- | Split a string on a delimiter
splitOn :: Char -> String -> [String]
splitOn _ "" = []
splitOn delim str = go str ""
  where
    go "" acc = [reverse acc]
    go (c:cs) acc
        | c == delim = reverse acc : go cs ""
        | otherwise  = go cs (c:acc)

--------------------------------------------------------------------------------
-- Internal: Deterministic PRNG and Fisher-Yates shuffle
--------------------------------------------------------------------------------

-- | Simple PRNG state using xorshift algorithm
-- Deterministic: same seed always produces same sequence
newtype PRNG = PRNG Word64

-- | Create a PRNG from a seed
mkPRNG :: Seed -> PRNG
mkPRNG seed = PRNG $ fromIntegral (abs seed `mod` (2^63 - 1)) .|. 1

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
