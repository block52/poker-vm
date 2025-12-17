{-|
Module      : TexasHoldem.GameState
Description : Complete game state and game logic for Texas Hold'em
Copyright   : (c) Block52, 2025
License     : MIT
Maintainer  : dev@block52.xyz

This module provides the complete game state management for Texas Hold'em,
including the pure functional game engine that processes actions and
advances game state deterministically.
-}
module TexasHoldem.GameState
    ( -- * Types
      GameState(..)
    , GameConfig(..)
    , GameError(..)
    , ActionLog(..)
      -- * Constructors
    , newGame
    , defaultConfig
      -- * Game Operations
    , performAction
    , dealHoleCards
    , dealCommunityCards
    , advanceRound
      -- * Queries
    , currentPlayerToAct
    , isHandComplete
    , getWinners
    , getLivePlayers
    , getShowdownPlayers
      -- * State Transformations
    , applyAction
    , resetForNewHand
    , rotateDealer
    ) where

import TexasHoldem.Card
import TexasHoldem.Deck
import TexasHoldem.Hand
import TexasHoldem.Player
import TexasHoldem.Action
import TexasHoldem.Round
import TexasHoldem.Pot
import TexasHoldem.Evaluation

import qualified Data.Map.Strict as Map
import Data.List (sortBy, find)
import Data.Ord (comparing)
import Data.Maybe (mapMaybe, isJust, fromMaybe)

-- | Game configuration (blinds, rake, etc.)
data GameConfig = GameConfig
    { configSmallBlind   :: !Chips
    , configBigBlind     :: !Chips
    , configMinBuyIn     :: !Chips
    , configMaxBuyIn     :: !Chips
    , configMaxPlayers   :: !Int
    , configRakePercent  :: !Int      -- ^ Rake percentage (0-100)
    , configRakeCap      :: !Chips    -- ^ Maximum rake
    } deriving (Eq, Show)

-- | Default game configuration
defaultConfig :: GameConfig
defaultConfig = GameConfig
    { configSmallBlind  = 1
    , configBigBlind    = 2
    , configMinBuyIn    = 40
    , configMaxBuyIn    = 200
    , configMaxPlayers  = 9
    , configRakePercent = 5
    , configRakeCap     = 10
    }

-- | Record of an action taken
data ActionLog = ActionLog
    { logAction    :: !Action
    , logRound     :: !Round
    , logTimestamp :: !Integer  -- ^ For blockchain ordering
    } deriving (Eq, Show)

-- | Game errors
data GameError
    = InvalidAction ActionResult
    | InvalidPlayer String
    | InvalidRound String
    | NotEnoughPlayers
    | GameAlreadyComplete
    | DeckExhausted
    deriving (Eq, Show)

-- | Complete game state
data GameState = GameState
    { gsConfig         :: !GameConfig
    , gsPlayers        :: !(Map.Map SeatIndex Player)
    , gsDeck           :: !Deck
    , gsCommunityCards :: !CommunityCards
    , gsRound          :: !Round
    , gsPot            :: !PotState
    , gsCurrentBet     :: !Chips
    , gsLastRaise      :: !Chips
    , gsDealerSeat     :: !SeatIndex
    , gsActionOn       :: !SeatIndex  -- ^ Seat that must act next
    , gsActionLog      :: ![ActionLog]
    , gsHandNumber     :: !Int
    , gsLastAggressor  :: !(Maybe SeatIndex)
    } deriving (Eq, Show)

-- | Create a new game with initial state
newGame :: GameConfig -> Deck -> [(PlayerId, SeatIndex, Chips)] -> GameState
newGame config deck playerData = GameState
    { gsConfig         = config
    , gsPlayers        = Map.fromList [(seat, mkPlayer pid seat chips)
                                      | (pid, seat, chips) <- playerData]
    , gsDeck           = deck
    , gsCommunityCards = NoCards
    , gsRound          = Ante
    , gsPot            = emptyPotState
    , gsCurrentBet     = 0
    , gsLastRaise      = configBigBlind config
    , gsDealerSeat     = 0
    , gsActionOn       = 0
    , gsActionLog      = []
    , gsHandNumber     = 1
    , gsLastAggressor  = Nothing
    }

-- | Get the player who must act next
currentPlayerToAct :: GameState -> Maybe Player
currentPlayerToAct gs = Map.lookup (gsActionOn gs) (gsPlayers gs)

-- | Check if the hand is complete
isHandComplete :: GameState -> Bool
isHandComplete gs = gsRound gs == Complete

-- | Get all live players (not folded)
getLivePlayers :: GameState -> [Player]
getLivePlayers gs = filter isActive $ Map.elems (gsPlayers gs)

-- | Get players at showdown (showing cards)
getShowdownPlayers :: GameState -> [Player]
getShowdownPlayers gs =
    filter (\p -> playerStatus p == Showing) $ Map.elems (gsPlayers gs)

-- | Determine winners at showdown
getWinners :: GameState -> [(Player, EvaluatedHand)]
getWinners gs
    | gsRound gs /= Showdown && gsRound gs /= Complete = []
    | null showingPlayers = []
    | otherwise = winnersWithHands
  where
    showingPlayers = getShowdownPlayers gs
    community = communityCardsList (gsCommunityCards gs)

    -- Evaluate each player's best hand
    playerHands :: [(Player, Maybe EvaluatedHand)]
    playerHands =
        [ (p, playerCards p >>= \hc -> evaluateBestHand (holeCardsList hc ++ community))
        | p <- showingPlayers
        ]

    -- Filter to players with valid hands
    validHands :: [(Player, EvaluatedHand)]
    validHands = [(p, h) | (p, Just h) <- playerHands]

    -- Find the best hand
    bestRank = maximum $ map (ehRank . snd) validHands

    -- All players with the best hand
    winnersWithHands = filter (\(_, h) -> ehRank h == bestRank) validHands

-- | Perform an action, returning either an error or the new game state
performAction :: Action -> GameState -> Either GameError GameState
performAction action gs = do
    -- Get the player
    player <- maybe (Left $ InvalidPlayer "Player not found")
                    Right
                    (findPlayerById (actionPlayer action) gs)

    -- Validate the action
    let result = validateAction action player (gsRound gs)
                                (gsCurrentBet gs) (gsLastRaise gs)
                                (configBigBlind $ gsConfig gs)
    case result of
        ActionOk -> Right $ applyAction action gs
        err      -> Left $ InvalidAction err

-- | Find a player by their ID
findPlayerById :: PlayerId -> GameState -> Maybe Player
findPlayerById pid gs = find (\p -> playerId p == pid) (Map.elems $ gsPlayers gs)

-- | Apply an action to the game state (assumes already validated)
applyAction :: Action -> GameState -> GameState
applyAction action gs = case actionType action of

    PostSmallBlind -> gs
        & updatePlayer (actionPlayer action) (placeBet (actionAmount action))
        & addToPotState (actionPlayer action) (actionAmount action)
        & advanceAction

    PostBigBlind -> gs
        & updatePlayer (actionPlayer action) (placeBet (actionAmount action))
        & addToPotState (actionPlayer action) (actionAmount action)
        & setCurrentBet (actionAmount action)
        & advanceAction
        & checkAdvanceRound

    Fold -> gs
        & updatePlayer (actionPlayer action) fold
        & advanceAction
        & checkAdvanceRound

    Check -> gs
        & advanceAction
        & checkAdvanceRound

    Call -> gs
        & updatePlayer (actionPlayer action) (placeBet (actionAmount action))
        & addToPotState (actionPlayer action) (actionAmount action)
        & advanceAction
        & checkAdvanceRound

    Bet -> gs
        & updatePlayer (actionPlayer action) (placeBet (actionAmount action))
        & addToPotState (actionPlayer action) (actionAmount action)
        & setCurrentBet (actionAmount action)
        & setLastRaise (actionAmount action)
        & setLastAggressor (actionPlayer action)
        & advanceAction
        & checkAdvanceRound

    Raise -> gs
        & updatePlayer (actionPlayer action) (placeBet (actionAmount action))
        & addToPotState (actionPlayer action) (actionAmount action)
        & setCurrentBet (gsCurrentBet gs + actionAmount action)
        & setLastRaise (actionAmount action)
        & setLastAggressor (actionPlayer action)
        & advanceAction
        & checkAdvanceRound

    AllIn ->
        let amount = maybe 0 playerChips (findPlayerById (actionPlayer action) gs)
        in gs
        & updatePlayer (actionPlayer action) (\p -> goAllIn $ placeBet amount p)
        & addToPotState (actionPlayer action) amount
        & updateCurrentBetIfHigher amount
        & advanceAction
        & checkAdvanceRound

    Show -> gs
        & updatePlayer (actionPlayer action) (setStatus Showing)
        & advanceAction
        & checkAdvanceRound

    Muck -> gs
        & updatePlayer (actionPlayer action) (setStatus Mucked)
        & advanceAction
        & checkAdvanceRound

  where
    -- Helper for function application (like &)
    (&) = flip ($)

-- | Helper to place a bet for a player
placeBet :: Chips -> Player -> Player
placeBet amount p = p
    { playerChips    = playerChips p - amount
    , playerBet      = playerBet p + amount
    , playerTotalBet = playerTotalBet p + amount
    }

-- | Update a player in the game state
updatePlayer :: PlayerId -> (Player -> Player) -> GameState -> GameState
updatePlayer pid f gs = gs
    { gsPlayers = Map.map (\p -> if playerId p == pid then f p else p) (gsPlayers gs)
    }

-- | Add to pot state
addToPotState :: PlayerId -> Chips -> GameState -> GameState
addToPotState pid amount gs = gs
    { gsPot = addToPot pid amount (gsPot gs)
    }

-- | Set current bet
setCurrentBet :: Chips -> GameState -> GameState
setCurrentBet bet gs = gs { gsCurrentBet = bet }

-- | Update current bet if amount is higher
updateCurrentBetIfHigher :: Chips -> GameState -> GameState
updateCurrentBetIfHigher amount gs
    | amount > gsCurrentBet gs = gs { gsCurrentBet = amount }
    | otherwise = gs

-- | Set last raise amount
setLastRaise :: Chips -> GameState -> GameState
setLastRaise amount gs = gs { gsLastRaise = amount }

-- | Set last aggressor
setLastAggressor :: PlayerId -> GameState -> GameState
setLastAggressor pid gs = gs
    { gsLastAggressor = fmap playerSeat (findPlayerById pid gs)
    }

-- | Advance to next player to act
advanceAction :: GameState -> GameState
advanceAction gs = gs { gsActionOn = nextSeat }
  where
    seats = Map.keys (gsPlayers gs)
    currentSeat = gsActionOn gs
    -- Find next seat with an active player
    nextSeats = dropWhile (<= currentSeat) (cycle seats)
    nextSeat = head $ filter (canActAt gs) nextSeats

    canActAt :: GameState -> SeatIndex -> Bool
    canActAt gs' seat = maybe False canAct (Map.lookup seat (gsPlayers gs'))

-- | Check if round should advance and do so if needed
checkAdvanceRound :: GameState -> GameState
checkAdvanceRound gs
    | shouldAdvanceRound gs = advanceRound gs
    | otherwise = gs

-- | Check if the betting round should advance
shouldAdvanceRound :: GameState -> Bool
shouldAdvanceRound gs =
    let live = getLivePlayers gs
        allActed = all hasActedThisRound live
        allMatched = all (\p -> playerBet p >= gsCurrentBet gs || isAllIn p) live
    in length live <= 1 || (allActed && allMatched)
  where
    hasActedThisRound p =
        playerBet p > 0 || playerStatus p == Folded || isAllIn p

-- | Advance to the next round
advanceRound :: GameState -> GameState
advanceRound gs = case nextRound (gsRound gs) of
    Nothing -> gs { gsRound = Complete }
    Just newRound -> gs
        { gsRound      = newRound
        , gsCurrentBet = 0
        , gsLastRaise  = configBigBlind (gsConfig gs)
        , gsPlayers    = Map.map resetBetForRound (gsPlayers gs)
        }
  where
    resetBetForRound p = p { playerBet = 0 }

-- | Deal hole cards to all active players
dealHoleCards :: GameState -> Either GameError GameState
dealHoleCards gs = do
    let playerCount = Map.size (gsPlayers gs)
        cardsNeeded = playerCount * 2
    (cards, newDeck) <- maybe (Left DeckExhausted) Right
                              (drawN cardsNeeded (gsDeck gs))
    let cardPairs = chunk 2 cards
        players' = Map.mapWithKey (dealToSeat cardPairs) (gsPlayers gs)
    return gs
        { gsDeck    = newDeck
        , gsPlayers = players'
        , gsRound   = PreFlop
        }
  where
    chunk _ [] = []
    chunk n xs = take n xs : chunk n (drop n xs)

    dealToSeat :: [[Card]] -> SeatIndex -> Player -> Player
    dealToSeat cardPairs seat p =
        case cardPairs `safeIndex` seat of
            Just [c1, c2] -> dealCards (mkHoleCards c1 c2) p
            _             -> p

    safeIndex :: [a] -> Int -> Maybe a
    safeIndex xs i
        | i < 0 || i >= length xs = Nothing
        | otherwise = Just (xs !! i)

-- | Deal community cards for the current round
dealCommunityCards :: GameState -> Either GameError GameState
dealCommunityCards gs = case gsRound gs of
    PreFlop -> dealFlop gs
    Flop    -> dealTurn gs
    Turn    -> dealRiver gs
    _       -> Left $ InvalidRound "Cannot deal community cards in this round"

-- | Deal the flop (3 cards)
dealFlop :: GameState -> Either GameError GameState
dealFlop gs = do
    (cards, newDeck) <- maybe (Left DeckExhausted) Right
                              (drawN 3 (gsDeck gs))
    case cards of
        [c1, c2, c3] -> Right gs
            { gsDeck           = newDeck
            , gsCommunityCards = Flop c1 c2 c3
            , gsRound          = Flop
            }
        _ -> Left DeckExhausted

-- | Deal the turn (4th card)
dealTurn :: GameState -> Either GameError GameState
dealTurn gs = do
    (cards, newDeck) <- maybe (Left DeckExhausted) Right
                              (drawN 1 (gsDeck gs))
    case (cards, gsCommunityCards gs) of
        ([c4], Flop c1 c2 c3) -> Right gs
            { gsDeck           = newDeck
            , gsCommunityCards = FlopTurn c1 c2 c3 c4
            , gsRound          = Turn
            }
        _ -> Left DeckExhausted

-- | Deal the river (5th card)
dealRiver :: GameState -> Either GameError GameState
dealRiver gs = do
    (cards, newDeck) <- maybe (Left DeckExhausted) Right
                              (drawN 1 (gsDeck gs))
    case (cards, gsCommunityCards gs) of
        ([c5], FlopTurn c1 c2 c3 c4) -> Right gs
            { gsDeck           = newDeck
            , gsCommunityCards = FlopTurnRiver c1 c2 c3 c4 c5
            , gsRound          = River
            }
        _ -> Left DeckExhausted

-- | Reset game state for a new hand
resetForNewHand :: Deck -> GameState -> GameState
resetForNewHand newDeck gs = gs
    { gsDeck           = newDeck
    , gsCommunityCards = NoCards
    , gsRound          = Ante
    , gsPot            = emptyPotState
    , gsCurrentBet     = 0
    , gsLastRaise      = configBigBlind (gsConfig gs)
    , gsActionLog      = []
    , gsHandNumber     = gsHandNumber gs + 1
    , gsLastAggressor  = Nothing
    , gsPlayers        = Map.map clearCards (gsPlayers gs)
    }

-- | Rotate the dealer button
rotateDealer :: GameState -> GameState
rotateDealer gs = gs { gsDealerSeat = nextDealer }
  where
    seats = Map.keys (gsPlayers gs)
    currentDealer = gsDealerSeat gs
    nextSeats = dropWhile (<= currentDealer) (cycle seats)
    nextDealer = head nextSeats
