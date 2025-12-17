{-|
Module      : Main
Description : Demo application for Texas Hold'em
Copyright   : (c) Block52, 2024
License     : MIT
-}
module Main (main) where

import TexasHoldem

import Data.Maybe (fromMaybe, mapMaybe)
import qualified Data.Map.Strict as Map

-- | Main entry point - demonstrates a simple poker hand
main :: IO ()
main = do
    putStrLn "=== Texas Hold'em Haskell Demo ==="
    putStrLn ""

    -- Create game configuration
    let config = defaultConfig
            { configSmallBlind = 1
            , configBigBlind   = 2
            }

    -- Create a shuffled deck using a seed (deterministic for blockchain)
    let deck = shuffleWithSeed 42 newDeck

    -- Create players
    let players =
            [ ("Alice", 0, 100)  -- Player ID, Seat, Chips
            , ("Bob",   1, 100)
            , ("Carol", 2, 100)
            ]

    -- Initialize game
    let game = newGame config deck players

    putStrLn "Initial game state:"
    printGameState game

    -- Demo: Hand evaluation
    putStrLn "\n=== Hand Evaluation Demo ==="
    demonstrateHandEvaluation

    -- Demo: Card parsing
    putStrLn "\n=== Card Parsing Demo ==="
    demonstrateCardParsing

-- | Print the current game state
printGameState :: GameState -> IO ()
printGameState gs = do
    putStrLn $ "  Round: " ++ show (gsRound gs)
    putStrLn $ "  Hand #: " ++ show (gsHandNumber gs)
    putStrLn $ "  Pot: " ++ show (totalPot $ gsPot gs)
    putStrLn $ "  Current bet: " ++ show (gsCurrentBet gs)
    putStrLn "  Players:"
    mapM_ printPlayer (Map.elems $ gsPlayers gs)

-- | Print a player's state
printPlayer :: Player -> IO ()
printPlayer p = putStrLn $
    "    Seat " ++ show (playerSeat p) ++
    ": " ++ playerId p ++
    " (" ++ show (playerChips p) ++ " chips)" ++
    " - " ++ show (playerStatus p)

-- | Demonstrate hand evaluation
demonstrateHandEvaluation :: IO ()
demonstrateHandEvaluation = do
    -- Create some sample hands
    let royalFlush = mapMaybe fromMnemonic ["AS", "KS", "QS", "JS", "TS"]
        straightFlush = mapMaybe fromMnemonic ["9H", "8H", "7H", "6H", "5H"]
        fourOfAKind = mapMaybe fromMnemonic ["AC", "AD", "AH", "AS", "KC"]
        fullHouse = mapMaybe fromMnemonic ["KH", "KD", "KC", "QH", "QD"]
        flush = mapMaybe fromMnemonic ["2S", "5S", "8S", "JS", "AS"]
        straight = mapMaybe fromMnemonic ["9C", "8D", "7H", "6S", "5C"]
        threeOfAKind = mapMaybe fromMnemonic ["7H", "7D", "7C", "AH", "KD"]
        twoPair = mapMaybe fromMnemonic ["JH", "JD", "9C", "9S", "AH"]
        onePair = mapMaybe fromMnemonic ["8H", "8D", "AC", "KS", "QH"]
        highCard = mapMaybe fromMnemonic ["AH", "KD", "QC", "JS", "9H"]

    let hands =
            [ ("Royal Flush", royalFlush)
            , ("Straight Flush (9-high)", straightFlush)
            , ("Four of a Kind (Aces)", fourOfAKind)
            , ("Full House (K over Q)", fullHouse)
            , ("Flush (Ace-high)", flush)
            , ("Straight (9-high)", straight)
            , ("Three of a Kind (7s)", threeOfAKind)
            , ("Two Pair (J and 9)", twoPair)
            , ("One Pair (8s)", onePair)
            , ("High Card (Ace)", highCard)
            ]

    mapM_ evaluateAndPrint hands

  where
    evaluateAndPrint :: (String, [Card]) -> IO ()
    evaluateAndPrint (name, cards) = do
        let mnemonic = unwords $ map toMnemonic cards
        case evaluateHand cards of
            Nothing -> putStrLn $ "  " ++ name ++ ": Invalid hand"
            Just eh -> putStrLn $ "  " ++ name ++ ": " ++
                                  rankName (ehRank eh) ++
                                  " [" ++ mnemonic ++ "]"

-- | Demonstrate card parsing
demonstrateCardParsing :: IO ()
demonstrateCardParsing = do
    let testCards = ["AS", "KH", "QD", "JC", "TS", "2H", "invalid"]

    putStrLn "  Parsing cards:"
    mapM_ testParse testCards

  where
    testParse :: String -> IO ()
    testParse s = case fromMnemonic s of
        Nothing -> putStrLn $ "    \"" ++ s ++ "\" -> Invalid"
        Just c  -> putStrLn $ "    \"" ++ s ++ "\" -> " ++
                              show (cardRank c) ++ " of " ++ show (cardSuit c)
