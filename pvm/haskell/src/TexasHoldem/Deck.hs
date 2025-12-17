{-|
Module      : TexasHoldem.Deck
Description : Deck management for poker
Copyright   : (c) Block52, 2024
License     : MIT
Maintainer  : dev@block52.xyz

This module provides a pure functional interface for managing a deck of cards.
The deck operations are deterministic and suitable for blockchain integration
where shuffling is provided externally.
-}
module TexasHoldem.Deck
    ( -- * Types
      Deck(..)
      -- * Constructors
    , newDeck
    , fromCards
    , fromMnemonics
      -- * Operations
    , shuffle
    , draw
    , drawN
    , peek
    , peekN
    , remaining
    , isEmpty
      -- * Utilities
    , shuffleWithSeed
    ) where

import TexasHoldem.Card

import Data.List (sortBy)
import Data.Ord (comparing)
import System.Random (RandomGen, uniformR)

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

-- | Shuffle the deck using Fisher-Yates algorithm with a random generator
-- This is a pure function that returns the shuffled deck and updated generator
shuffle :: RandomGen g => g -> Deck -> (Deck, g)
shuffle gen (Deck cs) = (Deck shuffled, gen')
  where
    (shuffled, gen') = fisherYates gen cs

-- | Shuffle the deck using a seed for reproducibility
-- Useful for deterministic/blockchain scenarios
shuffleWithSeed :: Int -> Deck -> Deck
shuffleWithSeed seed deck = fst $ shuffle (mkStdGen' seed) deck
  where
    -- Simple linear congruential generator for deterministic shuffling
    mkStdGen' :: Int -> SimpleGen
    mkStdGen' = SimpleGen

-- | Simple deterministic random generator for reproducible shuffles
newtype SimpleGen = SimpleGen Int

instance RandomGen SimpleGen where
    genWord64 (SimpleGen s) =
        let s' = (s * 1103515245 + 12345) `mod` (2^31)
        in (fromIntegral s', SimpleGen s')
    split g = (g, g)  -- Not truly split, but sufficient for shuffling

-- | Fisher-Yates shuffle algorithm (pure functional version)
fisherYates :: RandomGen g => g -> [a] -> ([a], g)
fisherYates gen [] = ([], gen)
fisherYates gen xs = go gen (length xs - 1) xs
  where
    go g 0 ys = (ys, g)
    go g i ys =
        let (j, g') = uniformR (0, i) g
            ys' = swap i j ys
        in go g' (i - 1) ys'

    swap :: Int -> Int -> [a] -> [a]
    swap i j xs'
        | i == j    = xs'
        | otherwise =
            let xi = xs' !! i
                xj = xs' !! j
            in [ if k == i then xj else if k == j then xi else x
               | (k, x) <- zip [0..] xs' ]
