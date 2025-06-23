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

    // Pre-flop strength - just show pocket cards
    if (!tableDataCommunityCards || tableDataCommunityCards.length === 0) {
      // For pocket pairs
      if (holeCards[0][0] === holeCards[1][0]) {
        return {
          name: "Pocket Pair",
          descr: `Pocket ${holeCards[0][0]}s`,
          score: 1
        };
      }
      
      // For non-pairs, show high card
      const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
      const card1Rank = ranks.indexOf(holeCards[0][0]);
      const card2Rank = ranks.indexOf(holeCards[1][0]);
      const highCard = ranks[Math.max(card1Rank, card2Rank)];
      
      return {
        name: "High Card",
        descr: `High Card: ${highCard === "T" ? "10" : highCard}`,
        score: 0
      };
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