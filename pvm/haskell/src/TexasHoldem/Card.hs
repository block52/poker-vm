{-|
Module      : TexasHoldem.Card
Description : Card, Suit, and Rank types for poker
Copyright   : (c) Block52, 2025
License     : MIT
Maintainer  : dev@block52.xyz

This module provides the fundamental types for representing playing cards
in a standard 52-card deck used for Texas Hold'em poker.
-}
module TexasHoldem.Card
    ( -- * Types
      Suit(..)
    , Rank(..)
    , Card(..)
      -- * Constructors
    , mkCard
    , fromMnemonic
      -- * Accessors
    , toMnemonic
    , cardValue
    , allSuits
    , allRanks
    , allCards
      -- * Comparison helpers
    , rankValue
    , highAceValue
    ) where

import Data.Char (toUpper)
import Data.List (find)

-- | Suit of a playing card
data Suit = Clubs | Diamonds | Hearts | Spades
    deriving (Eq, Ord, Enum, Bounded, Show, Read)

-- | Rank of a playing card (Ace through King)
-- Ace is represented as rank 1, but can be high (14) in straights
data Rank
    = Ace | Two | Three | Four | Five | Six | Seven
    | Eight | Nine | Ten | Jack | Queen | King
    deriving (Eq, Ord, Enum, Bounded, Show, Read)

-- | A playing card with a suit and rank
data Card = Card
    { cardRank :: !Rank
    , cardSuit :: !Suit
    } deriving (Eq, Show, Read)

-- | Cards are ordered by rank first, then by suit
instance Ord Card where
    compare c1 c2 = case compare (cardRank c1) (cardRank c2) of
        EQ -> compare (cardSuit c1) (cardSuit c2)
        x  -> x

-- | Create a card from rank and suit
mkCard :: Rank -> Suit -> Card
mkCard = Card

-- | Get numeric value of a rank (Ace=1, Two=2, ..., King=13)
rankValue :: Rank -> Int
rankValue r = fromEnum r + 1

-- | Get high ace value (Ace=14, Two=2, ..., King=13)
-- Used for hand evaluation where Ace is high
highAceValue :: Rank -> Int
highAceValue Ace = 14
highAceValue r   = rankValue r

-- | Get a unique numeric value for a card (0-51)
-- Formula: suit * 13 + rank
cardValue :: Card -> Int
cardValue (Card r s) = fromEnum s * 13 + fromEnum r

-- | Convert a card to its two-character mnemonic (e.g., "AS" for Ace of Spades)
toMnemonic :: Card -> String
toMnemonic (Card r s) = rankChar r : [suitChar s]
  where
    rankChar :: Rank -> Char
    rankChar Ace   = 'A'
    rankChar Two   = '2'
    rankChar Three = '3'
    rankChar Four  = '4'
    rankChar Five  = '5'
    rankChar Six   = '6'
    rankChar Seven = '7'
    rankChar Eight = '8'
    rankChar Nine  = '9'
    rankChar Ten   = 'T'
    rankChar Jack  = 'J'
    rankChar Queen = 'Q'
    rankChar King  = 'K'

    suitChar :: Suit -> Char
    suitChar Clubs    = 'C'
    suitChar Diamonds = 'D'
    suitChar Hearts   = 'H'
    suitChar Spades   = 'S'

-- | Parse a card from its two-character mnemonic
fromMnemonic :: String -> Maybe Card
fromMnemonic [r, s] = Card <$> parseRank (toUpper r) <*> parseSuit (toUpper s)
  where
    parseRank :: Char -> Maybe Rank
    parseRank 'A' = Just Ace
    parseRank '2' = Just Two
    parseRank '3' = Just Three
    parseRank '4' = Just Four
    parseRank '5' = Just Five
    parseRank '6' = Just Six
    parseRank '7' = Just Seven
    parseRank '8' = Just Eight
    parseRank '9' = Just Nine
    parseRank 'T' = Just Ten
    parseRank 'J' = Just Jack
    parseRank 'Q' = Just Queen
    parseRank 'K' = Just King
    parseRank _   = Nothing

    parseSuit :: Char -> Maybe Suit
    parseSuit 'C' = Just Clubs
    parseSuit 'D' = Just Diamonds
    parseSuit 'H' = Just Hearts
    parseSuit 'S' = Just Spades
    parseSuit _   = Nothing
fromMnemonic _ = Nothing

-- | All suits in standard order
allSuits :: [Suit]
allSuits = [minBound .. maxBound]

-- | All ranks in standard order (Ace low to King)
allRanks :: [Rank]
allRanks = [minBound .. maxBound]

-- | All 52 cards in a standard deck
allCards :: [Card]
allCards = [Card r s | s <- allSuits, r <- allRanks]
