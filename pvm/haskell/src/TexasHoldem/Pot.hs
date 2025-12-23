{-|
Module      : TexasHoldem.Pot
Description : Pot management and side pot calculations
Copyright   : (c) Block52, 2025
License     : MIT
Maintainer  : dev@block52.xyz

This module handles pot calculations including main pot and side pots
for all-in situations.
-}
module TexasHoldem.Pot
    ( -- * Types
      Pot(..)
    , SidePot(..)
    , PotState(..)
      -- * Constructors
    , emptyPotState
      -- * Operations
    , addToPot
    , calculateSidePots
    , totalPot
    , distributePot
      -- * Utilities
    , rakeAmount
    ) where

import TexasHoldem.Player

import Data.List (sortBy, groupBy, nub)
import Data.Ord (comparing)
import qualified Data.Map.Strict as Map

-- | A pot with amount and eligible players
data Pot = Pot
    { potAmount   :: !Chips
    , potEligible :: ![PlayerId]  -- ^ Players eligible to win this pot
    } deriving (Eq, Show)

-- | A side pot created when a player goes all-in
data SidePot = SidePot
    { sidePotAmount   :: !Chips
    , sidePotEligible :: ![PlayerId]
    , sidePotAllInAmount :: !Chips  -- ^ The all-in amount that created this pot
    } deriving (Eq, Show)

-- | Complete pot state including main pot and side pots
data PotState = PotState
    { mainPot     :: !Chips
    , sidePots    :: ![SidePot]
    , playerBets  :: !(Map.Map PlayerId Chips)  -- ^ Total bets per player
    } deriving (Eq, Show)

-- | Create an empty pot state
emptyPotState :: PotState
emptyPotState = PotState
    { mainPot    = 0
    , sidePots   = []
    , playerBets = Map.empty
    }

-- | Add a bet to the pot from a player
addToPot :: PlayerId -> Chips -> PotState -> PotState
addToPot pid amount ps = ps
    { mainPot    = mainPot ps + amount
    , playerBets = Map.insertWith (+) pid amount (playerBets ps)
    }

-- | Get total pot (main + all side pots)
totalPot :: PotState -> Chips
totalPot ps = mainPot ps + sum (map sidePotAmount (sidePots ps))

-- | Calculate side pots based on player bets and all-in amounts
-- Returns a list of pots from smallest (main) to largest (side)
calculateSidePots :: [(PlayerId, Chips, Bool)] -> [Pot]
                  -- ^ (PlayerId, total bet, is all-in)
calculateSidePots playerData
    | null playerData = []
    | otherwise = buildPots sortedBets
  where
    -- Sort by bet amount ascending
    sortedBets = sortBy (comparing (\(_, bet, _) -> bet)) playerData

    -- Get unique all-in amounts
    allInAmounts = nub $ map (\(_, bet, _) -> bet)
                       $ filter (\(_, _, isAllIn) -> isAllIn) sortedBets

    buildPots :: [(PlayerId, Chips, Bool)] -> [Pot]
    buildPots bets = go 0 (sortBy compare $ 0 : allInAmounts) bets
      where
        go _ [] _ = []
        go _ _ [] = []
        go prevLevel (level:levels) players =
            let -- Amount each player contributes to this pot level
                contribution = level - prevLevel
                -- Players who can contribute to this pot
                contributors = filter (\(_, bet, _) -> bet >= level) players
                -- Players eligible to win (contributed full amount)
                eligible = map (\(pid, _, _) -> pid) contributors
                -- Total pot at this level
                potAmt = contribution * fromIntegral (length contributors)
            in if potAmt > 0 && not (null eligible)
               then Pot potAmt eligible : go level levels players
               else go level levels players

-- | Distribute pot to winners
-- Takes pot state, list of winners for each pot, returns winnings per player
distributePot :: PotState -> [[PlayerId]] -> Map.Map PlayerId Chips
distributePot ps winnersByPot =
    let pots = calculateSidePots $ Map.toList (playerBets ps) `zip3`
                                   repeat False -- Simplified, needs all-in info
    in Map.empty  -- TODO: Implement full distribution

  where
    zip3 :: [(a, b)] -> [c] -> [(a, b, c)]
    zip3 ((a, b):xs) (c:ys) = (a, b, c) : zip3 xs ys
    zip3 _ _ = []

-- | Calculate rake amount given pot and rake percentage
-- Takes pot amount, rake percentage (0-100), and rake cap
rakeAmount :: Chips -> Int -> Chips -> Chips
rakeAmount pot rakePercent rakeCap =
    min rakeCap $ (pot * fromIntegral rakePercent) `div` 100
