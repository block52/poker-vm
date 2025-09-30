import { useMemo } from "react";
import { usePlayerData } from "./usePlayerData";
import { useTableData } from "./useTableData";
import { PokerSolver, PokerGameIntegration, Deck } from "@bitcoinbrisbane/block52";

export interface HandStrength {
  name: string;
  descr: string;
  score: number;
}

export const useCardsForHandStrength = (seatIndex?: number): HandStrength | null => {
  const { holeCards } = usePlayerData(seatIndex);
  const { tableDataCommunityCards } = useTableData();

  return useMemo(() => {
    // If we don't have hole cards, return null
    if (!holeCards || holeCards.length !== 2) {
      return null;
    }

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
        score: evaluation.handType
      };
    } catch (error) {
      console.error("Error calculating hand strength:", error);
      return null;
    }
  }, [holeCards, tableDataCommunityCards]);
}; 