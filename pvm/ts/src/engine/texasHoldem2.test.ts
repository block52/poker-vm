import { PlayerActionType, PlayerStatus, TexasHoldemRound, GameOptions, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions } from "./testConstants";

describe.skip("Texas Holdem Game", () => {

    const TEN_TOKENS = 10000000000000000000n;
    const TWENTY_TOKENS = 20000000000000000000n;
    const FIFTY_TOKENS = 50000000000000000000n;

    describe("Player Turn Validation", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            // Add minimum required players
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 0, TEN_TOKENS, "seat=1");
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 1, TEN_TOKENS, "seat=2");
        });

        it("should throw error when player acts out of turn", () => {
            // In a new game, the small blind position should act first
            const nextPlayer = game.getNextPlayerToAct();
            expect(nextPlayer?.address).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            // Attempt to act with the wrong player (big blind) should throw an error
            expect(() => {
                game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.SMALL_BLIND, 0, 0n);
            }).toThrow("Not player's turn.");
        });

        it("should allow correct player to act", () => {
            // Small blind position should act first
            expect(() => {
                game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 0);
            }).not.toThrow();

            // Now big blind should be next to act
            const nextPlayer = game.getNextPlayerToAct();
            expect(nextPlayer?.address).toEqual("0x980b8D8A16f5891F41871d878a479d81Da52334c");

            // Big blind should be able to act now
            expect(() => {
                game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 1);
            }).not.toThrow();
        });

        it("should maintain correct turn order through a betting round", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 0);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 1);

            // After blinds are posted, small blind acts first in preflop
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            // Attempting to act with big blind should throw error
            expect(() => {
                game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK, 2);
            }).toThrow("Not player's turn.");

            // Small blind should be able to act
            expect(() => {
                game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 2, 10000000000000000n);
            }).not.toThrow();

            // Now big blind should be next
            expect(game.getNextPlayerToAct()?.address).toEqual("0x980b8D8A16f5891F41871d878a479d81Da52334c");
        });

        it("should enforce turn order with multiple players", () => {
            // Add a third player
            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.JOIN, 1, TEN_TOKENS, "seat=3");

            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 2);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 3);

            // Player 3 should act next
            expect(game.getNextPlayerToAct()?.address).toEqual("0x3333333333333333333333333333333333333333");

            // Trying to act with small blind or big blind should fail
            expect(() => {
                game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CHECK, 3);
            }).toThrow("Not player's turn.");

            expect(() => {
                game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK, 4);
            }).toThrow("Not player's turn.");

            // Player 3 should be able to act
            expect(() => {
                game.performAction("0x3333333333333333333333333333333333333333", PlayerActionType.CALL, 5, 20000000000000000n);
            }).not.toThrow();

            // After player 3, small blind should be next
            expect(game.getNextPlayerToAct()?.address).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
        });

        it("should skip folded players when determining next turn", () => {
            // Add a third player
            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.JOIN, 1, TEN_TOKENS, "seat=3");

            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 0);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 1);

            // Player 3 folds
            game.performAction("0x3333333333333333333333333333333333333333", PlayerActionType.FOLD, 2);

            // Next should be small blind, not player 3 again
            expect(game.getNextPlayerToAct()?.address).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            // Small blind acts
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 3, 10000000000000000n);

            // Big blind should be next, not player 3
            expect(game.getNextPlayerToAct()?.address).toEqual("0x980b8D8A16f5891F41871d878a479d81Da52334c");
        });
    });

    describe("hasRoundEnded function tests", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            // Add minimum required players
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 0, TEN_TOKENS);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 1, TEN_TOKENS);
        });

        it("should return false when no blinds have been posted", () => {
            // No actions taken, preflop round shouldn't end
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it("should return false after small blind but no big blind", () => {
            // Only small blind posted
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 0);
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it("should return false after both blinds but no additional actions", () => {
            // Both blinds posted, but no player actions yet
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 0);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 1);

            // Round shouldn't end because first player (small blind) needs to act again
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it("should return false when small blind calls but big blind hasn't acted after", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 0);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 1);

            // Small blind calls the difference (brings total to BIG_BLIND amount)
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 1, 10000000000000000n);

            // Big blind still needs to act (check or raise)
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it.only("should return true when all players have acted and matched highest bet in preflop", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 0);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 1);

            // Small blind calls (total bet now matches big blind)
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 2, 10000000000000000n);

            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);

            // Big blind checks (all players have acted and matched highest bet)
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK, 3);

            // Round should end
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(true);
            expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
            expect(game.hasRoundEnded(TexasHoldemRound.FLOP)).toBe(false);
        });

        it("should return false when a player raises and others haven't responded", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 0);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 1);

            // Small blind raises instead of calling
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.BET, 2, 50000000000000000n);

            // Big blind hasn't responded to the raise
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it.skip("should return true when all players fold except one", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 0);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 1);

            // Small blind folds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.FOLD, 2);

            // Only one player left active - round should end
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(true);
        });

        it.skip("should handle three player scenarios correctly", () => {
            // Add a third player
            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.JOIN, 0, TEN_TOKENS);

            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 1);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 2);

            // Third player calls
            game.performAction("0x3333333333333333333333333333333333333333", PlayerActionType.CALL, 3, 20000000000000000n);

            // Small blind folds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.FOLD, 4);

            // Big blind raises
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BET, 5, 20000000000000000n);

            // Round shouldn't end yet - player 3 needs to respond to raise
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);

            // Player 3 calls the raise
            game.performAction("0x3333333333333333333333333333333333333333", PlayerActionType.CALL, 6, 20000000000000000n);

            // Now round should end - all active players have acted and matched highest bet
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(true);
        });

        it.skip("should track actions from previous rounds separately", () => {
            // Post blinds and complete preflop round
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 0);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 1);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 2, 10000000000000000n);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK, 3);

            // Force round to FLOP (normally would happen automatically)
            // This is a workaround since we can't easily access the private setNextRound method
            const gameAsAny = game as any;
            gameAsAny._currentRound = TexasHoldemRound.FLOP;

            // At start of new round, no actions taken yet
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);

            // Both players check in flop
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CHECK, 4);

            // One player checked but other hasn't - round shouldn't end
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);

            // Other player checks
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK, 5);

            // Now round should end - all players checked
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(true);
        });
    });

    describe("Game Flow", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            // Add minimum required players
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 0, TEN_TOKENS);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 1, TEN_TOKENS);
        });

        it("should have correct table properties", () => {
            expect(game.getPlayerCount()).toEqual(2);
        });

        it("should have player status set to active", () => {
            const player1 = game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            const player2 = game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c");

            expect(player1?.status).toEqual(PlayerStatus.ACTIVE);
            expect(player2?.status).toEqual(PlayerStatus.ACTIVE);
        });

        it("should have deducted blinds from players", () => {
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 2);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 3);

            const player1 = game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            const player2 = game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c");

            expect(player1?.chips).toEqual(9990000000000000000n);
            expect(player2?.chips).toEqual(9980000000000000000n);
            expect(game.pot).toEqual(30000000000000000n);
        });

        it.skip("should automatically progress from ante to preflop when minimum players performAction(", () => {
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
            expect(game.getPlayerCount()).toEqual(2);
        });

        it("should have legal moves for players to post small blind", () => {
            const legalActions = game.getLegalActions("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            expect(legalActions).toContainEqual(expect.objectContaining({
                action: PlayerActionType.SMALL_BLIND
            }));

            expect(legalActions).toContainEqual(expect.objectContaining({
                action: PlayerActionType.FOLD
            }));
        });

        it.skip("should have legal moves for players to post big blind", () => {
            const legalActions = game.getLegalActions("0x980b8D8A16f5891F41871d878a479d81Da52334c");

            expect(legalActions).toContainEqual(expect.objectContaining({
                action: PlayerActionType.BIG_BLIND
            }));

            expect(legalActions).toContainEqual(expect.objectContaining({
                action: PlayerActionType.FOLD
            }));
        });

        it("should validate legal actions after blinds", () => {
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 0);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 1);

            const legalActions1 = game.getLegalActions("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            expect(legalActions1.length).toEqual(4);
            expect(legalActions1).toContainEqual(expect.objectContaining({
                action: NonPlayerActionType.DEAL
            }));

            expect(legalActions1).toContainEqual(expect.objectContaining({
                action: PlayerActionType.FOLD
            }));

            expect(legalActions1).toContainEqual(expect.objectContaining({
                action: PlayerActionType.CALL,
                min: "10000000000000000",
                max: "10000000000000000"
            }));

            // Get legal actions for big blind
            let legalActions2 = game.getLegalActions("0x980b8D8A16f5891F41871d878a479d81Da52334c");

            // expect(legalActions2).toContainEqual(expect.objectContaining({
            //     action: PlayerActionType.FOLD
            // }));

            // expect(legalActions2).toContainEqual(expect.objectContaining({
            //     action: PlayerActionType.CHECK
            // }));

            // expect(legalActions2).toContainEqual(expect.objectContaining({
            //     action: PlayerActionType.RAISE
            // }));

            // Now call from the small blind
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 2, 10000000000000000n);

            // Now big blind should have different legal actions
            // Check, raise, fold
            legalActions2 = game.getLegalActions("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            expect(legalActions2).toContainEqual(expect.objectContaining({
                action: PlayerActionType.FOLD
            }));

            // expect(legalActions2).toContainEqual(expect.objectContaining({
            //     action: PlayerActionType.CHECK
            // }));

            // expect(legalActions2).toContainEqual(expect.objectContaining({
            //     action: PlayerActionType.RAISE
            // }));
        });
    });

    describe.skip("Complete Game Round", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 0, TEN_TOKENS);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 1, TEN_TOKENS);
        });

        it("should complete a full round of play", () => {
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // Big blind should be the last player
            expect(game.currentPlayerId).toEqual("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            const player = game.getNextPlayerToAct();
            expect(player).toBeDefined();
            expect(player?.address).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            // Pre-flop
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 2, 10000000000000000n);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK, 3);

            // Flop
            expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CHECK, 4);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK, 5);

            // Turn
            expect(game.currentRound).toEqual(TexasHoldemRound.TURN);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.BET, 5, FIFTY_TOKENS);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CALL, 6);

            // River
            expect(game.currentRound).toEqual(TexasHoldemRound.RIVER);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CHECK, 7);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.FOLD, 8);

            // Verify game state after completion
            expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);
            expect(game.pot).toBeGreaterThan(0n);
        });
    });
});