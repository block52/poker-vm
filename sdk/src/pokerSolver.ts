import { Card, SUIT } from "./types/game";

/**
 * Poker hand types in order of strength (weakest to strongest)
 */
export enum HandType {
    HIGH_CARD = 0,
    PAIR = 1,
    TWO_PAIR = 2,
    THREE_OF_A_KIND = 3,
    STRAIGHT = 4,
    FLUSH = 5,
    FULL_HOUSE = 6,
    FOUR_OF_A_KIND = 7,
    STRAIGHT_FLUSH = 8,
    ROYAL_FLUSH = 9
}

/**
 * Represents an evaluated poker hand
 */
export interface HandEvaluation {
    handType: HandType;
    bestHand: Card[];
    rankValues: number[]; // For split pots
    description: string;
}

/**
 * Custom poker solver for 7-card Texas Hold'em
 * Uses Block52 Card structure with proper rank handling
 */
export class PokerSolver {
    /**
     * Convert rank 1 (Ace) to 14 for high-ace calculations
     */
    private static getHighRank(rank: number): number {
        return rank === 1 ? 14 : rank;
    }

    /**
     * Get all possible 5-card combinations from 7 cards
     */
    private static getCombinations(cards: Card[]): Card[][] {
        if (cards.length !== 7) {
            throw new Error("Texas Hold'em requires exactly 7 cards");
        }

        const combinations: Card[][] = [];

        // Generate all combinations of 5 cards from 7
        for (let i = 0; i < 7; i++) {
            for (let j = i + 1; j < 7; j++) {
                for (let k = j + 1; k < 7; k++) {
                    for (let l = k + 1; l < 7; l++) {
                        for (let m = l + 1; m < 7; m++) {
                            combinations.push([cards[i], cards[j], cards[k], cards[l], cards[m]]);
                        }
                    }
                }
            }
        }

        return combinations;
    }

    /**
     * Evaluate a 5-card poker hand
     */
    private static evaluateHand(cards: Card[]): HandEvaluation {
        if (cards.length !== 5) {
            throw new Error("Hand evaluation requires exactly 5 cards");
        }

        // Sort cards by rank (high-ace)
        const sortedCards = [...cards].sort((a, b) => {
            const aRank = this.getHighRank(a.rank);
            const bRank = this.getHighRank(b.rank);
            return bRank - aRank;
        });

        // Count ranks and suits
        const rankCounts = new Map<number, number>();
        const suitCounts = new Map<SUIT, number>();

        for (const card of sortedCards) {
            const highRank = this.getHighRank(card.rank);
            rankCounts.set(highRank, (rankCounts.get(highRank) || 0) + 1);
            suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
        }

        const isFlush = suitCounts.size === 1;
        const isStraight = this.isStraight(sortedCards);
        const isLowStraight = this.isLowStraight(sortedCards); // A-2-3-4-5

        // Check for straight flush and royal flush
        if (isFlush && isStraight) {
            const highRank = this.getHighRank(sortedCards[0].rank);
            if (highRank === 14 && this.getHighRank(sortedCards[1].rank) === 13) {
                return {
                    handType: HandType.ROYAL_FLUSH,
                    bestHand: sortedCards,
                    rankValues: [14],
                    description: "Royal Flush"
                };
            }
            return {
                handType: HandType.STRAIGHT_FLUSH,
                bestHand: sortedCards,
                rankValues: isLowStraight ? [5] : [this.getHighRank(sortedCards[0].rank)],
                description: "Straight Flush"
            };
        }

        // Check for four of a kind
        const rankCountsArray = Array.from(rankCounts.entries()).sort((a, b) => b[1] - a[1] || b[0] - a[0]);
        if (rankCountsArray[0][1] === 4) {
            return {
                handType: HandType.FOUR_OF_A_KIND,
                bestHand: sortedCards,
                rankValues: [rankCountsArray[0][0], rankCountsArray[1][0]],
                description: "Four of a Kind"
            };
        }

        // Check for full house
        if (rankCountsArray[0][1] === 3 && rankCountsArray[1][1] === 2) {
            return {
                handType: HandType.FULL_HOUSE,
                bestHand: sortedCards,
                rankValues: [rankCountsArray[0][0], rankCountsArray[1][0]],
                description: "Full House"
            };
        }

        // Check for flush
        if (isFlush) {
            return {
                handType: HandType.FLUSH,
                bestHand: sortedCards,
                rankValues: sortedCards.map(card => this.getHighRank(card.rank)),
                description: "Flush"
            };
        }

        // Check for straight
        if (isStraight || isLowStraight) {
            return {
                handType: HandType.STRAIGHT,
                bestHand: sortedCards,
                rankValues: isLowStraight ? [5] : [this.getHighRank(sortedCards[0].rank)],
                description: "Straight"
            };
        }

        // Check for three of a kind
        if (rankCountsArray[0][1] === 3) {
            return {
                handType: HandType.THREE_OF_A_KIND,
                bestHand: sortedCards,
                rankValues: [rankCountsArray[0][0], rankCountsArray[1][0], rankCountsArray[2][0]],
                description: "Three of a Kind"
            };
        }

        // Check for two pair
        if (rankCountsArray[0][1] === 2 && rankCountsArray[1][1] === 2) {
            return {
                handType: HandType.TWO_PAIR,
                bestHand: sortedCards,
                rankValues: [rankCountsArray[0][0], rankCountsArray[1][0], rankCountsArray[2][0]],
                description: "Two Pair"
            };
        }

        // Check for pair
        if (rankCountsArray[0][1] === 2) {
            return {
                handType: HandType.PAIR,
                bestHand: sortedCards,
                rankValues: [rankCountsArray[0][0], rankCountsArray[1][0], rankCountsArray[2][0], rankCountsArray[3][0]],
                description: "Pair"
            };
        }

        // High card
        return {
            handType: HandType.HIGH_CARD,
            bestHand: sortedCards,
            rankValues: sortedCards.map(card => this.getHighRank(card.rank)),
            description: "High Card"
        };
    }

    /**
     * Check if cards form a straight (excluding low straight A-2-3-4-5)
     */
    private static isStraight(sortedCards: Card[]): boolean {
        for (let i = 0; i < 4; i++) {
            const currentRank = this.getHighRank(sortedCards[i].rank);
            const nextRank = this.getHighRank(sortedCards[i + 1].rank);
            if (currentRank - nextRank !== 1) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check for low straight A-2-3-4-5 (wheel)
     */
    private static isLowStraight(sortedCards: Card[]): boolean {
        const ranks = sortedCards.map(card => this.getHighRank(card.rank)).sort((a, b) => a - b);
        return ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 4 && ranks[3] === 5 && ranks[4] === 14;
    }

    /**
     * Find the best 5-card hand from 7 cards
     */
    public static findBestHand(cards: Card[]): HandEvaluation {
        if (cards.length !== 7) {
            throw new Error("Texas Hold'em requires exactly 7 cards (2 hole cards + 5 community cards)");
        }

        const combinations = this.getCombinations(cards);
        let bestHand: HandEvaluation | null = null;

        for (const combination of combinations) {
            const evaluation = this.evaluateHand(combination);

            if (!bestHand || this.compareHands(evaluation, bestHand) > 0) {
                bestHand = evaluation;
            }
        }

        if (!bestHand) {
            throw new Error("Failed to evaluate hand");
        }

        return bestHand;
    }

    /**
     * Evaluate a hand with any number of cards (2-7)
     * This is useful for showing hand strength during all betting rounds
     * @param cards Array of 2-7 cards
     * @returns HandEvaluation with current best hand or preflop description
     */
    public static evaluatePartialHand(cards: Card[]): HandEvaluation {
        if (cards.length < 2) {
            throw new Error("Need at least 2 cards to evaluate");
        }

        if (cards.length > 7) {
            throw new Error("Cannot have more than 7 cards");
        }

        // Full hand - use standard evaluation
        if (cards.length === 7) {
            return this.findBestHand(cards);
        }

        // Preflop - just hole cards
        if (cards.length === 2) {
            return this.evaluatePreflopHand(cards);
        }

        // Flop (5 cards) or Turn (6 cards) - find best hand from available cards
        if (cards.length >= 5) {
            return this.evaluateBestFromAvailable(cards);
        }

        // 3-4 cards - shouldn't happen in normal play, but handle gracefully
        // Just describe what we have
        return this.evaluateIncompleteHand(cards);
    }

    /**
     * Evaluate preflop hand (2 hole cards only)
     * Returns descriptive hand names like "Pocket Aces", "Suited Connectors"
     */
    private static evaluatePreflopHand(cards: Card[]): HandEvaluation {
        if (cards.length !== 2) {
            throw new Error("Preflop evaluation requires exactly 2 cards");
        }

        const [card1, card2] = cards;
        const rank1 = this.getHighRank(card1.rank);
        const rank2 = this.getHighRank(card2.rank);
        const highRank = Math.max(rank1, rank2);
        const lowRank = Math.min(rank1, rank2);
        const isPair = rank1 === rank2;
        const isSuited = card1.suit === card2.suit;
        const gap = highRank - lowRank;

        let description: string;
        let handType: HandType;

        if (isPair) {
            // Pocket pairs
            const rankName = this.getRankName(rank1);
            description = `Pocket ${rankName}s`;
            handType = HandType.PAIR;
        } else if (isSuited) {
            if (gap === 1) {
                description = `${this.formatRank(highRank)}${this.formatRank(lowRank)} Suited Connectors`;
            } else if (gap === 2) {
                description = `${this.formatRank(highRank)}${this.formatRank(lowRank)} Suited One-Gapper`;
            } else {
                description = `${this.formatRank(highRank)}${this.formatRank(lowRank)} Suited`;
            }
            handType = HandType.HIGH_CARD;
        } else {
            if (gap === 1) {
                description = `${this.formatRank(highRank)}${this.formatRank(lowRank)} Connectors`;
            } else {
                description = `${this.formatRank(highRank)}${this.formatRank(lowRank)} Offsuit`;
            }
            handType = HandType.HIGH_CARD;
        }

        // Sort cards by rank for bestHand
        const sortedCards = [...cards].sort((a, b) =>
            this.getHighRank(b.rank) - this.getHighRank(a.rank)
        );

        return {
            handType,
            bestHand: sortedCards,
            rankValues: [highRank, lowRank],
            description
        };
    }

    /**
     * Get full rank name for pocket pairs
     */
    private static getRankName(rank: number): string {
        switch (rank) {
            case 14:
            case 1:
                return "Ace";
            case 13:
                return "King";
            case 12:
                return "Queen";
            case 11:
                return "Jack";
            case 10:
                return "Ten";
            default:
                return this.formatRank(rank);
        }
    }

    /**
     * Evaluate best hand from 5-6 available cards
     * Generates all possible 5-card combinations and finds the best
     */
    private static evaluateBestFromAvailable(cards: Card[]): HandEvaluation {
        if (cards.length < 5 || cards.length > 6) {
            throw new Error("evaluateBestFromAvailable requires 5-6 cards");
        }

        // If exactly 5 cards, just evaluate them directly
        if (cards.length === 5) {
            return this.evaluateHand(cards);
        }

        // 6 cards - find best 5-card combination
        const combinations = this.getCombinationsFlexible(cards, 5);
        let bestHand: HandEvaluation | null = null;

        for (const combination of combinations) {
            const evaluation = this.evaluateHand(combination);

            if (!bestHand || this.compareHands(evaluation, bestHand) > 0) {
                bestHand = evaluation;
            }
        }

        if (!bestHand) {
            throw new Error("Failed to evaluate hand");
        }

        return bestHand;
    }

    /**
     * Get all combinations of k cards from n cards
     * Generic version of getCombinations
     */
    private static getCombinationsFlexible(cards: Card[], k: number): Card[][] {
        const result: Card[][] = [];
        const n = cards.length;

        if (k > n) {
            return result;
        }

        // Generate combinations using indices
        const indices: number[] = [];
        for (let i = 0; i < k; i++) {
            indices.push(i);
        }

        while (true) {
            // Add current combination
            result.push(indices.map(i => cards[i]));

            // Find rightmost index that can be incremented
            let i = k - 1;
            while (i >= 0 && indices[i] === n - k + i) {
                i--;
            }

            if (i < 0) {
                break;
            }

            // Increment this index and reset all indices to the right
            indices[i]++;
            for (let j = i + 1; j < k; j++) {
                indices[j] = indices[j - 1] + 1;
            }
        }

        return result;
    }

    /**
     * Handle incomplete hands (3-4 cards) - shouldn't happen in normal play
     */
    private static evaluateIncompleteHand(cards: Card[]): HandEvaluation {
        // Sort cards by rank
        const sortedCards = [...cards].sort((a, b) =>
            this.getHighRank(b.rank) - this.getHighRank(a.rank)
        );

        // Count ranks
        const rankCounts = new Map<number, number>();
        for (const card of sortedCards) {
            const highRank = this.getHighRank(card.rank);
            rankCounts.set(highRank, (rankCounts.get(highRank) || 0) + 1);
        }

        const rankCountsArray = Array.from(rankCounts.entries())
            .sort((a, b) => b[1] - a[1] || b[0] - a[0]);

        let handType: HandType;
        let description: string;

        if (rankCountsArray[0][1] >= 3) {
            handType = HandType.THREE_OF_A_KIND;
            description = "Three of a Kind";
        } else if (rankCountsArray[0][1] === 2) {
            if (rankCountsArray.length > 1 && rankCountsArray[1][1] === 2) {
                handType = HandType.TWO_PAIR;
                description = "Two Pair";
            } else {
                handType = HandType.PAIR;
                description = "Pair";
            }
        } else {
            handType = HandType.HIGH_CARD;
            description = `High Card ${this.formatRank(rankCountsArray[0][0])}`;
        }

        return {
            handType,
            bestHand: sortedCards,
            rankValues: sortedCards.map(card => this.getHighRank(card.rank)),
            description
        };
    }

    /**
     * Compare two hands
     * @returns 1 if hand1 wins, -1 if hand2 wins, 0 if tie
     */
    public static compareHands(hand1: HandEvaluation, hand2: HandEvaluation): number {
        // First compare hand types
        if (hand1.handType !== hand2.handType) {
            return hand1.handType > hand2.handType ? 1 : -1;
        }

        // Same hand type, compare rank values
        for (let i = 0; i < Math.max(hand1.rankValues.length, hand2.rankValues.length); i++) {
            const rank1 = hand1.rankValues[i] || 0;
            const rank2 = hand2.rankValues[i] || 0;

            if (rank1 !== rank2) {
                return rank1 > rank2 ? 1 : -1;
            }
        }

        return 0; // Tie
    }

    /**
     * Determine winners from multiple hands
     * @param hands Array of hands to compare
     * @returns Array of indices of winning hands
     */
    public static findWinners(hands: HandEvaluation[]): number[] {
        if (hands.length === 0) {
            return [];
        }

        if (hands.length === 1) {
            return [0];
        }

        let bestHandIndices = [0];
        let bestHand = hands[0];

        for (let i = 1; i < hands.length; i++) {
            const comparison = this.compareHands(hands[i], bestHand);

            if (comparison > 0) {
                // New best hand
                bestHandIndices = [i];
                bestHand = hands[i];
            } else if (comparison === 0) {
                // Tie with current best
                bestHandIndices.push(i);
            }
        }

        return bestHandIndices;
    }

    /**
     * Utility method to create a hand evaluation from 7 cards for easy comparison
     */
    public static evaluateSevenCardHand(cards: Card[]): HandEvaluation {
        return this.findBestHand(cards);
    }

    /**
     * Get hand type name
     */
    public static getHandTypeName(handType: HandType): string {
        const names = {
            [HandType.HIGH_CARD]: "High Card",
            [HandType.PAIR]: "Pair",
            [HandType.TWO_PAIR]: "Two Pair",
            [HandType.THREE_OF_A_KIND]: "Three of a Kind",
            [HandType.STRAIGHT]: "Straight",
            [HandType.FLUSH]: "Flush",
            [HandType.FULL_HOUSE]: "Full House",
            [HandType.FOUR_OF_A_KIND]: "Four of a Kind",
            [HandType.STRAIGHT_FLUSH]: "Straight Flush",
            [HandType.ROYAL_FLUSH]: "Royal Flush"
        };
        return names[handType];
    }

    /**
     * Format rank for display (converts 14 back to A, 13 to K, etc.)
     */
    public static formatRank(rank: number): string {
        switch (rank) {
            case 1:
            case 14:
                return "A";
            case 11:
                return "J";
            case 12:
                return "Q";
            case 13:
                return "K";
            default:
                return rank.toString();
        }
    }

    /**
     * Generate a complete deck of 52 cards
     */
    private static generateDeck(): Card[] {
        const deck: Card[] = [];
        for (let suit = 1; suit <= 4; suit++) {
            for (let rank = 1; rank <= 13; rank++) {
                deck.push({
                    suit: suit as SUIT,
                    rank: rank,
                    value: rank === 1 ? 1 : rank, // Ace low value for the Card type
                    mnemonic: `${this.formatRank(rank)}${this.getSuitChar(suit as SUIT)}`
                });
            }
        }
        return deck;
    }

    /**
     * Get suit character for mnemonic
     */
    private static getSuitChar(suit: SUIT): string {
        switch (suit) {
            case SUIT.HEARTS:
                return "H";
            case SUIT.DIAMONDS:
                return "D";
            case SUIT.CLUBS:
                return "C";
            case SUIT.SPADES:
                return "S";
            default:
                return "?";
        }
    }

    /**
     * Remove known cards from deck
     */
    private static getAvailableCards(knownCards: Card[]): Card[] {
        const deck = this.generateDeck();
        const knownCardStrings = knownCards.map(card => `${card.rank}-${card.suit}`);

        return deck.filter(card =>
            !knownCardStrings.includes(`${card.rank}-${card.suit}`)
        );
    }

    /**
     * Shuffle array in place using Fisher-Yates algorithm
     */
    private static shuffleArray<T>(array: T[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Calculate win percentages for two hands using Monte Carlo simulation
     * @param handA First player's hole cards (2 cards)
     * @param handB Second player's hole cards (2 cards)
     * @param communityCards Current community cards (0-5 cards)
     * @param simulations Number of simulations to run (default: 10000)
     * @returns Tuple of [handA win %, handB win %, tie %]
     */
    public static calculateWinPercentages(
        handA: Card[],
        handB: Card[],
        communityCards: Card[] = [],
        simulations: number = 10000
    ): [number, number, number] {
        // Validate inputs
        if (handA.length !== 2) {
            throw new Error("Hand A must have exactly 2 cards");
        }
        if (handB.length !== 2) {
            throw new Error("Hand B must have exactly 2 cards");
        }
        if (communityCards.length > 5) {
            throw new Error("Community cards cannot exceed 5 cards");
        }

        // Get all known cards
        const knownCards = [...handA, ...handB, ...communityCards];

        // Validate no duplicate cards
        const cardStrings = knownCards.map(card => `${card.rank}-${card.suit}`);
        if (new Set(cardStrings).size !== cardStrings.length) {
            throw new Error("Duplicate cards detected in input");
        }

        // Get available cards for simulation
        const availableCards = this.getAvailableCards(knownCards);
        const cardsNeeded = 5 - communityCards.length;

        let handAWins = 0;
        let handBWins = 0;
        let ties = 0;

        // Run Monte Carlo simulations
        for (let sim = 0; sim < simulations; sim++) {
            // Shuffle available cards
            const shuffledDeck = [...availableCards];
            this.shuffleArray(shuffledDeck);

            // Deal remaining community cards
            const fullCommunityCards = [...communityCards, ...shuffledDeck.slice(0, cardsNeeded)];

            // Evaluate both hands
            const handACards = [...handA, ...fullCommunityCards];
            const handBCards = [...handB, ...fullCommunityCards];

            const evaluationA = this.findBestHand(handACards);
            const evaluationB = this.findBestHand(handBCards);

            // Compare hands
            const result = this.compareHands(evaluationA, evaluationB);

            if (result > 0) {
                handAWins++;
            } else if (result < 0) {
                handBWins++;
            } else {
                ties++;
            }
        }

        // Convert to percentages
        const handAPercent = (handAWins / simulations) * 100;
        const handBPercent = (handBWins / simulations) * 100;
        const tiePercent = (ties / simulations) * 100;

        return [
            Math.round(handAPercent * 100) / 100, // Round to 2 decimal places
            Math.round(handBPercent * 100) / 100,
            Math.round(tiePercent * 100) / 100
        ];
    }
}
