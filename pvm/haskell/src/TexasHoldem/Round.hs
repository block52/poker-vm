{-|
Module      : TexasHoldem.Round
Description : Betting rounds for Texas Hold'em
Copyright   : (c) Block52, 2024
License     : MIT
Maintainer  : dev@block52.xyz

This module defines the betting rounds in a Texas Hold'em hand.
-}
module TexasHoldem.Round
    ( -- * Types
      Round(..)
      -- * Queries
    , isPreFlop
    , isPostFlop
    , numCommunityCards
      -- * Progression
    , nextRound
    , allRounds
    ) where

-- | Betting rounds in Texas Hold'em
data Round
    = Ante      -- ^ Blinds are posted
    | PreFlop   -- ^ After deal, before flop
    | Flop      -- ^ After 3 community cards
    | Turn      -- ^ After 4th community card
    | River     -- ^ After 5th community card
    | Showdown  -- ^ Players reveal cards
    | Complete  -- ^ Hand is finished
    deriving (Eq, Ord, Show, Read, Enum, Bounded)

-- | Check if round is pre-flop
isPreFlop :: Round -> Bool
isPreFlop PreFlop = True
isPreFlop _       = False

-- | Check if round is post-flop (Flop, Turn, or River)
isPostFlop :: Round -> Bool
isPostFlop r = r `elem` [Flop, Turn, River]

-- | Number of community cards that should be visible in each round
numCommunityCards :: Round -> Int
numCommunityCards Ante     = 0
numCommunityCards PreFlop  = 0
numCommunityCards Flop     = 3
numCommunityCards Turn     = 4
numCommunityCards River    = 5
numCommunityCards Showdown = 5
numCommunityCards Complete = 5

-- | Get the next round (returns Nothing if already Complete)
nextRound :: Round -> Maybe Round
nextRound Complete = Nothing
nextRound r        = Just $ succ r

-- | All rounds in order
allRounds :: [Round]
allRounds = [minBound .. maxBound]
