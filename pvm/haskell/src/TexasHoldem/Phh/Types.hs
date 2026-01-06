{-|
Module      : TexasHoldem.Phh.Types
Description : Data types for PHH (Poker Hand History) format
Copyright   : (c) Block52, 2025
License     : MIT

PHH format data types for parsing and representing poker hand histories.
-}
module TexasHoldem.Phh.Types
    ( -- * Hand History Types
      PhhHand(..)
    , PhhAction(..)
    , PhhActionType(..)
    , PhhRound(..)
      -- * Result Types
    , PhhRunResult(..)
    , PhhStats(..)
    , emptyStats
    , addSuccess
    , addFailure
    ) where

import TexasHoldem.Card (Card)

-- | A complete poker hand history from PHH format
data PhhHand = PhhHand
    { phhVariant           :: !String           -- ^ Game variant (e.g., "NT" for No-Limit Texas Hold'em)
    , phhAnteTrimming      :: !Bool             -- ^ Ante trimming status
    , phhAntes             :: ![Int]            -- ^ Antes for each seat
    , phhBlinds            :: ![Int]            -- ^ Blinds/straddles for each seat
    , phhMinBet            :: !Int              -- ^ Minimum bet size
    , phhStartingStacks    :: ![Int]            -- ^ Starting stack for each player
    , phhActions           :: ![PhhAction]      -- ^ List of actions in the hand
    , phhHandNumber        :: !Int              -- ^ Hand number
    , phhPlayers           :: ![String]         -- ^ Player names
    , phhFinishingStacks   :: ![Int]            -- ^ Finishing stacks (for validation)
    , phhFilePath          :: !FilePath         -- ^ Source file path
    } deriving (Show, Eq)

-- | A single action in PHH format
data PhhAction = PhhAction
    { phhActType    :: !PhhActionType   -- ^ Type of action
    , phhActPlayer  :: !(Maybe Int)     -- ^ Player number (1-indexed), Nothing for deal actions
    , phhActAmount  :: !(Maybe Int)     -- ^ Bet/raise amount if applicable
    , phhActCards   :: ![Card]          -- ^ Cards involved (for deal actions)
    , phhActRaw     :: !String          -- ^ Raw action string for debugging
    } deriving (Show, Eq)

-- | Types of actions in PHH format
data PhhActionType
    = DealHole          -- ^ Deal hole cards to a player (d dh)
    | DealBoard         -- ^ Deal community cards (d db)
    | Fold              -- ^ Player folds (f)
    | CheckBetRaise     -- ^ Check, bet, or raise depending on context (cbr)
    | Call              -- ^ Call current bet (cc)
    | ShowMuck          -- ^ Show or muck cards at showdown (sm)
    | StandPat          -- ^ Stand pat (for draw games) (sd)
    deriving (Show, Eq)

-- | Betting round for tracking state
data PhhRound
    = PhhPreflop
    | PhhFlop
    | PhhTurn
    | PhhRiver
    | PhhShowdown
    deriving (Show, Eq, Ord)

-- | Result of running a single PHH hand through the engine
data PhhRunResult = PhhRunResult
    { prrSuccess        :: !Bool        -- ^ Whether the hand completed successfully
    , prrActionsRun     :: !Int         -- ^ Number of actions executed
    , prrTotalActions   :: !Int         -- ^ Total actions in the hand
    , prrError          :: !(Maybe String)  -- ^ Error message if failed
    , prrFilePath       :: !FilePath    -- ^ Source file path
    } deriving (Show, Eq)

-- | Statistics for PHH test runs
data PhhStats = PhhStats
    { psTotal       :: !Int     -- ^ Total hands tested
    , psSuccess     :: !Int     -- ^ Successful hands
    , psFailed      :: !Int     -- ^ Failed hands
    , psErrors      :: ![(String, Int)]  -- ^ Error messages and counts
    } deriving (Show, Eq)

-- | Empty statistics
emptyStats :: PhhStats
emptyStats = PhhStats 0 0 0 []

-- | Add a successful run to statistics
addSuccess :: PhhStats -> PhhStats
addSuccess stats = stats
    { psTotal = psTotal stats + 1
    , psSuccess = psSuccess stats + 1
    }

-- | Add a failed run to statistics
addFailure :: String -> PhhStats -> PhhStats
addFailure err stats = stats
    { psTotal = psTotal stats + 1
    , psFailed = psFailed stats + 1
    , psErrors = updateErrors err (psErrors stats)
    }
  where
    updateErrors e [] = [(e, 1)]
    updateErrors e ((e', n):rest)
        | e == e'   = (e', n + 1) : rest
        | otherwise = (e', n) : updateErrors e rest
