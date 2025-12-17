{-|
Module      : Main
Description : Test suite for Texas Hold'em
Copyright   : (c) Block52, 2024
License     : MIT
-}
module Main (main) where

import TexasHoldem
import Data.Maybe (mapMaybe, isJust)
import Data.List (sort)

main :: IO ()
main = do
    putStrLn "Running Texas Hold'em Tests..."
    putStrLn ""

    -- Card tests
    runTest "Card creation" testCardCreation
    runTest "Card mnemonic parsing" testMnemonicParsing
    runTest "All cards unique" testAllCardsUnique

    -- Deck tests
    runTest "New deck has 52 cards" testNewDeck52
    runTest "Draw reduces deck" testDrawReducesDeck
    runTest "Deterministic shuffle" testDeterministicShuffle

    -- Hand evaluation tests
    runTest "Royal flush detection" testRoyalFlush
    runTest "Straight flush detection" testStraightFlush
    runTest "Four of a kind detection" testFourOfAKind
    runTest "Full house detection" testFullHouse
    runTest "Flush detection" testFlush
    runTest "Straight detection" testStraight
    runTest "Wheel straight (A-5)" testWheelStraight
    runTest "Three of a kind detection" testThreeOfAKind
    runTest "Two pair detection" testTwoPair
    runTest "One pair detection" testOnePair
    runTest "High card detection" testHighCard

    -- Hand comparison tests
    runTest "Royal flush beats straight flush" testRoyalBeatsStFlush
    runTest "Higher pair wins" testHigherPairWins
    runTest "Kickers break ties" testKickersBreakTies

    -- Best hand selection
    runTest "Best 5 from 7 cards" testBestFrom7

    putStrLn ""
    putStrLn "All tests completed!"

-- | Run a test and print result
runTest :: String -> Bool -> IO ()
runTest name result = putStrLn $
    (if result then "[PASS]" else "[FAIL]") ++ " " ++ name

-- Card tests
testCardCreation :: Bool
testCardCreation =
    let card = mkCard Ace Spades
    in cardRank card == Ace && cardSuit card == Spades

testMnemonicParsing :: Bool
testMnemonicParsing =
    let tests =
            [ (fromMnemonic "AS", Just $ mkCard Ace Spades)
            , (fromMnemonic "KH", Just $ mkCard King Hearts)
            , (fromMnemonic "2D", Just $ mkCard Two Diamonds)
            , (fromMnemonic "TC", Just $ mkCard Ten Clubs)
            , (fromMnemonic "XX", Nothing)
            ]
    in all (\(result, expected) -> result == expected) tests

testAllCardsUnique :: Bool
testAllCardsUnique =
    let cards = allCards
        values = map cardValue cards
    in length cards == 52 && length (unique values) == 52
  where
    unique = map head . group . sort
    group [] = []
    group (x:xs) = (x : takeWhile (==x) xs) : group (dropWhile (==x) xs)

-- Deck tests
testNewDeck52 :: Bool
testNewDeck52 = remaining newDeck == 52

testDrawReducesDeck :: Bool
testDrawReducesDeck =
    case draw newDeck of
        Nothing -> False
        Just (_, deck') -> remaining deck' == 51

testDeterministicShuffle :: Bool
testDeterministicShuffle =
    let deck1 = shuffleWithSeed 12345 newDeck
        deck2 = shuffleWithSeed 12345 newDeck
    in unDeck deck1 == unDeck deck2

-- Hand evaluation tests
testRoyalFlush :: Bool
testRoyalFlush =
    let cards = mapMaybe fromMnemonic ["AS", "KS", "QS", "JS", "TS"]
    in case evaluateHand cards of
        Just eh -> ehRank eh == RoyalFlush
        Nothing -> False

testStraightFlush :: Bool
testStraightFlush =
    let cards = mapMaybe fromMnemonic ["9H", "8H", "7H", "6H", "5H"]
    in case evaluateHand cards of
        Just eh -> case ehRank eh of
            StraightFlush _ -> True
            _ -> False
        Nothing -> False

testFourOfAKind :: Bool
testFourOfAKind =
    let cards = mapMaybe fromMnemonic ["AC", "AD", "AH", "AS", "KC"]
    in case evaluateHand cards of
        Just eh -> case ehRank eh of
            FourOfAKind _ _ -> True
            _ -> False
        Nothing -> False

testFullHouse :: Bool
testFullHouse =
    let cards = mapMaybe fromMnemonic ["KH", "KD", "KC", "QH", "QD"]
    in case evaluateHand cards of
        Just eh -> case ehRank eh of
            FullHouse _ _ -> True
            _ -> False
        Nothing -> False

testFlush :: Bool
testFlush =
    let cards = mapMaybe fromMnemonic ["2S", "5S", "8S", "JS", "AS"]
    in case evaluateHand cards of
        Just eh -> case ehRank eh of
            Flush _ -> True
            _ -> False
        Nothing -> False

testStraight :: Bool
testStraight =
    let cards = mapMaybe fromMnemonic ["9C", "8D", "7H", "6S", "5C"]
    in case evaluateHand cards of
        Just eh -> case ehRank eh of
            Straight _ -> True
            _ -> False
        Nothing -> False

testWheelStraight :: Bool
testWheelStraight =
    let cards = mapMaybe fromMnemonic ["5C", "4D", "3H", "2S", "AC"]
    in case evaluateHand cards of
        Just eh -> case ehRank eh of
            Straight 5 -> True  -- Wheel has 5 as high card
            _ -> False
        Nothing -> False

testThreeOfAKind :: Bool
testThreeOfAKind =
    let cards = mapMaybe fromMnemonic ["7H", "7D", "7C", "AH", "KD"]
    in case evaluateHand cards of
        Just eh -> case ehRank eh of
            ThreeOfAKind _ _ -> True
            _ -> False
        Nothing -> False

testTwoPair :: Bool
testTwoPair =
    let cards = mapMaybe fromMnemonic ["JH", "JD", "9C", "9S", "AH"]
    in case evaluateHand cards of
        Just eh -> case ehRank eh of
            TwoPair _ _ _ -> True
            _ -> False
        Nothing -> False

testOnePair :: Bool
testOnePair =
    let cards = mapMaybe fromMnemonic ["8H", "8D", "AC", "KS", "QH"]
    in case evaluateHand cards of
        Just eh -> case ehRank eh of
            OnePair _ _ -> True
            _ -> False
        Nothing -> False

testHighCard :: Bool
testHighCard =
    let cards = mapMaybe fromMnemonic ["AH", "KD", "QC", "JS", "9H"]
    in case evaluateHand cards of
        Just eh -> case ehRank eh of
            HighCard _ -> True
            _ -> False
        Nothing -> False

-- Comparison tests
testRoyalBeatsStFlush :: Bool
testRoyalBeatsStFlush =
    let royal = mapMaybe fromMnemonic ["AS", "KS", "QS", "JS", "TS"]
        stFlush = mapMaybe fromMnemonic ["9H", "8H", "7H", "6H", "5H"]
    in case (evaluateHand royal, evaluateHand stFlush) of
        (Just r, Just s) -> compareHands r s == GT
        _ -> False

testHigherPairWins :: Bool
testHigherPairWins =
    let aces = mapMaybe fromMnemonic ["AH", "AD", "KC", "QS", "JH"]
        kings = mapMaybe fromMnemonic ["KH", "KD", "AC", "QS", "JH"]
    in case (evaluateHand aces, evaluateHand kings) of
        (Just a, Just k) -> compareHands a k == GT
        _ -> False

testKickersBreakTies :: Bool
testKickersBreakTies =
    let pairAceK = mapMaybe fromMnemonic ["AH", "AD", "KC", "QS", "JH"]
        pairAceQ = mapMaybe fromMnemonic ["AS", "AC", "QC", "JS", "TH"]
    in case (evaluateHand pairAceK, evaluateHand pairAceQ) of
        (Just pk, Just pq) -> compareHands pk pq == GT
        _ -> False

-- Best hand from 7 cards
testBestFrom7 :: Bool
testBestFrom7 =
    let cards = mapMaybe fromMnemonic ["AS", "KS", "QS", "JS", "TS", "2H", "3D"]
    in case evaluateBestHand cards of
        Just eh -> ehRank eh == RoyalFlush
        Nothing -> False
