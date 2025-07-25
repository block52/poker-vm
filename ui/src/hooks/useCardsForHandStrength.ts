import { useMemo } from "react";
import { usePlayerData } from "./usePlayerData";
import { useTableData } from "./useTableData";
import { Hand } from "pokersolver";

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
      // Solve the hand using pokersolver
      const hand = Hand.solve(allCards);
      
      return {
        name: hand.name,
        descr: hand.descr,
        score: hand.rank
      };
    } catch (error) {
      console.error("Error calculating hand strength:", error);
      return null;
    }
  }, [holeCards, tableDataCommunityCards]);
}; 