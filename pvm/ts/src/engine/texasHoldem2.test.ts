import { PlayerActionType, PlayerStatus, TexasHoldemRound, NonPlayerActionType } from "@block52/poker-vm-sdk";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, getNextTestTimestamp } from "./testConstants";

describe("Texas Holdem Game", () => {

    const FIFTY_TOKENS = 50000000000000000000n;

    describe("Player Turn Validation", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            // Add minimum required players
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
        });

        it("should allow correct player to act", () => {

            // SIT_OUT is now included in legal actions as a non-player action
            const sbLegalActions = game.getLegalActions("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(sbLegalActions).toBeDefined();
            expect(sbLegalActions.length).toBeGreaterThanOrEqual(2); // Small blind, Fold, and non-player actions (SIT_OUT)

            // Small blind position should act first
            expect(() => {
                game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            }).not.toThrow();

            // Now big blind should be next to act
            const nextPlayer = game.getNextPlayerToAct();
            expect(nextPlayer?.address).toEqual("0x980b8D8A16f5891F41871d878a479d81Da52334c");

            // SIT_OUT is now included in legal actions as a non-player action
            const bbLegalActions = game.getLegalActions("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            expect(bbLegalActions).toBeDefined();
            expect(bbLegalActions.length).toBeGreaterThanOrEqual(2); // Big blind, Fold, and non-player actions (SIT_OUT)

            // Big blind should be able to act now
            expect(() => {
                game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
            }).not.toThrow();
        });

        it("should maintain correct turn order through a betting round", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // After blinds are posted, small blind acts first in preflop
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            // // Attempting to act with big blind should throw error
            // expect(() => {
            //     game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK, 5, undefined, undefined, getNextTestTimestamp());
            // }).toThrow("Not player's turn.");

            // Small blind should be able to act
            expect(() => {
                game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 5, ONE_TOKEN, undefined, getNextTestTimestamp());
            }).not.toThrow();

            // Now big blind should be next
            expect(game.getNextPlayerToAct()?.address).toEqual("0x980b8D8A16f5891F41871d878a479d81Da52334c");
        });

    });

    describe("hasRoundEnded function tests", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            // Add minimum required players
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
        });

        it("should return false when no blinds have been posted", () => {
            // No actions taken, preflop round shouldn't end
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it("should return false after small blind but no big blind", () => {
            // Only small blind posted
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it("should return false after both blinds but no additional actions", () => {
            // Both blinds posted, but no player actions yet
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Round shouldn't end because first player (small blind) needs to act again
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it("should return false when small blind calls but big blind hasn't acted after", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Small blind calls the difference (brings total to BIG_BLIND amount)
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 5, ONE_TOKEN, undefined, getNextTestTimestamp());

            // Big blind still needs to act (check or raise)
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it("should return true when all players have acted and matched highest bet in preflop", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Deal cards to enter PREFLOP
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);

            // Small blind calls (total bet now matches big blind)
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());

            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);

            // Big blind checks (all players have acted and matched highest bet)
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK, 7, undefined, undefined, getNextTestTimestamp());

            // Round should end
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(true);
            expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
            expect(game.hasRoundEnded(TexasHoldemRound.FLOP)).toBe(false);
        });

        it("should return false when a player raises and others haven't responded", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());

            // Small blind raises instead of calling
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.BET, 5, 50000000000000000n, undefined, getNextTestTimestamp());

            // Big blind hasn't responded to the raise
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

    });

    describe("Game Flow", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            // Add minimum required players
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
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
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());

            const player1 = game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            const player2 = game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c");

            // ONE_HUNDRED_TOKENS = 100000000000000000000n
            // ONE_TOKEN = 100000000000000000n (small blind)
            // TWO_TOKENS = 200000000000000000n (big blind)
            expect(player1?.chips).toEqual(99900000000000000000n); // 100 - 1 token
            expect(player2?.chips).toEqual(99800000000000000000n); // 100 - 2 tokens
            expect(game.pot).toEqual(300000000000000000n); // 1 + 2 tokens
        });

        it("should have legal moves for players to post small blind", () => {
            const legalActions = game.getLegalActions("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            // During ANTE round: blind action + SIT_OUT. FOLD is NOT available during ANTE.
            expect(legalActions).toContainEqual(expect.objectContaining({
                action: PlayerActionType.SMALL_BLIND
            }));

            expect(legalActions).toContainEqual(expect.objectContaining({
                action: NonPlayerActionType.SIT_OUT
            }));

            // FOLD should NOT be available during ANTE round
            expect(legalActions).not.toContainEqual(expect.objectContaining({
                action: PlayerActionType.FOLD
            }));
        });

        it("should validate legal actions after blinds", () => {
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());

            // After blinds, still in ANTE round. Legal actions: DEAL + SIT_OUT. FOLD is NOT available during ANTE.
            const legalActions1 = game.getLegalActions("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            expect(legalActions1.length).toBe(2);
            expect(legalActions1).toContainEqual(expect.objectContaining({
                action: NonPlayerActionType.DEAL
            }));

            // FOLD should NOT be available during ANTE round
            expect(legalActions1).not.toContainEqual(expect.objectContaining({
                action: PlayerActionType.FOLD
            }));

            // Should include SIT_OUT as a non-player action
            expect(legalActions1).toContainEqual(expect.objectContaining({
                action: NonPlayerActionType.SIT_OUT
            }));
        });
    });

});