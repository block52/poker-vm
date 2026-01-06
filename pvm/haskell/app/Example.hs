{-|
Module      : Main
Description : Example usage of the Texas Hold'em Haskell library
Copyright   : (c) Block52, 2025
License     : MIT

Run with: cabal run texas-holdem-example
-}
module Main (main) where

import TexasHoldem
import Data.Maybe (mapMaybe)
import qualified Data.Map.Strict as Map

main :: IO ()
main = do
    putStrLn "Texas Hold'em Haskell Library - Examples"
    putStrLn $ replicate 50 '='
    putStrLn ""

    -- Example 1: Card basics
    example1_cards

    -- Example 2: Hand evaluation
    example2_handEvaluation

    -- Example 3: Best hand from 7 cards
    example3_bestHand

    -- Example 4: Compare hands
    example4_compareHands

    -- Example 5: Deck operations
    example5_deck

    -- Example 6: Simple game flow
    example6_simpleGame

    putStrLn ""
    putStrLn "All examples completed!"

-- | Example 1: Working with cards
example1_cards :: IO ()
example1_cards = do
    putStrLn "Example 1: Card Basics"
    putStrLn $ replicate 30 '-'

    -- Create cards from notation
    let aceSpades = fromMnemonic "AS"
        kingHearts = fromMnemonic "KH"
        tenClubs = fromMnemonic "TC"
        twosDiamonds = fromMnemonic "2D"

    putStrLn $ "AS = " ++ show aceSpades
    putStrLn $ "KH = " ++ show kingHearts
    putStrLn $ "TC = " ++ show tenClubs
    putStrLn $ "2D = " ++ show twosDiamonds

    -- Create card directly
    let card = mkCard Ace Spades
    putStrLn $ "mkCard Ace Spades = " ++ show card
    putStrLn $ "Rank: " ++ show (cardRank card) ++ ", Suit: " ++ show (cardSuit card)
    putStrLn ""

-- | Example 2: Evaluating poker hands
example2_handEvaluation :: IO ()
example2_handEvaluation = do
    putStrLn "Example 2: Hand Evaluation"
    putStrLn $ replicate 30 '-'

    -- Test various hands
    let hands =
            [ ("Royal Flush",    ["AS", "KS", "QS", "JS", "TS"])
            , ("Straight Flush", ["9H", "8H", "7H", "6H", "5H"])
            , ("Four of a Kind", ["AC", "AD", "AH", "AS", "KC"])
            , ("Full House",     ["KH", "KD", "KC", "QH", "QD"])
            , ("Flush",          ["2S", "5S", "8S", "JS", "AS"])
            , ("Straight",       ["9C", "8D", "7H", "6S", "5C"])
            , ("Wheel (A-5)",    ["5C", "4D", "3H", "2S", "AC"])
            , ("Three of Kind",  ["7H", "7D", "7C", "AH", "KD"])
            , ("Two Pair",       ["JH", "JD", "9C", "9S", "AH"])
            , ("One Pair",       ["8H", "8D", "AC", "KS", "QH"])
            , ("High Card",      ["AH", "KD", "QC", "JS", "9H"])
            ]

    mapM_ evalAndPrint hands
    putStrLn ""
  where
    evalAndPrint (name, mnemonics) = do
        let cards = mapMaybe fromMnemonic mnemonics
        case evaluateHand cards of
            Just eh -> putStrLn $ name ++ ": " ++ rankName (ehRank eh)
            Nothing -> putStrLn $ name ++ ": Failed to evaluate"

-- | Example 3: Find best 5-card hand from 7 cards
example3_bestHand :: IO ()
example3_bestHand = do
    putStrLn "Example 3: Best Hand from 7 Cards"
    putStrLn $ replicate 30 '-'

    -- Hole cards + community cards
    let holeCards = ["AS", "KS"]
        community = ["QS", "JS", "TS", "2H", "3D"]
        allCards = mapMaybe fromMnemonic (holeCards ++ community)

    putStrLn $ "Hole cards: " ++ unwords holeCards
    putStrLn $ "Community:  " ++ unwords community

    case evaluateBestHand allCards of
        Just eh -> do
            putStrLn $ "Best hand:  " ++ rankName (ehRank eh)
            putStrLn $ "Cards used: " ++ show (map toMnemonic $ ehCards eh)
        Nothing -> putStrLn "Could not evaluate"

    -- Another example with a full house
    putStrLn ""
    let hole2 = ["KH", "KD"]
        comm2 = ["KC", "7S", "7H", "2C", "9D"]
        all2 = mapMaybe fromMnemonic (hole2 ++ comm2)

    putStrLn $ "Hole cards: " ++ unwords hole2
    putStrLn $ "Community:  " ++ unwords comm2

    case evaluateBestHand all2 of
        Just eh -> putStrLn $ "Best hand:  " ++ rankName (ehRank eh)
        Nothing -> putStrLn "Could not evaluate"

    putStrLn ""

-- | Example 4: Comparing hands
example4_compareHands :: IO ()
example4_compareHands = do
    putStrLn "Example 4: Comparing Hands"
    putStrLn $ replicate 30 '-'

    -- Player 1: Pair of Aces with King kicker
    let hand1 = mapMaybe fromMnemonic ["AH", "AD", "KC", "QS", "JH"]
    -- Player 2: Pair of Aces with Queen kicker
        hand2 = mapMaybe fromMnemonic ["AS", "AC", "QC", "JS", "TH"]

    case (evaluateHand hand1, evaluateHand hand2) of
        (Just eh1, Just eh2) -> do
            putStrLn $ "Hand 1: " ++ rankName (ehRank eh1)
            putStrLn $ "Hand 2: " ++ rankName (ehRank eh2)
            case compareHands eh1 eh2 of
                GT -> putStrLn "Result: Hand 1 wins (better kicker)"
                LT -> putStrLn "Result: Hand 2 wins"
                EQ -> putStrLn "Result: Tie (split pot)"
        _ -> putStrLn "Could not evaluate hands"

    putStrLn ""

-- | Example 5: Deck operations
example5_deck :: IO ()
example5_deck = do
    putStrLn "Example 5: Deck Operations"
    putStrLn $ replicate 30 '-'

    -- Create a new deck
    let deck = newDeck
    putStrLn $ "New deck has " ++ show (remaining deck) ++ " cards"

    -- Shuffle with a seed (deterministic!)
    let shuffled = shuffleDeck 12345 deck
    putStrLn $ "Shuffled deck still has " ++ show (remaining shuffled) ++ " cards"

    -- Draw some cards
    case draw shuffled of
        Just (card1, deck1) -> do
            putStrLn $ "Drew: " ++ toMnemonic card1
            case draw deck1 of
                Just (card2, deck2) -> do
                    putStrLn $ "Drew: " ++ toMnemonic card2
                    putStrLn $ "Remaining: " ++ show (remaining deck2) ++ " cards"
                Nothing -> return ()
        Nothing -> putStrLn "Deck empty!"

    -- Prove determinism: same seed = same shuffle
    let shuffled2 = shuffleDeck 12345 newDeck
    case (draw shuffled, draw shuffled2) of
        (Just (c1, _), Just (c2, _)) ->
            putStrLn $ "Same seed produces same first card: " ++
                       toMnemonic c1 ++ " == " ++ toMnemonic c2 ++
                       " -> " ++ show (c1 == c2)
        _ -> return ()

    putStrLn ""

-- | Example 6: Simple game setup
example6_simpleGame :: IO ()
example6_simpleGame = do
    putStrLn "Example 6: Simple Game Setup"
    putStrLn $ replicate 30 '-'

    -- Create game configuration
    let config = defaultConfig
            { configSmallBlind = 50
            , configBigBlind = 100
            , configMaxPlayers = 6
            }

    putStrLn $ "Small Blind: " ++ show (configSmallBlind config)
    putStrLn $ "Big Blind:   " ++ show (configBigBlind config)

    -- Create shuffled deck
    let deck = shuffleDeck 42 newDeck

    -- Create players: (playerId, seatIndex, chips)
    let players =
            [ ("Alice", 0, 10000)
            , ("Bob",   1, 10000)
            , ("Carol", 2, 10000)
            ]

    -- Create game
    let game = newGame config deck players

    putStrLn $ "Players:     " ++ show (getPlayerCount game)
    putStrLn $ "Round:       " ++ show (gsRound game)
    putStrLn $ "Pot:         " ++ show (getPot game)

    -- Post small blind
    let sbAction = Action "Alice" PostSmallBlind 50
    case performAction sbAction game of
        Left err -> putStrLn $ "Error: " ++ show err
        Right game' -> do
            putStrLn "Alice posts small blind (50)"

            -- Post big blind
            let bbAction = Action "Bob" PostBigBlind 100
            case performAction bbAction game' of
                Left err -> putStrLn $ "Error: " ++ show err
                Right game'' -> do
                    putStrLn "Bob posts big blind (100)"
                    putStrLn $ "Pot now:     " ++ show (getPot game'')

                    -- Carol raises
                    let raiseAction = Action "Carol" Raise 300
                    case performAction raiseAction game'' of
                        Left err -> putStrLn $ "Error: " ++ show err
                        Right game''' -> do
                            putStrLn "Carol raises to 300"
                            putStrLn $ "Pot now:     " ++ show (getPot game''')

                            -- Alice folds
                            let foldAction = Action "Alice" Fold 0
                            case performAction foldAction game''' of
                                Left err -> putStrLn $ "Error: " ++ show err
                                Right game'''' -> do
                                    putStrLn "Alice folds"
                                    putStrLn $ "Active players: " ++
                                        show (getActivePlayerCount game'''')

    putStrLn ""
