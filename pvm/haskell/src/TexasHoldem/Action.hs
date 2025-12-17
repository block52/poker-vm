{-|
Module      : TexasHoldem.Action
Description : Player actions for Texas Hold'em
Copyright   : (c) Block52, 2024
License     : MIT
Maintainer  : dev@block52.xyz

This module defines all possible player actions and their validation.
-}
module TexasHoldem.Action
    ( -- * Types
      Action(..)
    , ActionType(..)
    , ActionResult(..)
    , BetRange(..)
      -- * Validation
    , validateAction
    , getValidActions
    , getBetRange
      -- * Action descriptions
    , actionName
    , isAggressive
    , requiresAmount
    ) where

import TexasHoldem.Player
import TexasHoldem.Round

-- | Types of actions a player can take
data ActionType
    = PostSmallBlind
    | PostBigBlind
    | Fold
    | Check
    | Call
    | Bet
    | Raise
    | AllIn
    | Show
    | Muck
    deriving (Eq, Show, Read, Ord, Enum, Bounded)

-- | A complete action with player, type, and amount
data Action = Action
    { actionPlayer :: !PlayerId
    , actionType   :: !ActionType
    , actionAmount :: !Chips
    } deriving (Eq, Show)

-- | Result of attempting an action
data ActionResult
    = ActionOk
    | ActionInvalidPlayer String
    | ActionNotYourTurn
    | ActionInvalidType String
    | ActionInvalidAmount String
    | ActionInsufficientChips
    | ActionNotAllowed String
    deriving (Eq, Show)

-- | Valid bet range (minimum and maximum)
data BetRange = BetRange
    { betMin :: !Chips
    , betMax :: !Chips
    } deriving (Eq, Show)

-- | Validate an action given the current game context
validateAction :: Action
               -> Player           -- ^ The player taking action
               -> Round            -- ^ Current round
               -> Chips            -- ^ Current bet to match
               -> Chips            -- ^ Last raise amount
               -> Chips            -- ^ Big blind
               -> ActionResult
validateAction action player round currentBet lastRaise bigBlind
    -- Check player status
    | not (canAct player) && actionType action `notElem` [Show, Muck] =
        ActionNotAllowed "Player cannot act"

    -- Validate by action type
    | otherwise = case actionType action of

        PostSmallBlind
            | round /= Ante -> ActionNotAllowed "Can only post blinds in ante round"
            | otherwise -> ActionOk

        PostBigBlind
            | round /= Ante -> ActionNotAllowed "Can only post blinds in ante round"
            | otherwise -> ActionOk

        Fold -> ActionOk  -- Can always fold

        Check
            | currentBet > playerBet player ->
                ActionNotAllowed "Cannot check, there is a bet to call"
            | otherwise -> ActionOk

        Call
            | currentBet <= playerBet player ->
                ActionNotAllowed "Nothing to call"
            | actionAmount action /= amountToCall ->
                ActionInvalidAmount $ "Call amount should be " ++ show amountToCall
            | amountToCall > playerChips player ->
                ActionInsufficientChips
            | otherwise -> ActionOk

        Bet
            | currentBet > 0 ->
                ActionNotAllowed "Cannot bet, there is already a bet (use raise)"
            | actionAmount action < bigBlind ->
                ActionInvalidAmount $ "Minimum bet is " ++ show bigBlind
            | actionAmount action > playerChips player ->
                ActionInsufficientChips
            | otherwise -> ActionOk

        Raise
            | currentBet == 0 ->
                ActionNotAllowed "Cannot raise, no bet to raise (use bet)"
            | actionAmount action < minRaise ->
                ActionInvalidAmount $ "Minimum raise is " ++ show minRaise
            | actionAmount action > playerChips player ->
                ActionInsufficientChips
            | otherwise -> ActionOk

        AllIn -> ActionOk  -- Can always go all-in

        Show
            | round /= Showdown ->
                ActionNotAllowed "Can only show at showdown"
            | otherwise -> ActionOk

        Muck
            | round /= Showdown ->
                ActionNotAllowed "Can only muck at showdown"
            | otherwise -> ActionOk

  where
    amountToCall = currentBet - playerBet player
    minRaise = currentBet + max lastRaise bigBlind

-- | Get all valid action types for a player in the current context
getValidActions :: Player -> Round -> Chips -> Chips -> [ActionType]
getValidActions player round currentBet lastRaise
    | round == Ante = [PostSmallBlind, PostBigBlind]
    | round == Showdown = [Show, Muck]
    | not (canAct player) = []
    | otherwise = baseActions ++ bettingActions
  where
    baseActions = [Fold, AllIn]

    bettingActions
        | currentBet == 0 = [Check, Bet]
        | currentBet <= playerBet player = [Check]
        | currentBet - playerBet player >= playerChips player = [Call]  -- Must call or fold
        | otherwise = [Call, Raise]

-- | Get the valid bet range for bet/raise actions
getBetRange :: Player -> Round -> Chips -> Chips -> Chips -> BetRange
getBetRange player _round currentBet lastRaise bigBlind
    | currentBet == 0 = BetRange bigBlind (playerChips player)  -- Bet range
    | otherwise = BetRange minRaise (playerChips player)        -- Raise range
  where
    minRaise = currentBet + max lastRaise bigBlind

-- | Human-readable name for an action type
actionName :: ActionType -> String
actionName PostSmallBlind = "Post Small Blind"
actionName PostBigBlind   = "Post Big Blind"
actionName Fold           = "Fold"
actionName Check          = "Check"
actionName Call           = "Call"
actionName Bet            = "Bet"
actionName Raise          = "Raise"
actionName AllIn          = "All-In"
actionName Show           = "Show"
actionName Muck           = "Muck"

-- | Check if an action is aggressive (bet, raise, all-in)
isAggressive :: ActionType -> Bool
isAggressive Bet   = True
isAggressive Raise = True
isAggressive AllIn = True
isAggressive _     = False

-- | Check if an action requires an amount
requiresAmount :: ActionType -> Bool
requiresAmount PostSmallBlind = True
requiresAmount PostBigBlind   = True
requiresAmount Call           = True
requiresAmount Bet            = True
requiresAmount Raise          = True
requiresAmount AllIn          = True
requiresAmount _              = False
