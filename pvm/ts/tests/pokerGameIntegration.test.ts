import { PokerGameIntegration, Deck, PokerSolver } from "@bitcoinbrisbane/block52";

// HandType enum values (not exported from SDK)
const HandType = {
    HIGH_CARD: 0,
    PAIR: 1,
    TWO_PAIR: 2,
    THREE_OF_A_KIND: 3,
    STRAIGHT: 4,
    FLUSH: 5,
    FULL_HOUSE: 6,
    FOUR_OF_A_KIND: 7,
    STRAIGHT_FLUSH: 8,
    ROYAL_FLUSH: 9
} as const;

describe("PokerGameIntegration", () => {
    describe("Showdown Evaluation", () => {
        test("should correctly evaluate multiple player showdown", () => {
            // Three players with clear different hand strengths (avoiding accidental straights)
            const playerHands = [
                ["AS", "AH", "7C", "8D", "9S", "JH", "KC"], // Player 0: Pair of Aces
                ["KS", "KH", "2C", "3D", "4S", "6H", "8C"], // Player 1: Pair of Kings
                ["QH", "QD", "2H", "2S", "5C", "7D", "9H"] // Player 2: Two Pair (Queens and 2s)
            ];

            const result = PokerGameIntegration.exampleShowdown(playerHands);

            // Player 2 should win with two pair
            expect(result.winners).toEqual([2]);
            expect(result.results[0].isWinner).toBe(false);
            expect(result.results[1].isWinner).toBe(false);
            expect(result.results[2].isWinner).toBe(true);

            // Check hand descriptions
            expect(result.results[0].handDescription).toBe("Pair of As");
            expect(result.results[1].handDescription).toBe("Pair of Ks");
            expect(result.results[2].handDescription).toBe("Two Pair, Qs and 2s");
        });

        test("should handle tie scenarios", () => {
            // Two players with identical hands
            const playerHands = [
                ["AS", "AH", "7C", "8D", "9S", "JH", "KC"], // Player 0: Pair of Aces
                ["AD", "AC", "7D", "8H", "9C", "JS", "KD"] // Player 1: Same pair of Aces, same kickers
            ];

            const result = PokerGameIntegration.exampleShowdown(playerHands);

            // Both players should tie
            expect(result.winners).toEqual([0, 1]);
            expect(result.results[0].isWinner).toBe(true);
            expect(result.results[1].isWinner).toBe(true);
        });
    });

    describe("Heads-Up Comparison", () => {
        test("should correctly compare two hands", () => {
            const hand1 = ["AS", "AH", "7C", "8D", "9S", "JH", "KC"]; // Pair of Aces
            const hand2 = ["KS", "KH", "2C", "3D", "4S", "6H", "8C"]; // Pair of Kings

            // Convert to Card objects
            const { Deck } = require("../src/models/deck");
            const cards1 = hand1.map(cardStr => Deck.fromString(cardStr));
            const cards2 = hand2.map(cardStr => Deck.fromString(cardStr));

            const result = PokerGameIntegration.compareHeadsUp(cards1, cards2);

            expect(result.winner).toBe("player1");
            expect(result.comparison).toBe(1);
            expect(result.hand1Evaluation.handType).toBe(HandType.PAIR);
            expect(result.hand2Evaluation.handType).toBe(HandType.PAIR);
        });

        test("should detect ties in heads-up", () => {
            const hand1 = ["AS", "AH", "7C", "8D", "9S", "JH", "KC"];
            const hand2 = ["AD", "AC", "7D", "8H", "9C", "JS", "KD"];

            const { Deck } = require("../src/models/deck");
            const cards1 = hand1.map(cardStr => Deck.fromString(cardStr));
            const cards2 = hand2.map(cardStr => Deck.fromString(cardStr));

            const result = PokerGameIntegration.compareHeadsUp(cards1, cards2);

            expect(result.winner).toBe("tie");
            expect(result.comparison).toBe(0);
        });
    });

    describe("Hand Description Formatting", () => {
        test("should format all hand types correctly", () => {
            const testCases = [
                {
                    cards: ["AS", "KS", "QS", "JS", "TS", "2C", "3D"], // Royal Flush
                    expectedDescription: "Royal Flush"
                },
                {
                    cards: ["9S", "8S", "7S", "6S", "5S", "2C", "3D"], // Straight Flush
                    expectedDescription: "Straight Flush, 9 high"
                },
                {
                    cards: ["AS", "AH", "AD", "AC", "2C", "3D", "4S"], // Four of a Kind
                    expectedDescription: "Four As"
                },
                {
                    cards: ["KS", "KH", "KD", "2C", "2D", "3S", "4H"], // Full House
                    expectedDescription: "Full House, Ks over 2s"
                },
                {
                    cards: ["AS", "KS", "QS", "JS", "9S", "2C", "3D"], // Flush
                    expectedDescription: "Flush, A high"
                },
                {
                    cards: ["AS", "KH", "QC", "JD", "TS", "2C", "3D"], // Straight
                    expectedDescription: "Straight, A high"
                },
                {
                    cards: ["AS", "AH", "AC", "KC", "7D", "8S", "9H"], // Three of a Kind (no straight possible)
                    expectedDescription: "Three As"
                },
                {
                    cards: ["AS", "AH", "KC", "KD", "2C", "3D", "4S"], // Two Pair
                    expectedDescription: "Two Pair, As and Ks"
                },
                {
                    cards: ["AS", "AH", "2C", "3D", "4S", "6H", "8C"], // Pair (no straight)
                    expectedDescription: "Pair of As"
                },
                {
                    cards: ["AS", "KH", "QC", "JD", "9S", "7C", "5D"], // High Card
                    expectedDescription: "A high"
                }
            ];

            testCases.forEach(({ cards, expectedDescription }) => {
                const cardObjects = cards.map(cardStr => Deck.fromString(cardStr));
                const evaluation = PokerSolver.findBestHand(cardObjects);
                const description = PokerGameIntegration.formatHandDescription(evaluation);

                expect(description).toBe(expectedDescription);
            });
        });
    });

    describe("Real Game Scenario - Issue #1159", () => {
        test("should correctly resolve the problematic scenario", () => {
            // Exact scenario from issue #1159
            const playerHands = [
                ["TD", "5C", "7D", "3C", "TC", "6D", "8H"], // Player 1: Pair of 10s
                ["5D", "5H", "7D", "3C", "TC", "6D", "8H"] // Player 2: Pair of 5s
            ];

            const result = PokerGameIntegration.exampleShowdown(playerHands);

            // Player 1 should win with pair of 10s
            expect(result.winners).toEqual([0]);
            expect(result.results[0].isWinner).toBe(true);
            expect(result.results[1].isWinner).toBe(false);

            // Verify hand descriptions
            expect(result.results[0].handDescription).toBe("Pair of 10s");
            expect(result.results[1].handDescription).toBe("Pair of 5s");

            console.log("Issue #1159 Resolution:");
            console.log("Player 1:", result.results[0].handDescription, "- Winner:", result.results[0].isWinner);
            console.log("Player 2:", result.results[1].handDescription, "- Winner:", result.results[1].isWinner);
        });
    });
});
