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
    , LegalAction(..)
      -- * Constructors
    , newGame
    , defaultConfig
      -- * Game Operations
    , performAction
    , dealHoleCards
    , dealCommunityCards
    , advanceRound
      -- * Player Queries
    , currentPlayerToAct
    , getNextPlayerToAct
    , playerExists
    , getPlayerCount
    , getActivePlayerCount
    , getSeatedPlayers
    , findActivePlayers
    , getLivePlayers
    , getShowdownPlayers
    , getPlayer
    , getPlayerAtSeat
    , getPlayerSeatNumber
    , getPlayerStatus
    , findNextEmptySeat
    , getAvailableSeats
      -- * Player Modifications
    , joinAtSeat
    , removePlayer
    , canTopUp
    , getMaxTopUpAmount
      -- * Game Queries
    , isHandComplete
    , hasRoundEnded
    , getWinners
    , getPot
      -- * Action Queries
    , getActionIndex
    , getLegalActions
    , getLastRoundAction
    , getPlayersLastAction
    , getPreviousActions
    , getActionsForRound
      -- * Bet Queries
    , getAllBets
    , getBetsForRound
    , getPlayerTotalBets
      -- * State Transformations
    , applyAction
    , resetForNewHand
    , rotateDealer
      -- * Serialization
    , gameStateToJson
    , gameStateFromJson
    ) where

import TexasHoldem.Card
import TexasHoldem.Deck
import TexasHoldem.Hand hiding (Flop)
import qualified TexasHoldem.Hand as H
import TexasHoldem.Player hiding (AllIn)
import TexasHoldem.Action
import TexasHoldem.Round
import TexasHoldem.Pot
import TexasHoldem.Evaluation

import qualified Data.Map.Strict as Map
import Data.List (sortBy, find, foldl')
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

    -- All players with the best hand
    winnersWithHands
        | null validHands = []  -- No valid hands, no winners
        | otherwise =
            let bestRank = maximum $ map (ehRank . snd) validHands
            in filter (\(_, h) -> ehRank h == bestRank) validHands

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
advanceAction gs
    | null actablePlayers = gs  -- No one can act, keep current
    | otherwise = gs { gsActionOn = nextSeat }
  where
    seats = Map.keys (gsPlayers gs)
    currentSeat = gsActionOn gs
    actablePlayers = filter (canActAt gs) seats
    -- Find next seat with an active player (cycling from current)
    nextSeats = dropWhile (<= currentSeat) (cycle actablePlayers)
    nextSeat = head nextSeats

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
    let orderedSeats = Map.keys (gsPlayers gs)  -- sorted seats
        playerCount = length orderedSeats
        cardsNeeded = playerCount * 2
    (cards, newDeck) <- maybe (Left DeckExhausted) Right
                              (drawN cardsNeeded (gsDeck gs))
    let cardPairs = chunk 2 cards
        seatToCards = Map.fromList $ zip orderedSeats cardPairs
        players' = Map.mapWithKey (dealToSeat seatToCards) (gsPlayers gs)
    return gs
        { gsDeck    = newDeck
        , gsPlayers = players'
        , gsRound   = PreFlop
        }
  where
    chunk _ [] = []
    chunk n xs = take n xs : chunk n (drop n xs)

    dealToSeat :: Map.Map SeatIndex [Card] -> SeatIndex -> Player -> Player
    dealToSeat seatToCards seat p =
        case Map.lookup seat seatToCards of
            Just [c1, c2] -> dealCards (mkHoleCards c1 c2) p
            _             -> p

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
            , gsCommunityCards = H.Flop c1 c2 c3
            , gsRound          = Flop
            }
        _ -> Left DeckExhausted

-- | Deal the turn (4th card)
dealTurn :: GameState -> Either GameError GameState
dealTurn gs = do
    (cards, newDeck) <- maybe (Left DeckExhausted) Right
                              (drawN 1 (gsDeck gs))
    case (cards, gsCommunityCards gs) of
        ([c4], H.Flop c1 c2 c3) -> Right gs
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

--------------------------------------------------------------------------------
-- Player Queries (TypeScript compatible)
--------------------------------------------------------------------------------

-- | Get next player to act (alias for currentPlayerToAct)
getNextPlayerToAct :: GameState -> Maybe Player
getNextPlayerToAct = currentPlayerToAct

-- | Check if a player exists in the game
playerExists :: PlayerId -> GameState -> Bool
playerExists pid gs = isJust $ findPlayerById pid gs

-- | Get total number of players
getPlayerCount :: GameState -> Int
getPlayerCount = Map.size . gsPlayers

-- | Get number of active players
getActivePlayerCount :: GameState -> Int
getActivePlayerCount = length . findActivePlayers

-- | Get all seated players
getSeatedPlayers :: GameState -> [Player]
getSeatedPlayers = Map.elems . gsPlayers

-- | Find all active players (not waiting)
findActivePlayers :: GameState -> [Player]
findActivePlayers gs = filter isActive $ Map.elems (gsPlayers gs)

-- | Get a player by ID
getPlayer :: PlayerId -> GameState -> Maybe Player
getPlayer = findPlayerById

-- | Get player at a specific seat
getPlayerAtSeat :: SeatIndex -> GameState -> Maybe Player
getPlayerAtSeat seat gs = Map.lookup seat (gsPlayers gs)

-- | Get seat number for a player
getPlayerSeatNumber :: PlayerId -> GameState -> Maybe SeatIndex
getPlayerSeatNumber pid gs = playerSeat <$> findPlayerById pid gs

-- | Get a player's status
getPlayerStatus :: PlayerId -> GameState -> Maybe PlayerStatus
getPlayerStatus pid gs = playerStatus <$> findPlayerById pid gs

-- | Find next empty seat starting from given position
findNextEmptySeat :: SeatIndex -> GameState -> Maybe SeatIndex
findNextEmptySeat start gs =
    let maxSeats = configMaxPlayers (gsConfig gs)
        allSeats = [start .. maxSeats - 1] ++ [0 .. start - 1]
        emptySeat s = not $ Map.member s (gsPlayers gs)
    in find emptySeat allSeats

-- | Get all available (empty) seats
getAvailableSeats :: GameState -> [SeatIndex]
getAvailableSeats gs =
    let maxSeats = configMaxPlayers (gsConfig gs)
        allSeats = [0 .. maxSeats - 1]
    in filter (\s -> not $ Map.member s (gsPlayers gs)) allSeats

--------------------------------------------------------------------------------
-- Player Modifications
--------------------------------------------------------------------------------

-- | Add a player at a specific seat
joinAtSeat :: Player -> SeatIndex -> GameState -> Either GameError GameState
joinAtSeat player seat gs
    | Map.member seat (gsPlayers gs) = Left $ InvalidPlayer "Seat is occupied"
    | seat < 0 || seat >= configMaxPlayers (gsConfig gs) = Left $ InvalidPlayer "Invalid seat"
    | playerChips player < configMinBuyIn (gsConfig gs) = Left $ InvalidPlayer "Below minimum buy-in"
    | playerChips player > configMaxBuyIn (gsConfig gs) = Left $ InvalidPlayer "Above maximum buy-in"
    | otherwise = Right gs { gsPlayers = Map.insert seat player (gsPlayers gs) }

-- | Remove a player from the game
removePlayer :: PlayerId -> GameState -> GameState
removePlayer pid gs = gs
    { gsPlayers = Map.filter (\p -> playerId p /= pid) (gsPlayers gs)
    }

-- | Check if a player can top up their stack
canTopUp :: PlayerId -> GameState -> Bool
canTopUp pid gs = case findPlayerById pid gs of
    Nothing -> False
    Just p  -> playerChips p < configMaxBuyIn (gsConfig gs) &&
               gsRound gs == Complete  -- Can only top up between hands

-- | Get maximum top-up amount for a player
getMaxTopUpAmount :: PlayerId -> GameState -> Chips
getMaxTopUpAmount pid gs = case findPlayerById pid gs of
    Nothing -> 0
    Just p  -> max 0 $ configMaxBuyIn (gsConfig gs) - playerChips p

--------------------------------------------------------------------------------
-- Game Queries
--------------------------------------------------------------------------------

-- | Check if a specific round has ended
hasRoundEnded :: Round -> GameState -> Bool
hasRoundEnded round gs
    | gsRound gs /= round = True  -- Already past this round
    | otherwise = shouldAdvanceRound gs

-- | Get total pot amount
getPot :: GameState -> Chips
getPot = totalPot . gsPot

--------------------------------------------------------------------------------
-- Action Queries
--------------------------------------------------------------------------------

-- | Legal action with min/max amounts
data LegalAction = LegalAction
    { laAction    :: !ActionType
    , laMinAmount :: !Chips
    , laMaxAmount :: !Chips
    } deriving (Eq, Show)

-- | Get current action index
getActionIndex :: GameState -> Int
getActionIndex = length . gsActionLog

-- | Get legal actions for a player
getLegalActions :: PlayerId -> GameState -> [LegalAction]
getLegalActions pid gs = case findPlayerById pid gs of
    Nothing -> []
    Just player
        | not (canAct player) -> []
        | gsRound gs == Ante -> blindActions
        | gsRound gs == Showdown -> showdownActions
        | otherwise -> bettingActions player
  where
    bb = configBigBlind (gsConfig gs)
    sb = configSmallBlind (gsConfig gs)

    blindActions =
        [ LegalAction PostSmallBlind sb sb
        , LegalAction PostBigBlind bb bb
        ]

    showdownActions =
        [ LegalAction Show 0 0
        , LegalAction Muck 0 0
        ]

    bettingActions player =
        let chips = playerChips player
            currentBet = gsCurrentBet gs
            playerBetAmt = playerBet player
            toCall = currentBet - playerBetAmt
            minRaise = currentBet + max (gsLastRaise gs) bb
        in catMaybes
            [ Just $ LegalAction Fold 0 0
            , if currentBet == 0 || playerBetAmt >= currentBet
              then Just $ LegalAction Check 0 0
              else Nothing
            , if toCall > 0 && toCall <= chips
              then Just $ LegalAction Call toCall toCall
              else Nothing
            , if currentBet == 0 && chips >= bb
              then Just $ LegalAction Bet bb chips
              else Nothing
            , if currentBet > 0 && chips >= minRaise
              then Just $ LegalAction Raise minRaise chips
              else Nothing
            , Just $ LegalAction AllIn chips chips
            ]

    catMaybes = mapMaybe id

-- | Get the last action in the current round
getLastRoundAction :: GameState -> Maybe ActionLog
getLastRoundAction gs = case gsActionLog gs of
    [] -> Nothing
    xs -> Just $ last xs

-- | Get a player's last action
getPlayersLastAction :: PlayerId -> GameState -> Maybe ActionLog
getPlayersLastAction pid gs =
    let playerActions = filter (\al -> actionPlayer (logAction al) == pid) (gsActionLog gs)
    in case playerActions of
        [] -> Nothing
        xs -> Just $ last xs

-- | Get all previous actions
getPreviousActions :: GameState -> [ActionLog]
getPreviousActions = gsActionLog

-- | Get actions for a specific round
getActionsForRound :: Round -> GameState -> [ActionLog]
getActionsForRound round gs = filter (\al -> logRound al == round) (gsActionLog gs)

--------------------------------------------------------------------------------
-- Bet Queries
--------------------------------------------------------------------------------

-- | Get all bets (from pot state)
getAllBets :: GameState -> Map.Map PlayerId Chips
getAllBets = playerBets . gsPot

-- | Get bets for a specific round
-- Note: In pure functional style, we track cumulative bets, not per-round
getBetsForRound :: Round -> GameState -> Map.Map PlayerId Chips
getBetsForRound round gs =
    let roundActions = getActionsForRound round gs
        addBet acc al = Map.insertWith (+) (actionPlayer $ logAction al)
                                           (actionAmount $ logAction al) acc
    in foldl' addBet Map.empty roundActions

-- | Get total bets for a player
getPlayerTotalBets :: PlayerId -> GameState -> Chips
getPlayerTotalBets pid gs = Map.findWithDefault 0 pid (getAllBets gs)

--------------------------------------------------------------------------------
-- Serialization
--------------------------------------------------------------------------------

-- | Convert game state to JSON-like structure
-- Returns a map of key-value pairs for serialization
gameStateToJson :: GameState -> Map.Map String String
gameStateToJson gs = Map.fromList
    [ ("round", show $ gsRound gs)
    , ("handNumber", show $ gsHandNumber gs)
    , ("pot", show $ getPot gs)
    , ("currentBet", show $ gsCurrentBet gs)
    , ("dealerSeat", show $ gsDealerSeat gs)
    , ("actionOn", show $ gsActionOn gs)
    , ("playerCount", show $ getPlayerCount gs)
    , ("communityCards", showCommunityCards $ gsCommunityCards gs)
    , ("deck", deckToString $ gsDeck gs)
    ]
  where
    showCommunityCards NoCards = ""
    showCommunityCards cc = unwords $ map toMnemonic $ communityCardsList cc

-- | Parse game state from JSON-like structure
-- This is a simplified version - full implementation would need more fields
gameStateFromJson :: Map.Map String String -> GameConfig -> Maybe GameState
gameStateFromJson _json _config = Nothing  -- TODO: Implement full parsing
