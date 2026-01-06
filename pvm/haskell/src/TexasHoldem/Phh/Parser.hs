{-|
Module      : TexasHoldem.Phh.Parser
Description : Parser for PHH (Poker Hand History) format
Copyright   : (c) Block52, 2025
License     : MIT

Parser for the PHH poker hand history format.
-}
module TexasHoldem.Phh.Parser
    ( -- * Parsing Functions
      parsePhhFile
    , parsePhhContent
    , parseAction
      -- * Card Parsing
    , parseCards
    ) where

import TexasHoldem.Phh.Types
import TexasHoldem.Card (Card, fromMnemonic)

import Data.Char (isDigit, isSpace, toUpper)
import Data.List (isPrefixOf, stripPrefix)
import Data.Maybe (mapMaybe, catMaybes)
import Control.Monad (guard)

-- | Parse a PHH file from disk
parsePhhFile :: FilePath -> IO (Either String PhhHand)
parsePhhFile path = do
    content <- readFile path
    return $ parsePhhContent path content

-- | Parse PHH content from a string
parsePhhContent :: FilePath -> String -> Either String PhhHand
parsePhhContent path content = do
    let lns = map stripLine $ lines content
        kvs = mapMaybe parseKeyValue lns

    variant <- lookupRequired "variant" kvs >>= parseStringValue
    anteTrim <- lookupRequired "ante_trimming_status" kvs >>= parseBoolValue
    antes <- lookupRequired "antes" kvs >>= parseIntList
    blinds <- lookupRequired "blinds_or_straddles" kvs >>= parseIntList
    minBet <- lookupRequired "min_bet" kvs >>= parseIntValue
    stacks <- lookupRequired "starting_stacks" kvs >>= parseIntList
    actionsRaw <- lookupRequired "actions" kvs >>= parseStringList
    handNum <- lookupRequired "hand" kvs >>= parseIntValue
    players <- lookupRequired "players" kvs >>= parseStringList
    finStacks <- lookupRequired "finishing_stacks" kvs >>= parseIntList

    actions <- mapM parseAction actionsRaw

    Right PhhHand
        { phhVariant = variant
        , phhAnteTrimming = anteTrim
        , phhAntes = antes
        , phhBlinds = blinds
        , phhMinBet = minBet
        , phhStartingStacks = stacks
        , phhActions = actions
        , phhHandNumber = handNum
        , phhPlayers = players
        , phhFinishingStacks = finStacks
        , phhFilePath = path
        }

-- | Strip whitespace from a line
stripLine :: String -> String
stripLine = dropWhile isSpace . reverse . dropWhile isSpace . reverse

-- | Parse a key = value line
parseKeyValue :: String -> Maybe (String, String)
parseKeyValue line = do
    let (key, rest) = break (== '=') line
    guard (not $ null rest)
    let value = drop 1 rest  -- drop the '='
    Just (stripLine key, stripLine value)

-- | Lookup a required key
lookupRequired :: String -> [(String, String)] -> Either String String
lookupRequired key kvs = case lookup key kvs of
    Just v  -> Right v
    Nothing -> Left $ "Missing required field: " ++ key

-- | Parse a string value (removes quotes)
parseStringValue :: String -> Either String String
parseStringValue s = Right $ stripQuotes s

-- | Parse a boolean value
parseBoolValue :: String -> Either String Bool
parseBoolValue "true"  = Right True
parseBoolValue "True"  = Right True
parseBoolValue "false" = Right False
parseBoolValue "False" = Right False
parseBoolValue s       = Left $ "Invalid boolean: " ++ s

-- | Parse an integer value
parseIntValue :: String -> Either String Int
parseIntValue s = case reads s of
    [(n, "")] -> Right n
    _         -> Left $ "Invalid integer: " ++ s

-- | Parse a list of integers [1, 2, 3]
parseIntList :: String -> Either String [Int]
parseIntList s = do
    let stripped = stripBrackets s
        parts = splitOn ',' stripped
    mapM (parseIntValue . stripLine) parts

-- | Parse a list of strings ['a', 'b', 'c']
parseStringList :: String -> Either String [String]
parseStringList s = do
    let stripped = stripBrackets s
        parts = splitOnQuoted stripped
    Right $ map stripQuotes parts

-- | Strip brackets from a list string
stripBrackets :: String -> String
stripBrackets s =
    let s' = dropWhile (== '[') s
    in reverse $ dropWhile (== ']') $ reverse s'

-- | Strip quotes from a string
stripQuotes :: String -> String
stripQuotes s =
    let s' = dropWhile (`elem` "'\"") s
    in reverse $ dropWhile (`elem` "'\"") $ reverse s'

-- | Split on a character
splitOn :: Char -> String -> [String]
splitOn _ "" = []
splitOn c s =
    let (part, rest) = break (== c) s
    in part : case rest of
        []     -> []
        (_:xs) -> splitOn c xs

-- | Split on commas, respecting quotes
splitOnQuoted :: String -> [String]
splitOnQuoted = go False ""
  where
    go _ acc "" = [reverse acc]
    go inQuote acc (c:cs)
        | c == '\'' = go (not inQuote) (c:acc) cs
        | c == ',' && not inQuote = reverse acc : go False "" cs
        | otherwise = go inQuote (c:acc) cs

-- | Parse a single PHH action string
parseAction :: String -> Either String PhhAction
parseAction raw = case words raw of
    -- Deal hole cards: "d dh p1 TcQc"
    ["d", "dh", pnum, cards] -> do
        player <- parsePlayerNum pnum
        let cardList = parseCards cards
        Right PhhAction
            { phhActType = DealHole
            , phhActPlayer = Just player
            , phhActAmount = Nothing
            , phhActCards = cardList
            , phhActRaw = raw
            }

    -- Deal board: "d db 7d5h9d" or "d db 7c" or "d db Qh"
    ("d" : "db" : cardStrs) -> do
        let allCards = concatMap parseCards cardStrs
        Right PhhAction
            { phhActType = DealBoard
            , phhActPlayer = Nothing
            , phhActAmount = Nothing
            , phhActCards = allCards
            , phhActRaw = raw
            }

    -- Fold: "p3 f"
    [pnum, "f"] -> do
        player <- parsePlayerNum pnum
        Right PhhAction
            { phhActType = Fold
            , phhActPlayer = Just player
            , phhActAmount = Nothing
            , phhActCards = []
            , phhActRaw = raw
            }

    -- Check/Bet/Raise: "p4 cbr 210"
    [pnum, "cbr", amt] -> do
        player <- parsePlayerNum pnum
        amount <- parseIntValue amt
        Right PhhAction
            { phhActType = CheckBetRaise
            , phhActPlayer = Just player
            , phhActAmount = Just amount
            , phhActCards = []
            , phhActRaw = raw
            }

    -- Call: "p1 cc"
    [pnum, "cc"] -> do
        player <- parsePlayerNum pnum
        Right PhhAction
            { phhActType = Call
            , phhActPlayer = Just player
            , phhActAmount = Nothing
            , phhActCards = []
            , phhActRaw = raw
            }

    -- Show/Muck with cards: "p2 sm 4c6c"
    [pnum, "sm", cards] -> do
        player <- parsePlayerNum pnum
        let cardList = parseCards cards
        Right PhhAction
            { phhActType = ShowMuck
            , phhActPlayer = Just player
            , phhActAmount = Nothing
            , phhActCards = cardList
            , phhActRaw = raw
            }

    -- Show/Muck without cards: "p1 sm"
    [pnum, "sm"] -> do
        player <- parsePlayerNum pnum
        Right PhhAction
            { phhActType = ShowMuck
            , phhActPlayer = Just player
            , phhActAmount = Nothing
            , phhActCards = []
            , phhActRaw = raw
            }

    -- Stand pat: "p1 sd"
    [pnum, "sd"] -> do
        player <- parsePlayerNum pnum
        Right PhhAction
            { phhActType = StandPat
            , phhActPlayer = Just player
            , phhActAmount = Nothing
            , phhActCards = []
            , phhActRaw = raw
            }

    _ -> Left $ "Unknown action format: " ++ raw

-- | Parse player number from "p1", "p2", etc.
parsePlayerNum :: String -> Either String Int
parsePlayerNum s = case stripPrefix "p" s of
    Just numStr -> parseIntValue numStr
    Nothing     -> Left $ "Invalid player number: " ++ s

-- | Parse cards from a string like "TcQc" or "7d5h9d"
-- Cards are 2 characters each: rank + suit
parseCards :: String -> [Card]
parseCards = go
  where
    go [] = []
    go [_] = []  -- Invalid single char
    go (r:s:rest) =
        let mnemonic = [toUpper r, toUpper s]
        in case fromMnemonic mnemonic of
            Just card -> card : go rest
            Nothing   -> go rest  -- Skip invalid cards
