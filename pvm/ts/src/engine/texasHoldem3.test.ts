import { PlayerActionType, PlayerStatus, TexasHoldemRound, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { Player } from "../models/player";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, getNextTestTimestamp } from "./testConstants";

describe("Texas Holdem Game - Comprehensive Tests", () => {
    describe("Round Management", () => {
        let game: TexasHoldemGame;
        let player1: Player;
        let player2: Player;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);

            // Create test players with sufficient chips
            player1 = new Player(
                "0x1111111111111111111111111111111111111111",
                undefined,
                2000000000000000000000n, // 2000 tokens
                undefined,
                PlayerStatus.ACTIVE
            );

            player2 = new Player(
                "0x2222222222222222222222222222222222222222",
                undefined,
                2000000000000000000000n, // 2000 tokens
                undefined,
                PlayerStatus.ACTIVE
            );
        });

        describe("Round Progression", () => {
            beforeEach(() => {
                game.performAction(player1.address, NonPlayerActionType.JOIN, 1, 100000n, "seat=1", getNextTestTimestamp());
                game.performAction(player2.address, NonPlayerActionType.JOIN, 2, 100000n, "seat=2", getNextTestTimestamp());

                // Post blinds
                game.performAction(player1.address, PlayerActionType.SMALL_BLIND, 3, 1000n, undefined, getNextTestTimestamp());
                game.performAction(player2.address, PlayerActionType.SMALL_BLIND, 4, 500n, undefined, getNextTestTimestamp());

                game.deal();
            });

            it.skip("should follow correct round order", () => {
                expect(game.currentRound).toBe(TexasHoldemRound.PREFLOP);

                // Simulate betting actions to progress rounds
                game.performAction(player1.address, PlayerActionType.CALL, 4, undefined, undefined, getNextTestTimestamp());
                game.performAction(player2.address, PlayerActionType.CHECK, 5, undefined, undefined, getNextTestTimestamp());

                expect(game.currentRound).toBe(TexasHoldemRound.FLOP);

                // More betting actions
                game.performAction(player1.address, PlayerActionType.CHECK, 6, undefined, undefined, getNextTestTimestamp());
                game.performAction(player2.address, PlayerActionType.CHECK, 7, undefined, undefined, getNextTestTimestamp());

                expect(game.currentRound).toBe(TexasHoldemRound.TURN);
            });

            it.skip("should deal correct number of community cards per round", () => {
                const roundProgression = [
                    { round: TexasHoldemRound.PREFLOP, cards: 0 },
                    { round: TexasHoldemRound.FLOP, cards: 3 },
                    { round: TexasHoldemRound.TURN, cards: 4 },
                    { round: TexasHoldemRound.RIVER, cards: 5 },
                    { round: TexasHoldemRound.SHOWDOWN, cards: 5 }
                ];

                let index = 4;

                for (const stage of roundProgression) {
                    expect(game.currentRound).toBe(stage.round);
                    // expect(game._communityCards.length).toBe(stage.cards);

                    // Progress to next round
                    if (stage.round !== TexasHoldemRound.SHOWDOWN) {
                        game.performAction(player1.address, PlayerActionType.CHECK, index, undefined, undefined, getNextTestTimestamp());
                        game.performAction(player2.address, PlayerActionType.CHECK, index + 1, undefined, undefined, getNextTestTimestamp());

                        index += 2;
                    }
                }
            });
        });
    });
}); 