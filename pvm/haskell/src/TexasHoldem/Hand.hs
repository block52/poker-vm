{-|
Module      : TexasHoldem.Hand
Description : Hand types and basic hand operations
Copyright   : (c) Block52, 2024
License     : MIT
Maintainer  : dev@block52.xyz

This module defines hand types and basic operations for poker hands.
-}
module TexasHoldem.Hand
    ( -- * Types
      Hand(..)
    , HoleCards(..)
    , CommunityCards(..)
      -- * Constructors
    , mkHoleCards
    , mkCommunityCards
    , mkHand
      -- * Accessors
    , handCards
    , holeCardsList
    , communityCardsList
      -- * Utilities
    , combineForEvaluation
    ) where

import TexasHoldem.Card

-- | A player's two private hole cards
data HoleCards = HoleCards !Card !Card
    deriving (Eq, Show)

-- | The community cards (0-5 cards on the board)
data CommunityCards
    = NoCards
    | Flop !Card !Card !Card
    | FlopTurn !Card !Card !Card !Card
    | FlopTurnRiver !Card !Card !Card !Card !Card
    deriving (Eq, Show)

-- | A complete 5-card poker hand for evaluation
newtype Hand = Hand { handCards :: [Card] }
    deriving (Eq, Show)

-- | Create hole cards from two cards
mkHoleCards :: Card -> Card -> HoleCards
mkHoleCards = HoleCards

-- | Get hole cards as a list
holeCardsList :: HoleCards -> [Card]
holeCardsList (HoleCards c1 c2) = [c1, c2]

-- | Create community cards
mkCommunityCards :: [Card] -> Maybe CommunityCards
mkCommunityCards []           = Just NoCards
mkCommunityCards [c1,c2,c3]   = Just $ Flop c1 c2 c3
mkCommunityCards [c1,c2,c3,c4] = Just $ FlopTurn c1 c2 c3 c4
mkCommunityCards [c1,c2,c3,c4,c5] = Just $ FlopTurnRiver c1 c2 c3 c4 c5
mkCommunityCards _ = Nothing

-- | Get community cards as a list
communityCardsList :: CommunityCards -> [Card]
communityCardsList NoCards = []
communityCardsList (Flop c1 c2 c3) = [c1, c2, c3]
communityCardsList (FlopTurn c1 c2 c3 c4) = [c1, c2, c3, c4]
communityCardsList (FlopTurnRiver c1 c2 c3 c4 c5) = [c1, c2, c3, c4, c5]

-- | Create a 5-card hand
mkHand :: [Card] -> Maybe Hand
mkHand cs
    | length cs == 5 = Just $ Hand cs
    | otherwise      = Nothing

-- | Combine hole cards and community cards for evaluation
-- Returns all cards available to make a hand (2-7 cards)
combineForEvaluation :: HoleCards -> CommunityCards -> [Card]
combineForEvaluation hole community =
    holeCardsList hole ++ communityCardsList community
