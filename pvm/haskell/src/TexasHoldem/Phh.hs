{-|
Module      : TexasHoldem.Phh
Description : PHH (Poker Hand History) format support
Copyright   : (c) Block52, 2025
License     : MIT

This module provides support for parsing and running PHH format poker hand histories
through the Texas Hold'em engine for fuzzing and validation testing.
-}
module TexasHoldem.Phh
    ( -- * Types (re-exported)
      module TexasHoldem.Phh.Types
      -- * Parsing (re-exported)
    , module TexasHoldem.Phh.Parser
      -- * Running
    , runPhhHand
    , runPhhDirectory
    , phhToGameConfig
    ) where

import TexasHoldem.Phh.Types
import TexasHoldem.Phh.Parser

import TexasHoldem.Card
import TexasHoldem.Deck
import TexasHoldem.GameState
import TexasHoldem.Action
import TexasHoldem.Round
import TexasHoldem.Player (PlayerId, Chips, mkPlayer, setStatus, PlayerStatus(..))

import qualified Data.Map.Strict as Map
import Data.List (foldl')
import Control.Monad (foldM)

-- | Convert PHH hand to game configuration
phhToGameConfig :: PhhHand -> GameConfig
phhToGameConfig phh = GameConfig
    { configSmallBlind  = fromIntegral $ head $ phhBlinds phh
    , configBigBlind    = fromIntegral $ (phhBlinds phh !! 1)
    , configMinBuyIn    = 0  -- Not enforced in PHH replay
    , configMaxBuyIn    = maxBound  -- Not enforced
    , configMaxPlayers  = length $ phhPlayers phh
    , configRakePercent = 0  -- No rake in replay
    , configRakeCap     = 0
    }

-- | Run a single PHH hand through the engine
runPhhHand :: PhhHand -> PhhRunResult
runPhhHand phh = case runHand phh of
    Left (actNum, err) -> PhhRunResult
        { prrSuccess = False
        , prrActionsRun = actNum
        , prrTotalActions = length (phhActions phh)
        , prrError = Just $ "Action " ++ show actNum ++ " failed: " ++ err
        , prrFilePath = phhFilePath phh
        }
    Right _ -> PhhRunResult
        { prrSuccess = True
        , prrActionsRun = length (phhActions phh)
        , prrTotalActions = length (phhActions phh)
        , prrError = Nothing
        , prrFilePath = phhFilePath phh
        }

-- | Internal: run the hand and return error with action number or success
runHand :: PhhHand -> Either (Int, String) GameState
runHand phh = do
    let config = phhToGameConfig phh
        numPlayers = length $ phhPlayers phh
        playerData = [(playerIdFromNum i, i - 1, fromIntegral $ phhStartingStacks phh !! (i - 1))
                     | i <- [1..numPlayers]]

        -- Create initial deck (will be overridden by deal actions)
        deck = newDeck

        -- Create initial game state
        initialGs = newGame config deck playerData

    -- Process each action
    foldM (processAction phh) (initialGs, 0, PhhPreflop) (zip [1..] $ phhActions phh)
        >>= \(gs, _, _) -> Right gs

-- | Process a single PHH action
processAction :: PhhHand
              -> (GameState, Chips, PhhRound)  -- ^ (current state, current bet, round)
              -> (Int, PhhAction)               -- ^ (action number, action)
              -> Either (Int, String) (GameState, Chips, PhhRound)
processAction phh (gs, currentBet, phhRound) (actNum, phhAct) =
    case phhActType phhAct of
        DealHole -> do
            -- Deal hole cards - update player's cards
            -- For now, just skip deal actions as the engine handles dealing differently
            Right (gs, currentBet, phhRound)

        DealBoard -> do
            -- Deal community cards - advance round
            let newRound = advancePhhRound phhRound
            Right (gs, 0, newRound)  -- Reset current bet on new street

        Fold -> do
            case phhActPlayer phhAct of
                Nothing -> Left (actNum, "Fold action missing player")
                Just p -> do
                    let action = Action (playerIdFromNum p) Fold 0
                    case performAction action gs of
                        Left err -> Left (actNum, show err)
                        Right gs' -> Right (gs', currentBet, phhRound)

        Call -> do
            case phhActPlayer phhAct of
                Nothing -> Left (actNum, "Call action missing player")
                Just p -> do
                    let callAmount = currentBet  -- Simplified: call the current bet
                        action = Action (playerIdFromNum p) Call callAmount
                    case performAction action gs of
                        Left err -> Left (actNum, show err)
                        Right gs' -> Right (gs', currentBet, phhRound)

        CheckBetRaise -> do
            case phhActPlayer phhAct of
                Nothing -> Left (actNum, "CheckBetRaise action missing player")
                Just p -> do
                    let amount = fromIntegral $ maybe 0 id (phhActAmount phhAct)
                        -- Determine action type based on current bet
                        actType = if currentBet == 0 then Bet else Raise
                        action = Action (playerIdFromNum p) actType amount
                    case performAction action gs of
                        Left err -> Left (actNum, show err)
                        Right gs' -> Right (gs', amount, phhRound)

        ShowMuck -> do
            case phhActPlayer phhAct of
                Nothing -> Left (actNum, "ShowMuck action missing player")
                Just p -> do
                    -- Show action - can be out of turn in showdown
                    let action = Action (playerIdFromNum p) Show 0
                    case performAction action gs of
                        Left err -> Left (actNum, show err)
                        Right gs' -> Right (gs', currentBet, phhRound)

        StandPat -> do
            -- Stand pat - not applicable to Hold'em, skip
            Right (gs, currentBet, phhRound)

-- | Convert player number (1-indexed) to PlayerId
playerIdFromNum :: Int -> PlayerId
playerIdFromNum n = "player" ++ show n

-- | Advance PHH round
advancePhhRound :: PhhRound -> PhhRound
advancePhhRound PhhPreflop = PhhFlop
advancePhhRound PhhFlop = PhhTurn
advancePhhRound PhhTurn = PhhRiver
advancePhhRound PhhRiver = PhhShowdown
advancePhhRound PhhShowdown = PhhShowdown

-- | Run all PHH files in a directory
runPhhDirectory :: FilePath -> Int -> IO PhhStats
runPhhDirectory dir maxHands = do
    -- This would be implemented to:
    -- 1. Find all .phh files in directory
    -- 2. Parse and run each one
    -- 3. Collect statistics
    -- For now, return empty stats
    return emptyStats
