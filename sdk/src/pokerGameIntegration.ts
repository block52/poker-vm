import { PokerSolver, HandEvaluation, HandType } from "./pokerSolver";
import { Card } from "./types/game";
import { Deck } from "./deck";

/**
 * Example integration of custom poker solver with game engine
 * Demonstrates how to replace pokersolver with our custom implementation
 */
export class PokerGameIntegration {
    /**
     * Evaluate multiple player hands and determine winners
     * @param playerHands Array of 7-card hands (2 hole + 5 community cards each)
     * @returns Array of winner indices and their hand evaluations
     */
    public static evaluateShowdown(playerHands: Card[][]): {
        winners: number[];
        evaluations: HandEvaluation[];
        potDistribution: { playerId: number; share: number }[];
    } {
        if (playerHands.length === 0) {
            throw new Error("No hands to evaluate");
        }

        // Validate all hands have exactly 7 cards
        for (let i = 0; i < playerHands.length; i++) {
            if (playerHands[i].length !== 7) {
                throw new Error(`Player ${i} hand must have exactly 7 cards (2 hole + 5 community)`);
            }
        }

        // Evaluate each player's best hand
        const evaluations = playerHands.map(hand => PokerSolver.findBestHand(hand));

        // Find winners
        const winners = PokerSolver.findWinners(evaluations);

        // Calculate pot distribution (equal split among winners)
        const potDistribution = winners.map(playerId => ({
            playerId,
            share: 1 / winners.length
        }));

        return {
            winners,
            evaluations,
            potDistribution
        };
    }

    /**
     * Compare two specific hands (for heads-up scenarios)
     * @param hand1 First player's 7 cards
     * @param hand2 Second player's 7 cards
     * @returns Comparison result and hand details
     */
    public static compareHeadsUp(
        hand1: Card[],
        hand2: Card[]
    ): {
        winner: "player1" | "player2" | "tie";
        comparison: number;
        hand1Evaluation: HandEvaluation;
        hand2Evaluation: HandEvaluation;
    } {
        const eval1 = PokerSolver.findBestHand(hand1);
        const eval2 = PokerSolver.findBestHand(hand2);
        const comparison = PokerSolver.compareHands(eval1, eval2);

        let winner: "player1" | "player2" | "tie";
        if (comparison > 0) {
            winner = "player1";
        } else if (comparison < 0) {
            winner = "player2";
        } else {
            winner = "tie";
        }

        return {
            winner,
            comparison,
            hand1Evaluation: eval1,
            hand2Evaluation: eval2
        };
    }

    /**
     * Create a formatted hand description for UI display
     * @param evaluation Hand evaluation result
     * @returns Human-readable hand description
     */
    public static formatHandDescription(evaluation: HandEvaluation): string {
        const { handType, rankValues, description } = evaluation;

        switch (handType) {
            case HandType.ROYAL_FLUSH:
                return "Royal Flush";

            case HandType.STRAIGHT_FLUSH:
                return `Straight Flush, ${PokerSolver.formatRank(rankValues[0])} high`;

            case HandType.FOUR_OF_A_KIND:
                return `Four ${PokerSolver.formatRank(rankValues[0])}s`;

            case HandType.FULL_HOUSE:
                return `Full House, ${PokerSolver.formatRank(rankValues[0])}s over ${PokerSolver.formatRank(rankValues[1])}s`;

            case HandType.FLUSH:
                return `Flush, ${PokerSolver.formatRank(rankValues[0])} high`;

            case HandType.STRAIGHT:
                return `Straight, ${PokerSolver.formatRank(rankValues[0])} high`;

            case HandType.THREE_OF_A_KIND:
                return `Three ${PokerSolver.formatRank(rankValues[0])}s`;

            case HandType.TWO_PAIR:
                return `Two Pair, ${PokerSolver.formatRank(rankValues[0])}s and ${PokerSolver.formatRank(rankValues[1])}s`;

            case HandType.PAIR:
                return `Pair of ${PokerSolver.formatRank(rankValues[0])}s`;

            case HandType.HIGH_CARD:
                return `${PokerSolver.formatRank(rankValues[0])} high`;

            default:
                return description;
        }
    }

    /**
     * Example usage with string cards (for testing/debugging)
     * @param playerCardStrings Array of player hands as mnemonic strings
     * @returns Formatted results
     */
    public static exampleShowdown(playerCardStrings: string[][]): {
        winners: number[];
        results: Array<{
            playerId: number;
            handDescription: string;
            isWinner: boolean;
            bestHand: string[];
        }>;
    } {
        // Convert string cards to Block52 Card objects
        const playerHands = playerCardStrings.map(cards => cards.map(cardStr => Deck.fromString(cardStr)));

        // Evaluate showdown
        const { winners, evaluations } = this.evaluateShowdown(playerHands);

        // Format results
        const results = evaluations.map((evaluation, index) => ({
            playerId: index,
            handDescription: this.formatHandDescription(evaluation),
            isWinner: winners.includes(index),
            bestHand: evaluation.bestHand.map(card => card.mnemonic)
        }));

        return { winners, results };
    }
}

// Example usage:
/*
const example = PokerGameIntegration.exampleShowdown([
    ['AS', 'AH', '2C', '3D', '4S', '5H', '6C'], // Player 0: Pair of Aces
    ['KS', 'KH', '2C', '3D', '4S', '5H', '6C'], // Player 1: Pair of Kings
    ['2H', '7C', '2C', '3D', '4S', '5H', '6C']  // Player 2: Pair of 2s
]);

console.log('Winners:', example.winners); // [0] - Player 0 wins
console.log('Results:', example.results);
*/
