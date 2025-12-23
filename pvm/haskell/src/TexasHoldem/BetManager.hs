{-|
Module      : TexasHoldem.BetManager
Description : Bet tracking and management for betting rounds
Copyright   : (c) Block52, 2025
License     : MIT
Maintainer  : dev@block52.xyz

This module tracks bets within a betting round, providing functions to
query bet totals, largest bets, raise amounts, and last aggressor information.
Compatible with the TypeScript BetManager implementation.
-}
module TexasHoldem.BetManager
    ( -- * Types
      BetManager(..)
    , BetAction(..)
      -- * Constructors
    , emptyBetManager
    , mkBetManager
      -- * Operations
    , addBet
    , addBets
      -- * Queries
    , getTotalBetsForPlayer
    , getLargestBet
    , getLargestBetPlayer
    , getRaisedAmount
    , getLastAggressor
    , getLastAggressorBet
    , getBetCount
    , getAllBets
    , getCurrentBet
    , getPreviousBet
    , getBetDelta
    ) where

import TexasHoldem.Player (PlayerId, Chips)
import TexasHoldem.Action (ActionType(..))

import qualified Data.Map.Strict as Map
import Data.List (sortBy, foldl')
import Data.Ord (comparing, Down(..))

-- | A bet action record
data BetAction = BetAction
    { baIndex    :: !Int         -- ^ Action index for ordering
    , baPlayerId :: !PlayerId    -- ^ Player who made the bet
    , baAmount   :: !Chips       -- ^ Amount bet
    , baAction   :: !ActionType  -- ^ Type of action (Bet, Raise, Call, etc.)
    } deriving (Eq, Show)

-- | Bet manager state for a betting round
data BetManager = BetManager
    { bmBets       :: !(Map.Map PlayerId Chips)  -- ^ Total bets per player
    , bmActions    :: ![BetAction]               -- ^ All bet actions in order
    , bmBigBlind   :: !Chips                     -- ^ Big blind for min raise calc
    } deriving (Eq, Show)

-- | Create an empty bet manager
emptyBetManager :: Chips -> BetManager
emptyBetManager bb = BetManager
    { bmBets     = Map.empty
    , bmActions  = []
    , bmBigBlind = bb
    }

-- | Create a bet manager with initial actions
mkBetManager :: Chips -> [BetAction] -> BetManager
mkBetManager bb actions = addBets actions (emptyBetManager bb)

-- | Add a single bet action
addBet :: BetAction -> BetManager -> BetManager
addBet action bm = bm
    { bmBets    = Map.insertWith (+) (baPlayerId action) (baAmount action) (bmBets bm)
    , bmActions = bmActions bm ++ [action]
    }

-- | Add multiple bet actions (sorted by index)
addBets :: [BetAction] -> BetManager -> BetManager
addBets actions bm = foldl' (flip addBet) bm sortedActions
  where
    sortedActions = sortBy (comparing baIndex) actions

-- | Get total bets for a specific player in this round
getTotalBetsForPlayer :: PlayerId -> BetManager -> Chips
getTotalBetsForPlayer pid bm = Map.findWithDefault 0 pid (bmBets bm)

-- | Get all bets as a map
getAllBets :: BetManager -> Map.Map PlayerId Chips
getAllBets = bmBets

-- | Get the largest bet amount in the round
getLargestBet :: BetManager -> Chips
getLargestBet bm
    | Map.null (bmBets bm) = 0
    | otherwise = maximum $ Map.elems (bmBets bm)

-- | Get the player with the largest bet
getLargestBetPlayer :: BetManager -> Maybe (PlayerId, Chips)
getLargestBetPlayer bm
    | Map.null (bmBets bm) = Nothing
    | otherwise = Just $ foldl1 maxBet $ Map.toList (bmBets bm)
  where
    maxBet (p1, a1) (p2, a2)
        | a2 > a1   = (p2, a2)
        | otherwise = (p1, a1)

-- | Get the number of unique players who have bet
getBetCount :: BetManager -> Int
getBetCount = Map.size . bmBets

-- | Get the current (last) player's total bet
getCurrentBet :: BetManager -> Chips
getCurrentBet bm
    | null (bmActions bm) = 0
    | otherwise = getTotalBetsForPlayer lastPlayer bm
  where
    lastPlayer = baPlayerId $ last (bmActions bm)

-- | Get the previous player's total bet
getPreviousBet :: BetManager -> Chips
getPreviousBet bm
    | length (bmActions bm) < 2 = 0
    | otherwise = getTotalBetsForPlayer prevPlayer bm
  where
    prevPlayer = baPlayerId $ (bmActions bm) !! (length (bmActions bm) - 2)

-- | Get the delta between current and previous bet
getBetDelta :: BetManager -> Chips
getBetDelta bm = getCurrentBet bm - getPreviousBet bm

-- | Get the last raise amount (for minimum raise calculation)
-- Returns big blind if no raises have occurred
getRaisedAmount :: BetManager -> Chips
getRaisedAmount bm
    | Map.null (bmBets bm) = bmBigBlind bm
    | Map.size (bmBets bm) == 1 = bmBigBlind bm
    | not hasNonBlindActions = bmBigBlind bm
    | otherwise = max (bmBigBlind bm) raiseDelta
  where
    -- Check if there are any bet/raise actions (not just blinds)
    hasNonBlindActions = any isBetOrRaise (bmActions bm)

    isBetOrRaise :: BetAction -> Bool
    isBetOrRaise ba = baAction ba `elem` [Bet, Raise]

    -- Get sorted bets descending
    sortedBets = sortBy (comparing (Down . snd)) $ Map.toList (bmBets bm)

    -- Raise delta is difference between two largest bets
    raiseDelta = case sortedBets of
        ((_, largest):(_, second):_) -> largest - second
        _ -> bmBigBlind bm

-- | Get the last aggressor's bet amount
-- Returns 0 if last action was passive (call, check)
getLastAggressor :: BetManager -> Chips
getLastAggressor bm
    | null (bmActions bm) = 0
    | isPassive lastAction = 0
    | isAggressive lastAction = findAggressorAmount
    | otherwise = 0
  where
    lastAction = last (bmActions bm)

    isPassive ba = baAction ba `elem` [Call, Check]
    isAggressive ba = baAction ba `elem` [Bet, Raise, PostSmallBlind, PostBigBlind, AllIn]

    -- Find if there was a previous bet/raise by a different player
    findAggressorAmount =
        let prevBetRaises = filter isBetOrRaise $ init (bmActions bm)
            isBetOrRaise ba = baAction ba `elem` [Bet, Raise]
        in case prevBetRaises of
            [] -> getTotalBetsForPlayer (baPlayerId lastAction) bm
            (prev:_)
                | baPlayerId prev == baPlayerId lastAction -> 0
                | otherwise -> getTotalBetsForPlayer (baPlayerId lastAction) bm

-- | Get the last aggressor's bet amount (from aggregated bets)
getLastAggressorBet :: BetManager -> Chips
getLastAggressorBet bm
    | null (bmActions bm) = 0
    | otherwise = getTotalBetsForPlayer lastPlayer bm
  where
    lastPlayer = baPlayerId $ last (bmActions bm)
