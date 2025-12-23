{-|
Module      : TexasHoldem
Description : Pure functional Texas Hold'em poker implementation
Copyright   : (c) Block52, 2025
License     : MIT
Maintainer  : dev@block52.xyz

This is the main module for the Texas Hold'em poker library.
It re-exports all necessary types and functions for using the library.

= Overview

This library provides a complete, pure functional implementation of
Texas Hold'em poker suitable for integration with blockchain-based
applications where determinism is required.

= Example Usage

@
import TexasHoldem

-- Create a game with two players
main :: IO ()
main = do
    let config = defaultConfig
        deck = shuffleDeck 12345 newDeck
        players = [("alice", 0, 100), ("bob", 1, 100)]
        game = newGame config deck players

    -- Deal cards and play
    case dealHoleCards game of
        Left err -> print err
        Right game' -> do
            -- Post blinds, bet, etc.
            print $ gsRound game'
@

= Modules

The library is organized into the following modules:

* "TexasHoldem.Card" - Card, Suit, and Rank types
* "TexasHoldem.Deck" - Deck management and shuffling
* "TexasHoldem.Hand" - Hole cards and community cards
* "TexasHoldem.Evaluation" - Hand ranking and comparison
* "TexasHoldem.Player" - Player state and operations
* "TexasHoldem.Action" - Player actions and validation
* "TexasHoldem.Round" - Betting rounds
* "TexasHoldem.Pot" - Pot and side pot calculations
* "TexasHoldem.GameState" - Complete game state management
* "TexasHoldem.BetManager" - Bet tracking for betting rounds
* "TexasHoldem.DealerManager" - Dealer button and position management
-}
module TexasHoldem
    ( -- * Re-exports
      -- ** Card Types
      module TexasHoldem.Card
      -- ** Deck Operations
    , module TexasHoldem.Deck
      -- ** Hand Types
    , module TexasHoldem.Hand
      -- ** Hand Evaluation
    , module TexasHoldem.Evaluation
      -- ** Player Types
    , module TexasHoldem.Player
      -- ** Actions
    , module TexasHoldem.Action
      -- ** Rounds
    , module TexasHoldem.Round
      -- ** Pot Management
    , module TexasHoldem.Pot
      -- ** Game State
    , module TexasHoldem.GameState
      -- ** Bet Management
    , module TexasHoldem.BetManager
      -- ** Dealer Management
    , module TexasHoldem.DealerManager
    ) where

import TexasHoldem.Card
import TexasHoldem.Deck
import TexasHoldem.Hand hiding (Flop)  -- Flop is also in Round
import TexasHoldem.Evaluation
import TexasHoldem.Player hiding (AllIn)  -- AllIn is also in Action
import TexasHoldem.Action
import TexasHoldem.Round
import TexasHoldem.Pot
import TexasHoldem.GameState hiding (getAllBets, rotateDealer)  -- Also in BetManager/DealerManager
import TexasHoldem.BetManager
import TexasHoldem.DealerManager
