import { PokerSolver, HandType, Deck, SUIT } from "../src";
import type { Card } from "../src";

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

    describe("Win Percentage Calculation", () => {
        test("should calculate win percentages for pocket aces vs pocket kings", () => {
            // AA vs KK preflop - classic scenario
            const handA = createCards(["AS", "AH"]);
            const handB = createCards(["KS", "KH"]);

            const [aWin, bWin, tie] = PokerSolver.calculateWinPercentages(handA, handB, [], 1000);

            // AA should win ~80-85% of the time against KK
            expect(aWin).toBeGreaterThan(75);
            expect(aWin).toBeLessThan(90);
            expect(bWin).toBeGreaterThan(10);
            expect(bWin).toBeLessThan(25);
            expect(tie).toBeGreaterThanOrEqual(0);

            // Total should be approximately 100%
            expect(Math.abs((aWin + bWin + tie) - 100)).toBeLessThan(1);
        });

        test("should calculate win percentages with community cards", () => {
            // AA vs KK with ace on flop
            const handA = createCards(["AS", "AH"]);
            const handB = createCards(["KS", "KH"]);
            const community = createCards(["AC", "8D", "2S"]);

            const [aWin, bWin, tie] = PokerSolver.calculateWinPercentages(handA, handB, community, 1000);

            // AA should win almost 100% with set of aces
            expect(aWin).toBeGreaterThan(95);
            expect(bWin).toBeLessThan(5);
        });

        test("should handle flush draw vs pocket pair scenario", () => {
            // Flush draw vs pocket pair
            const handA = createCards(["TH", "9H"]); // Hearts flush draw
            const handB = createCards(["8S", "8C"]); // Pocket 8s
            const community = createCards(["2H", "5H", "KD"]); // Two hearts on board

            const [aWin, bWin, tie] = PokerSolver.calculateWinPercentages(handA, handB, community, 1000);

            // Should be relatively close, flush draw has decent equity
            expect(aWin).toBeGreaterThan(35);
            expect(aWin).toBeLessThan(70);
            expect(bWin).toBeGreaterThan(30);
            expect(bWin).toBeLessThan(65);
        });

        test("should throw error for invalid input", () => {
            const handA = createCards(["AS"]); // Only 1 card
            const handB = createCards(["KS", "KH"]);

            expect(() => {
                PokerSolver.calculateWinPercentages(handA, handB);
            }).toThrow("Hand A must have exactly 2 cards");
        });

        test("should throw error for duplicate cards", () => {
            const handA = createCards(["AS", "AH"]);
            const handB = createCards(["AS", "KH"]); // Duplicate AS

            expect(() => {
                PokerSolver.calculateWinPercentages(handA, handB);
            }).toThrow("Duplicate cards detected in input");
        });

        test("should handle board with 5 community cards", () => {
            // Complete board scenario
            const handA = createCards(["AS", "AH"]);
            const handB = createCards(["KS", "KH"]);
            const community = createCards(["AC", "AD", "2S", "3H", "4C"]); // Quads for A

            const [aWin, bWin, tie] = PokerSolver.calculateWinPercentages(handA, handB, community, 100);

            // Should be 100% win for AA (quads)
            expect(aWin).toBe(100);
            expect(bWin).toBe(0);
            expect(tie).toBe(0);
        });
    });

    describe("Multi-Player Equity Calculation", () => {
        test("should calculate equity for 3 players preflop", () => {
            // AA vs KK vs QQ preflop
            const hands = [createCards(["AS", "AH"]), createCards(["KS", "KH"]), createCards(["QS", "QH"])];

            const result = PokerSolver.calculateMultiPlayerEquity(hands, [], 1000);

            // AA should have highest equity (around 65-70%)
            // KK should have middle equity (around 17-20%)
            // QQ should have lowest equity (around 15-18%)
            expect(result.winPercentages[0]).toBeGreaterThan(60);
            expect(result.winPercentages[0]).toBeLessThan(75);
            expect(result.winPercentages[1]).toBeGreaterThan(15);
            expect(result.winPercentages[1]).toBeLessThan(25);
            expect(result.winPercentages[2]).toBeGreaterThan(10);
            expect(result.winPercentages[2]).toBeLessThan(20);

            // All percentages should sum to approximately 100
            const total = result.winPercentages.reduce((sum, pct) => sum + pct, 0);
            expect(Math.abs(total - 100)).toBeLessThan(2);
        });

        test("should calculate equity for 4 players preflop", () => {
            // AA vs KK vs QQ vs JJ
            const hands = [createCards(["AS", "AH"]), createCards(["KS", "KH"]), createCards(["QS", "QH"]), createCards(["JS", "JH"])];

            const result = PokerSolver.calculateMultiPlayerEquity(hands, [], 1000);

            // AA should have highest equity
            expect(result.winPercentages[0]).toBeGreaterThan(result.winPercentages[1]);
            expect(result.winPercentages[0]).toBeGreaterThan(result.winPercentages[2]);
            expect(result.winPercentages[0]).toBeGreaterThan(result.winPercentages[3]);

            // All percentages should sum to approximately 100
            const total = result.winPercentages.reduce((sum, pct) => sum + pct, 0);
            expect(Math.abs(total - 100)).toBeLessThan(2);
        });

        test("should calculate equity with community cards", () => {
            // 3 players with ace on flop
            const hands = [
                createCards(["AS", "AH"]), // Set of aces
                createCards(["KS", "KH"]), // Pocket kings
                createCards(["QS", "QH"]) // Pocket queens
            ];
            const community = createCards(["AC", "8D", "2S"]);

            const result = PokerSolver.calculateMultiPlayerEquity(hands, community, 1000);

            // AA should have very high equity with set
            expect(result.winPercentages[0]).toBeGreaterThan(90);
            expect(result.winPercentages[1]).toBeLessThan(8);
            expect(result.winPercentages[2]).toBeLessThan(8);
        });

        test("should handle multiple flush draws scenario", () => {
            // 3 players with flush draws
            const hands = [
                createCards(["TH", "9H"]), // Hearts flush draw
                createCards(["KD", "QD"]), // Diamonds flush draw
                createCards(["8S", "8C"]) // Pocket 8s
            ];
            const community = createCards(["2H", "5H", "6D"]); // Two hearts, one diamond

            const result = PokerSolver.calculateMultiPlayerEquity(hands, community, 1000);

            // All players should have reasonable equity
            expect(result.winPercentages[0]).toBeGreaterThan(20);
            expect(result.winPercentages[1]).toBeGreaterThan(20);
            expect(result.winPercentages[2]).toBeGreaterThan(20);

            // Total should be approximately 100%
            const total = result.winPercentages.reduce((sum, pct) => sum + pct, 0);
            expect(Math.abs(total - 100)).toBeLessThan(2);
        });

        test("should handle completed board scenario", () => {
            // Complete board with clear winner
            const hands = [
                createCards(["AS", "AH"]), // Quads
                createCards(["KS", "KH"]), // Full house
                createCards(["QS", "QH"]) // Full house
            ];
            const community = createCards(["AC", "AD", "KC", "KD", "2S"]);

            const result = PokerSolver.calculateMultiPlayerEquity(hands, community, 100);

            // AA has quads, should win 100%
            expect(result.winPercentages[0]).toBe(100);
            expect(result.winPercentages[1]).toBe(0);
            expect(result.winPercentages[2]).toBe(0);
            expect(result.tiePercentage).toBe(0);
        });

        test("should handle tie scenario", () => {
            // Two players with identical board-playing hands
            const hands = [
                createCards(["2S", "3S"]), // Low cards
                createCards(["4H", "5H"]) // Low cards
            ];
            const community = createCards(["AS", "AH", "KC", "KD", "QS"]); // Board plays (two pair A-K)

            const result = PokerSolver.calculateMultiPlayerEquity(hands, community, 100);

            // Should be 50/50 tie
            expect(result.winPercentages[0]).toBe(50);
            expect(result.winPercentages[1]).toBe(50);
            expect(result.tiePercentage).toBe(100);
        });

        test("should throw error for invalid number of hands", () => {
            const hands = [createCards(["AS", "AH"])]; // Only 1 hand

            expect(() => {
                PokerSolver.calculateMultiPlayerEquity(hands);
            }).toThrow("Need at least 2 hands to calculate equity");
        });

        test("should throw error for invalid hand size", () => {
            const hands = [createCards(["AS"]), createCards(["KS", "KH"])]; // First hand has only 1 card

            expect(() => {
                PokerSolver.calculateMultiPlayerEquity(hands);
            }).toThrow("Hand 0 must have exactly 2 cards");
        });

        test("should throw error for duplicate cards", () => {
            const hands = [createCards(["AS", "AH"]), createCards(["AS", "KH"])]; // Duplicate AS

            expect(() => {
                PokerSolver.calculateMultiPlayerEquity(hands);
            }).toThrow("Duplicate cards detected in input");
        });

        test("should throw error for too many community cards", () => {
            const hands = [createCards(["AS", "AH"]), createCards(["KS", "KH"])];
            const community = createCards(["2S", "3S", "4S", "5S", "6S", "7S"]); // 6 cards

            expect(() => {
                PokerSolver.calculateMultiPlayerEquity(hands, community);
            }).toThrow("Community cards cannot exceed 5 cards");
        });

        test("should handle maximum players", () => {
            // Test with 10 players (max table size in poker)
            const hands = [
                createCards(["AS", "AH"]),
                createCards(["KS", "KH"]),
                createCards(["QS", "QH"]),
                createCards(["JS", "JH"]),
                createCards(["TS", "TH"]),
                createCards(["9S", "9H"]),
                createCards(["8S", "8H"]),
                createCards(["7S", "7D"]),
                createCards(["6S", "6D"]),
                createCards(["5S", "5D"])
            ];

            const result = PokerSolver.calculateMultiPlayerEquity(hands, [], 500);

            // AA should have highest equity
            expect(result.winPercentages[0]).toBeGreaterThan(result.winPercentages[1]);

            // All percentages should sum to approximately 100
            const total = result.winPercentages.reduce((sum, pct) => sum + pct, 0);
            expect(Math.abs(total - 100)).toBeLessThan(3);

            // Each player should have some equity
            result.winPercentages.forEach(pct => {
                expect(pct).toBeGreaterThan(0);
            });
        });

        test("should throw error for more than 10 players", () => {
            const hands = Array(11)
                .fill(null)
                .map((_, i) => createCards([`${(i % 13) + 1}S`, `${(i % 13) + 1}H`]));

            expect(() => {
                PokerSolver.calculateMultiPlayerEquity(hands);
            }).toThrow("Maximum 10 hands supported");
        });

        test("should be consistent with 2-player calculateWinPercentages", () => {
            // Compare multi-player method with 2-player method
            const handA = createCards(["AS", "AH"]);
            const handB = createCards(["KS", "KH"]);
            const community = createCards(["2H", "5S", "8D"]);

            const [aWin, bWin] = PokerSolver.calculateWinPercentages(handA, handB, community, 1000);
            const multiResult = PokerSolver.calculateMultiPlayerEquity([handA, handB], community, 1000);

            // Results should be very similar (within 5% due to Monte Carlo variance)
            expect(Math.abs(multiResult.winPercentages[0] - aWin)).toBeLessThan(5);
            expect(Math.abs(multiResult.winPercentages[1] - bWin)).toBeLessThan(5);
        });
    });
});
