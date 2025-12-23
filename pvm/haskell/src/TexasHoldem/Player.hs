{-|
Module      : TexasHoldem.Player
Description : Player types and operations for Texas Hold'em
Copyright   : (c) Block52, 2025
License     : MIT
Maintainer  : dev@block52.xyz

This module defines player state, status, and basic player operations.
-}
module TexasHoldem.Player
    ( -- * Types
      PlayerId
    , Chips
    , SeatIndex
    , PlayerStatus(..)
    , Player(..)
      -- * Constructors
    , mkPlayer
    , mkPlayerWithCards
      -- * Queries
    , isActive
    , isFolded
    , isAllIn
    , canAct
    , hasCards
      -- * Modifications
    , setStatus
    , setChips
    , addChips
    , subtractChips
    , dealCards
    , clearCards
    , fold
    , goAllIn
    ) where

import TexasHoldem.Card
import TexasHoldem.Hand

-- | Unique identifier for a player (typically an address or ID)
type PlayerId = String

-- | Chip count (using Integer for arbitrary precision)
type Chips = Integer

-- | Seat position at the table (0-indexed)
type SeatIndex = Int

-- | Status of a player in the current hand
data PlayerStatus
    = Waiting      -- ^ Not in current hand, waiting to join
    | Active       -- ^ In the hand and can act
    | Folded       -- ^ Has folded this hand
    | AllIn        -- ^ Has gone all-in
    | Showing      -- ^ At showdown, showing cards
    | Mucked       -- ^ At showdown, mucked cards
    deriving (Eq, Show, Read, Ord)

-- | A player at the table
data Player = Player
    { playerId      :: !PlayerId
    , playerSeat    :: !SeatIndex
    , playerChips   :: !Chips
    , playerStatus  :: !PlayerStatus
    , playerCards   :: !(Maybe HoleCards)
    , playerBet     :: !Chips  -- ^ Current bet in this betting round
    , playerTotalBet :: !Chips  -- ^ Total bet in this hand
    } deriving (Eq, Show)

-- | Create a new player with chips but no cards
mkPlayer :: PlayerId -> SeatIndex -> Chips -> Player
mkPlayer pid seat chips = Player
    { playerId      = pid
    , playerSeat    = seat
    , playerChips   = chips
    , playerStatus  = Waiting
    , playerCards   = Nothing
    , playerBet     = 0
    , playerTotalBet = 0
    }

-- | Create a player with hole cards already dealt
mkPlayerWithCards :: PlayerId -> SeatIndex -> Chips -> HoleCards -> Player
mkPlayerWithCards pid seat chips cards = (mkPlayer pid seat chips)
    { playerStatus = Active
    , playerCards  = Just cards
    }

-- | Check if player is active (can still win the pot)
isActive :: Player -> Bool
isActive p = playerStatus p `elem` [Active, AllIn, Showing]

-- | Check if player has folded
isFolded :: Player -> Bool
isFolded p = playerStatus p == Folded

-- | Check if player is all-in
isAllIn :: Player -> Bool
isAllIn p = playerStatus p == AllIn

-- | Check if player can take an action (not folded, not all-in)
canAct :: Player -> Bool
canAct p = playerStatus p == Active

-- | Check if player has hole cards
hasCards :: Player -> Bool
hasCards = maybe False (const True) . playerCards

-- | Set player status
setStatus :: PlayerStatus -> Player -> Player
setStatus status p = p { playerStatus = status }

-- | Set player chip count
setChips :: Chips -> Player -> Player
setChips chips p = p { playerChips = chips }

-- | Add chips to player
addChips :: Chips -> Player -> Player
addChips amount p = p { playerChips = playerChips p + amount }

-- | Subtract chips from player
subtractChips :: Chips -> Player -> Player
subtractChips amount p = p { playerChips = max 0 (playerChips p - amount) }

-- | Deal hole cards to a player
dealCards :: HoleCards -> Player -> Player
dealCards cards p = p
    { playerCards  = Just cards
    , playerStatus = Active
    }

-- | Clear a player's hole cards (after hand ends)
clearCards :: Player -> Player
clearCards p = p
    { playerCards   = Nothing
    , playerStatus  = Waiting
    , playerBet     = 0
    , playerTotalBet = 0
    }

-- | Fold a player's hand
fold :: Player -> Player
fold = setStatus Folded

-- | Put a player all-in
goAllIn :: Player -> Player
goAllIn = setStatus AllIn
