import { PokerSolver, Deck } from "@bitcoinbrisbane/block52";
import type { Card } from "@bitcoinbrisbane/block52";

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

describe("Custom PokerSolver", () => {
    // Helper function to create cards from mnemonic strings
    const createCards = (mnemonics: string[]): Card[] => {
        return mnemonics.map(mnemonic => Deck.fromString(mnemonic));
    };

    describe("Hand Evaluation", () => {
        test("should correctly identify a royal flush", () => {
            // Royal flush in hearts: TH JH QH KH AH + 2C 3D
            const cards = createCards(["TH", "JH", "QH", "KH", "AH", "2C", "3D"]);
            const evaluation = PokerSolver.findBestHand(cards);

            expect(evaluation.handType).toBe(HandType.ROYAL_FLUSH);
            expect(evaluation.description).toBe("Royal Flush");
        });

        test("should correctly identify a straight flush", () => {
            // Straight flush 5-9 hearts: 5H 6H 7H 8H 9H + 2C 3D
            const cards = createCards(["5H", "6H", "7H", "8H", "9H", "2C", "3D"]);
            const evaluation = PokerSolver.findBestHand(cards);

            expect(evaluation.handType).toBe(HandType.STRAIGHT_FLUSH);
            expect(evaluation.rankValues[0]).toBe(9); // High card of straight
        });

        test("should correctly identify four of a kind", () => {
            // Four aces: AS AH AD AC + 2C 3D 5H
            const cards = createCards(["AS", "AH", "AD", "AC", "2C", "3D", "5H"]);
            const evaluation = PokerSolver.findBestHand(cards);

            expect(evaluation.handType).toBe(HandType.FOUR_OF_A_KIND);
            expect(evaluation.rankValues[0]).toBe(14); // Aces
            expect(evaluation.rankValues[1]).toBe(5); // Kicker
        });

        test("should correctly identify a full house", () => {
            // Full house: KKK 222 + 5H
            const cards = createCards(["KS", "KH", "KD", "2C", "2D", "2H", "5H"]);
            const evaluation = PokerSolver.findBestHand(cards);

            expect(evaluation.handType).toBe(HandType.FULL_HOUSE);
            expect(evaluation.rankValues[0]).toBe(13); // Kings
            expect(evaluation.rankValues[1]).toBe(2); // Twos
        });

        test("should correctly identify a flush", () => {
            // Flush in spades: AS KS QS JS 9S + 2C 3D
            const cards = createCards(["AS", "KS", "QS", "JS", "9S", "2C", "3D"]);
            const evaluation = PokerSolver.findBestHand(cards);

            expect(evaluation.handType).toBe(HandType.FLUSH);
            expect(evaluation.rankValues).toEqual([14, 13, 12, 11, 9]); // High to low
        });

        test("should correctly identify a straight", () => {
            // Straight 9-K: 9H TC JD QS KH + 2C 3D
            const cards = createCards(["9H", "TC", "JD", "QS", "KH", "2C", "3D"]);
            const evaluation = PokerSolver.findBestHand(cards);

            expect(evaluation.handType).toBe(HandType.STRAIGHT);
            expect(evaluation.rankValues[0]).toBe(13); // King high
        });

        test("should correctly identify a low straight (wheel)", () => {
            // A-2-3-4-5 straight: AH 2C 3D 4S 5H + KC 7D
            const cards = createCards(["AH", "2C", "3D", "4S", "5H", "KC", "7D"]);
            const evaluation = PokerSolver.findBestHand(cards);

            expect(evaluation.handType).toBe(HandType.STRAIGHT);
            expect(evaluation.rankValues[0]).toBe(5); // 5 high for wheel
        });

        test("should correctly identify three of a kind", () => {
            // Three queens: QH QC QD + 9S 7H 2C 3D
            const cards = createCards(["QH", "QC", "QD", "9S", "7H", "2C", "3D"]);
            const evaluation = PokerSolver.findBestHand(cards);

            expect(evaluation.handType).toBe(HandType.THREE_OF_A_KIND);
            expect(evaluation.rankValues[0]).toBe(12); // Queens
            expect(evaluation.rankValues[1]).toBe(9); // First kicker
            expect(evaluation.rankValues[2]).toBe(7); // Second kicker
        });

        test("should correctly identify two pair", () => {
            // Two pair: AA 88 + KH 2C 3D
            const cards = createCards(["AS", "AH", "8C", "8D", "KH", "2C", "3D"]);
            const evaluation = PokerSolver.findBestHand(cards);

            expect(evaluation.handType).toBe(HandType.TWO_PAIR);
            expect(evaluation.rankValues[0]).toBe(14); // Aces
            expect(evaluation.rankValues[1]).toBe(8); // Eights
            expect(evaluation.rankValues[2]).toBe(13); // King kicker
        });

        test("should correctly identify a pair", () => {
            // Pair of jacks: JH JC + AS 9D 7H 2C 3D
            const cards = createCards(["JH", "JC", "AS", "9D", "7H", "2C", "3D"]);
            const evaluation = PokerSolver.findBestHand(cards);

            expect(evaluation.handType).toBe(HandType.PAIR);
            expect(evaluation.rankValues[0]).toBe(11); // Jacks
            expect(evaluation.rankValues[1]).toBe(14); // Ace kicker
            expect(evaluation.rankValues[2]).toBe(9); // 9 kicker
            expect(evaluation.rankValues[3]).toBe(7); // 7 kicker
        });

        test("should correctly identify high card", () => {
            // High card: AS KH QC JD 9S 7H 5C
            const cards = createCards(["AS", "KH", "QC", "JD", "9S", "7H", "5C"]);
            const evaluation = PokerSolver.findBestHand(cards);

            expect(evaluation.handType).toBe(HandType.HIGH_CARD);
            expect(evaluation.rankValues).toEqual([14, 13, 12, 11, 9]); // Best 5 cards
        });
    });

    describe("Hand Comparison", () => {
        test("should correctly compare different hand types", () => {
            const pair = createCards(["JH", "JC", "AS", "9D", "7H", "2C", "3D"]);
            const twoPair = createCards(["AS", "AH", "8C", "8D", "KH", "2C", "3D"]);

            const pairEval = PokerSolver.findBestHand(pair);
            const twoPairEval = PokerSolver.findBestHand(twoPair);

            expect(PokerSolver.compareHands(twoPairEval, pairEval)).toBe(1);
            expect(PokerSolver.compareHands(pairEval, twoPairEval)).toBe(-1);
        });

        test("should correctly compare same hand types with different ranks", () => {
            const lowPair = createCards(["5H", "5C", "AS", "9D", "7H", "2C", "3D"]);
            const highPair = createCards(["TH", "TC", "AS", "9D", "7H", "2C", "3D"]);

            const lowPairEval = PokerSolver.findBestHand(lowPair);
            const highPairEval = PokerSolver.findBestHand(highPair);

            expect(PokerSolver.compareHands(highPairEval, lowPairEval)).toBe(1);
            expect(PokerSolver.compareHands(lowPairEval, highPairEval)).toBe(-1);
        });

        test("should correctly identify ties", () => {
            const hand1 = createCards(["JH", "JC", "AS", "9D", "7H", "2C", "3D"]);
            const hand2 = createCards(["JS", "JD", "AH", "9C", "7S", "4C", "5D"]);

            const eval1 = PokerSolver.findBestHand(hand1);
            const eval2 = PokerSolver.findBestHand(hand2);

            expect(PokerSolver.compareHands(eval1, eval2)).toBe(0);
        });
    });

    describe("Winner Determination", () => {
        test("should find single winner", () => {
            const hand1 = createCards(["5H", "5C", "AS", "9D", "7H", "2C", "3D"]); // Pair of 5s
            const hand2 = createCards(["TH", "TC", "AS", "9D", "7H", "2C", "3D"]); // Pair of 10s

            const eval1 = PokerSolver.findBestHand(hand1);
            const eval2 = PokerSolver.findBestHand(hand2);

            const winners = PokerSolver.findWinners([eval1, eval2]);
            expect(winners).toEqual([1]); // Hand 2 (index 1) wins
        });

        test("should find multiple winners in case of tie", () => {
            const hand1 = createCards(["JH", "JC", "AS", "9D", "7H", "2C", "3D"]);
            const hand2 = createCards(["JS", "JD", "AH", "9C", "7S", "4C", "5D"]);

            const eval1 = PokerSolver.findBestHand(hand1);
            const eval2 = PokerSolver.findBestHand(hand2);

            const winners = PokerSolver.findWinners([eval1, eval2]);
            expect(winners).toEqual([0, 1]); // Both hands tie
        });
    });

    describe("Bug #1159 Fix - Pokersolver Inconsistency", () => {
        test("should correctly evaluate the problematic hands from issue #1159", () => {
            // Player 1: Pair of 10s
            // Hole cards: TH, TC
            // Community: 2H, 5S, 8D, JC, 4H
            const player1Cards = createCards(["TH", "TC", "2H", "5S", "8D", "JC", "4H"]);

            // Player 2: Pair of 5s
            // Hole cards: 5H, 5C
            // Community: 2H, 5S, 8D, JC, 4H (but 5S is used for pair)
            // Actually let's use different community to avoid card duplication
            const player2Cards = createCards(["5H", "5C", "2D", "3S", "8C", "JD", "4S"]);

            const player1Eval = PokerSolver.findBestHand(player1Cards);
            const player2Eval = PokerSolver.findBestHand(player2Cards);

            // Verify hand types
            expect(player1Eval.handType).toBe(HandType.PAIR);
            expect(player2Eval.handType).toBe(HandType.PAIR);

            // Verify pair ranks
            expect(player1Eval.rankValues[0]).toBe(10); // Pair of 10s
            expect(player2Eval.rankValues[0]).toBe(5); // Pair of 5s

            // Player 1 should win (pair of 10s > pair of 5s)
            const comparison = PokerSolver.compareHands(player1Eval, player2Eval);
            expect(comparison).toBe(1);

            // Verify winners function
            const winners = PokerSolver.findWinners([player1Eval, player2Eval]);
            expect(winners).toEqual([0]); // Player 1 (index 0) wins

            console.log("Player 1 (Pair of 10s):", player1Eval.description, player1Eval.rankValues);
            console.log("Player 2 (Pair of 5s):", player2Eval.description, player2Eval.rankValues);
            console.log("Winner: Player", winners[0] + 1);
        });
    });
});
