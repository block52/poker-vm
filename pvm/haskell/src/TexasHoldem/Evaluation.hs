{-|
Module      : TexasHoldem.Evaluation
Description : Poker hand evaluation and comparison
Copyright   : (c) Block52, 2025
License     : MIT
Maintainer  : dev@block52.xyz

This module provides comprehensive hand evaluation for Texas Hold'em,
including ranking hands, comparing hands, and finding winners.
-}
module TexasHoldem.Evaluation
    ( -- * Types
      HandRank(..)
    , EvaluatedHand(..)
      -- * Evaluation
    , evaluateHand
    , evaluateBestHand
    , rankName
      -- * Comparison
    , compareHands
    , findWinners
      -- * Utilities
    , combinations
    , allFiveCardCombinations
    ) where

import TexasHoldem.Card
import TexasHoldem.Hand

import Data.List (sortBy, groupBy, maximumBy)
import Data.Ord (comparing, Down(..))
import Data.Function (on)

-- | Poker hand rankings from lowest to highest
data HandRank
    = HighCard      [Int]  -- ^ Kickers in descending order
    | OnePair       Int [Int]  -- ^ Pair rank, kickers
    | TwoPair       Int Int [Int]  -- ^ High pair, low pair, kicker
    | ThreeOfAKind  Int [Int]  -- ^ Trips rank, kickers
    | Straight      Int  -- ^ High card of straight
    | Flush         [Int]  -- ^ Card values in descending order
    | FullHouse     Int Int  -- ^ Trips rank, pair rank
    | FourOfAKind   Int [Int]  -- ^ Quads rank, kicker
    | StraightFlush Int  -- ^ High card of straight flush
    | RoyalFlush    -- ^ Ace-high straight flush
    deriving (Eq, Ord, Show)

-- | An evaluated hand with its rank and the cards that make it
data EvaluatedHand = EvaluatedHand
    { ehRank  :: !HandRank
    , ehCards :: ![Card]
    } deriving (Eq, Show)

instance Ord EvaluatedHand where
    compare = comparing ehRank

-- | Get human-readable name for a hand rank
rankName :: HandRank -> String
rankName RoyalFlush        = "Royal Flush"
rankName (StraightFlush h) = "Straight Flush, " ++ highCardName h ++ " high"
rankName (FourOfAKind r _) = "Four of a Kind, " ++ rankNameSingle r ++ "s"
rankName (FullHouse t p)   = "Full House, " ++ rankNameSingle t ++ "s full of " ++ rankNameSingle p ++ "s"
rankName (Flush _)         = "Flush"
rankName (Straight h)      = "Straight, " ++ highCardName h ++ " high"
rankName (ThreeOfAKind r _)= "Three of a Kind, " ++ rankNameSingle r ++ "s"
rankName (TwoPair h l _)   = "Two Pair, " ++ rankNameSingle h ++ "s and " ++ rankNameSingle l ++ "s"
rankName (OnePair r _)     = "Pair of " ++ rankNameSingle r ++ "s"
rankName (HighCard (h:_))  = highCardName h ++ " High"
rankName (HighCard [])     = "High Card"

highCardName :: Int -> String
highCardName = rankNameSingle

rankNameSingle :: Int -> String
rankNameSingle 14 = "Ace"
rankNameSingle 13 = "King"
rankNameSingle 12 = "Queen"
rankNameSingle 11 = "Jack"
rankNameSingle 10 = "Ten"
rankNameSingle 9  = "Nine"
rankNameSingle 8  = "Eight"
rankNameSingle 7  = "Seven"
rankNameSingle 6  = "Six"
rankNameSingle 5  = "Five"
rankNameSingle 4  = "Four"
rankNameSingle 3  = "Three"
rankNameSingle 2  = "Two"
rankNameSingle 1  = "Ace"
rankNameSingle n  = show n

-- | Evaluate a 5-card hand and return its rank
evaluateHand :: [Card] -> Maybe EvaluatedHand
evaluateHand cards
    | length cards /= 5 = Nothing
    | otherwise = Just $ EvaluatedHand rank cards
  where
    rank = classifyHand cards

-- | Find the best 5-card hand from any number of cards (typically 7)
-- This evaluates all possible 5-card combinations
evaluateBestHand :: [Card] -> Maybe EvaluatedHand
evaluateBestHand cards
    | length cards < 5 = Nothing
    | length cards == 5 = evaluateHand cards
    | otherwise = Just $ maximumBy (comparing ehRank) evaluatedHands
  where
    fiveCardCombos = combinations 5 cards
    evaluatedHands = [EvaluatedHand (classifyHand combo) combo | combo <- fiveCardCombos]

-- | Generate all 5-card combinations from available cards
allFiveCardCombinations :: [Card] -> [[Card]]
allFiveCardCombinations = combinations 5

-- | Generate all k-combinations of a list
combinations :: Int -> [a] -> [[a]]
combinations 0 _      = [[]]
combinations _ []     = []
combinations k (x:xs) = map (x:) (combinations (k-1) xs) ++ combinations k xs

-- | Classify a 5-card hand into its rank
classifyHand :: [Card] -> HandRank
classifyHand cards
    | isRoyalFlush     = RoyalFlush
    | isStraightFlush  = StraightFlush straightHigh
    | isFourOfAKind    = FourOfAKind quadsRank quadsKickers
    | isFullHouse      = FullHouse fullHouseTrips fullHousePair
    | isFlush          = Flush flushValues
    | isStraight       = Straight straightHigh
    | isThreeOfAKind   = ThreeOfAKind tripsRank tripsKickers
    | isTwoPair        = TwoPair highPairRank lowPairRank twoPairKickers
    | isOnePair        = OnePair pairRank pairKickers
    | otherwise        = HighCard highCardValues
  where
    -- Convert to high-ace values and sort descending
    values = sortBy (comparing Down) $ map (highAceValue . cardRank) cards
    suits  = map cardSuit cards

    -- Group by value for counting
    grouped = sortBy (comparing (Down . length)) $ groupBy (==) $ sortBy compare values
    counts  = map length grouped
    groupValues = map head grouped

    -- Flush check: all same suit
    isFlush = all (== head suits) suits
    flushValues = values

    -- Straight check
    isStraight = isSequential values || isWheel values
    straightHigh
        | isWheel values = 5  -- A-2-3-4-5 has 5 as high
        | otherwise      = maximum values

    isSequential vs =
        let sorted = sortBy compare vs
        in sorted == [minimum vs .. maximum vs]

    -- Wheel: A-2-3-4-5 (Ace plays low)
    isWheel vs = sortBy compare vs == [2, 3, 4, 5, 14]

    -- Straight flush
    isStraightFlush = isFlush && isStraight

    -- Royal flush: A-K-Q-J-T of same suit
    isRoyalFlush = isStraightFlush && straightHigh == 14 && not (isWheel values)

    -- Four of a kind
    isFourOfAKind = counts == [4, 1]
    quadsRank = head groupValues
    quadsKickers = tail groupValues

    -- Full house
    isFullHouse = counts == [3, 2]
    fullHouseTrips = head groupValues
    fullHousePair = groupValues !! 1

    -- Three of a kind
    isThreeOfAKind = head counts == 3 && length counts == 3
    tripsRank = head groupValues
    tripsKickers = take 2 $ tail groupValues

    -- Two pair
    isTwoPair = counts == [2, 2, 1]
    highPairRank = maximum $ take 2 groupValues
    lowPairRank = minimum $ take 2 groupValues
    twoPairKickers = drop 2 groupValues

    -- One pair
    isOnePair = head counts == 2 && length counts == 4
    pairRank = head groupValues
    pairKickers = tail groupValues

    -- High card
    highCardValues = values

-- | Compare two evaluated hands
-- Returns LT, EQ, or GT
compareHands :: EvaluatedHand -> EvaluatedHand -> Ordering
compareHands = comparing ehRank

-- | Find the winner(s) from a list of evaluated hands
-- Returns indices of winning hands (can be multiple in case of tie)
findWinners :: [EvaluatedHand] -> [Int]
findWinners [] = []
findWinners hands =
    let indexed = zip [0..] hands
        maxRank = maximum $ map ehRank hands
    in [i | (i, h) <- indexed, ehRank h == maxRank]
