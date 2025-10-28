import { useMemo } from "react";
import { usePlayerData } from "./usePlayerData";
import { useTableData } from "./useTableData";
import { PokerSolver, PokerGameIntegration, Deck } from "@bitcoinbrisbane/block52";

export interface HandStrength {
  name: string;
  descr: string; // Obsolete, use description instead.  Was used in the old lib
  description: string;
  score: number;
  hand: string[]; // Your cards that make up the hand
}

export const useCardsForHandStrength = (seatIndex?: number): HandStrength | null => {
  const { holeCards } = usePlayerData(seatIndex);
  const { tableDataCommunityCards } = useTableData();

  return useMemo(() => {
    // Combine hole cards and community cards
    const allCards = [...holeCards, ...tableDataCommunityCards];

    try {
      // Convert string cards to Card objects and evaluate using our poker solver
      const cardObjects = allCards.map(cardStr => Deck.fromString(cardStr));
      const evaluation = PokerSolver.findBestHand(cardObjects);
      const description = PokerGameIntegration.formatHandDescription(evaluation);

      return {
        name: description,
        descr: description,
        description: description,
        score: evaluation.handType,
        hand: evaluation.bestHand.map(card => card.toString()),
      };
    } catch (error) {
      console.error("Error calculating hand strength:", error);
      return null;
    }
  }, [holeCards, tableDataCommunityCards]);
};
