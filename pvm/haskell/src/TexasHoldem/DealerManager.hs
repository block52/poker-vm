{-|
Module      : TexasHoldem.DealerManager
Description : Dealer button and position management
Copyright   : (c) Block52, 2025
License     : MIT
Maintainer  : dev@block52.xyz

This module manages dealer button position and calculates blind positions.
Handles heads-up special case where dealer posts small blind.
Compatible with the TypeScript DealerPositionManager implementation.
-}
module TexasHoldem.DealerManager
    ( -- * Types
      DealerState(..)
    , Position(..)
      -- * Constructors
    , mkDealerState
      -- * Position Queries
    , getDealerPosition
    , getSmallBlindPosition
    , getBigBlindPosition
    , getPosition
    , getEffectiveDealerPosition
      -- * Player Finding
    , findNextActivePlayer
    , findNextPlayer
      -- * State Updates
    , rotateDealer
    , handleNewHand
    , handlePlayerJoin
    , handlePlayerLeave
      -- * Validation
    , validateDealerPosition
      -- * Utilities
    , isHeadsUp
    ) where

import TexasHoldem.Player

import qualified Data.Map.Strict as Map
import Data.List (find)
import Data.Maybe (isJust, fromMaybe)

-- | Named positions at the table
data Position = Dealer | SmallBlind | BigBlind
    deriving (Eq, Show, Read, Ord, Enum, Bounded)

-- | Dealer management state
data DealerState = DealerState
    { dsDealerSeat   :: !SeatIndex           -- ^ Current dealer button position
    , dsMaxSeats     :: !Int                 -- ^ Maximum seats at table
    , dsMinPlayers   :: !Int                 -- ^ Minimum players to start
    } deriving (Eq, Show)

-- | Create initial dealer state
mkDealerState :: SeatIndex -> Int -> Int -> DealerState
mkDealerState dealerSeat maxSeats minPlayers = DealerState
    { dsDealerSeat = dealerSeat
    , dsMaxSeats   = maxSeats
    , dsMinPlayers = minPlayers
    }

-- | Get current dealer position
getDealerPosition :: DealerState -> SeatIndex
getDealerPosition = dsDealerSeat

-- | Get position by name
getPosition :: Position -> DealerState -> Map.Map SeatIndex Player -> SeatIndex
getPosition pos ds players = case pos of
    Dealer     -> getDealerPosition ds
    SmallBlind -> getSmallBlindPosition ds players
    BigBlind   -> getBigBlindPosition ds players

-- | Get small blind position based on dealer and number of players
-- Heads-up: dealer is small blind
-- 3+ players: next active player after dealer
getSmallBlindPosition :: DealerState -> Map.Map SeatIndex Player -> SeatIndex
getSmallBlindPosition ds players
    | isHeadsUp players = getEffectiveDealerPosition ds players
    | otherwise = case findNextActivePlayer (dsDealerSeat ds) ds players of
        Just p  -> playerSeat p
        Nothing -> nextSeat (dsDealerSeat ds) (dsMaxSeats ds)

-- | Get big blind position based on small blind
-- Heads-up: next player after effective dealer
-- 3+ players: next active player after small blind
getBigBlindPosition :: DealerState -> Map.Map SeatIndex Player -> SeatIndex
getBigBlindPosition ds players
    | isHeadsUp players =
        let effectiveDealer = getEffectiveDealerPosition ds players
        in case findNextActivePlayer effectiveDealer ds players of
            Just p  -> playerSeat p
            Nothing -> nextSeat effectiveDealer (dsMaxSeats ds)
    | otherwise =
        let sbSeat = getSmallBlindPosition ds players
        in case findNextActivePlayer sbSeat ds players of
            Just p  -> playerSeat p
            Nothing -> nextSeat sbSeat (dsMaxSeats ds)

-- | Get effective dealer position (actual player holding button)
-- If dealer seat is empty, finds next active player
getEffectiveDealerPosition :: DealerState -> Map.Map SeatIndex Player -> SeatIndex
getEffectiveDealerPosition ds players =
    case Map.lookup (dsDealerSeat ds) players of
        Just p | isActive p -> dsDealerSeat ds
        _ -> case findNextActivePlayer (dsDealerSeat ds) ds players of
            Just p  -> playerSeat p
            Nothing -> dsDealerSeat ds

-- | Find next active player clockwise from given seat
findNextActivePlayer :: SeatIndex -> DealerState -> Map.Map SeatIndex Player -> Maybe Player
findNextActivePlayer startSeat ds players = findNextPlayerWith isActive startSeat ds players

-- | Find next player (not sitting out) clockwise from given seat
findNextPlayer :: SeatIndex -> DealerState -> Map.Map SeatIndex Player -> Maybe Player
findNextPlayer startSeat ds players = findNextPlayerWith (not . isSittingOut) startSeat ds players
  where
    isSittingOut p = playerStatus p == Waiting

-- | Generic function to find next player matching predicate
findNextPlayerWith :: (Player -> Bool) -> SeatIndex -> DealerState -> Map.Map SeatIndex Player -> Maybe Player
findNextPlayerWith predicate startSeat ds players =
    let maxSeats = dsMaxSeats ds
        -- Search seats from startSeat+1 to maxSeats, then 0 to startSeat
        searchOrder = [nextSeat startSeat maxSeats .. maxSeats - 1]
                   ++ [0 .. startSeat - 1]
        findAtSeat seat = Map.lookup seat players >>= \p ->
            if predicate p then Just p else Nothing
    in foldr (\seat acc -> case acc of
                Nothing -> findAtSeat seat
                just    -> just) Nothing searchOrder

-- | Rotate dealer to next active player
rotateDealer :: DealerState -> Map.Map SeatIndex Player -> DealerState
rotateDealer ds players =
    case findNextActivePlayer (getEffectiveDealerPosition ds players) ds players of
        Just p  -> ds { dsDealerSeat = playerSeat p }
        Nothing -> ds  -- No change if no active players found

-- | Handle new hand - rotates dealer
handleNewHand :: DealerState -> Map.Map SeatIndex Player -> DealerState
handleNewHand = rotateDealer

-- | Handle player joining (dealer doesn't change)
handlePlayerJoin :: SeatIndex -> DealerState -> Map.Map SeatIndex Player -> DealerState
handlePlayerJoin _ ds _ = ds  -- Dealer position doesn't change on join

-- | Handle player leaving
-- If leaving player is dealer, rotate to next player
handlePlayerLeave :: SeatIndex -> DealerState -> Map.Map SeatIndex Player -> DealerState
handlePlayerLeave leavingSeat ds players
    | dsDealerSeat ds == leavingSeat = rotateDealer ds remainingPlayers
    | otherwise = ds
  where
    remainingPlayers = Map.delete leavingSeat players

-- | Validate that dealer position is valid
validateDealerPosition :: DealerState -> Map.Map SeatIndex Player -> Bool
validateDealerPosition ds players =
    case Map.lookup (dsDealerSeat ds) players of
        Nothing -> False
        Just p  -> isActive p

-- | Check if we're in heads-up (2 active players)
isHeadsUp :: Map.Map SeatIndex Player -> Bool
isHeadsUp players = countActivePlayers players == 2

-- | Count active players
countActivePlayers :: Map.Map SeatIndex Player -> Int
countActivePlayers = length . filter isActive . Map.elems

-- | Get next seat clockwise (wrapping around)
nextSeat :: SeatIndex -> Int -> SeatIndex
nextSeat current maxSeats = (current + 1) `mod` maxSeats
