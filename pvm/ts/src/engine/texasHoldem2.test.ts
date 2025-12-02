import { PlayerActionType, PlayerStatus, TexasHoldemRound, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS } from "./testConstants";

describe("Texas Holdem Game", () => {

    const FIFTY_TOKENS = 50000000000000000000n;

    describe("Player Turn Validation", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            // Add minimum required players
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1");
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2");
        });

        it("should allow correct player to act", () => {

            // SIT_OUT is now a non-player action (always available), not included in legal actions
            const sbLegalActions = game.getLegalActions("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(sbLegalActions).toBeDefined();
            expect(sbLegalActions.length).toEqual(2); // Small blind, Fold

            // Small blind position should act first
            expect(() => {
                game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 1, ONE_TOKEN);
            }).not.toThrow();

            // Now big blind should be next to act
            const nextPlayer = game.getNextPlayerToAct();
            expect(nextPlayer?.address).toEqual("0x980b8D8A16f5891F41871d878a479d81Da52334c");

            // SIT_OUT is now a non-player action (always available), not included in legal actions
            const bbLegalActions = game.getLegalActions("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            expect(bbLegalActions).toBeDefined();
            expect(bbLegalActions.length).toEqual(2); // Big blind, Fold

            // Big blind should be able to act now
            expect(() => {
                game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 2, TWO_TOKENS);
            }).not.toThrow();
        });

        it("should maintain correct turn order through a betting round", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 1, ONE_TOKEN);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 2, TWO_TOKENS);

            // After blinds are posted, small blind acts first in preflop
            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct?.address).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            // // Attempting to act with big blind should throw error
            // expect(() => {
            //     game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK, 5);
            // }).toThrow("Not player's turn.");

            // Small blind should be able to act
            expect(() => {
                game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 6, ONE_TOKEN);
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
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1");
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2");
        });

        it("should return false when no blinds have been posted", () => {
            // No actions taken, preflop round shouldn't end
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it("should return false after small blind but no big blind", () => {
            // Only small blind posted
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 1, ONE_TOKEN);
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it("should return false after both blinds but no additional actions", () => {
            // Both blinds posted, but no player actions yet
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 1, ONE_TOKEN);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 2, TWO_TOKENS);

            // Round shouldn't end because first player (small blind) needs to act again
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it("should return false when small blind calls but big blind hasn't acted after", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 1, ONE_TOKEN);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 2, TWO_TOKENS);

            // Small blind calls the difference (brings total to BIG_BLIND amount)
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 3, ONE_TOKEN);

            // Big blind still needs to act (check or raise)
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);
        });

        it("should return true when all players have acted and matched highest bet in preflop", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 1, ONE_TOKEN);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 2, TWO_TOKENS);

            // Deal cards to enter PREFLOP
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.DEAL, 3);

            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);

            // Small blind calls (total bet now matches big blind)
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 4, ONE_TOKEN);

            expect(game.hasRoundEnded(TexasHoldemRound.PREFLOP)).toBe(false);

            // Big blind checks (all players have acted and matched highest bet)
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK, 5);

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

    });

    describe("Game Flow", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            // Add minimum required players
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 0, ONE_HUNDRED_TOKENS, "seat=1");
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=2");
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

            // ONE_HUNDRED_TOKENS = 100000000000000000000n
            // ONE_TOKEN = 100000000000000000n (small blind)
            // TWO_TOKENS = 200000000000000000n (big blind)
            expect(player1?.chips).toEqual(99900000000000000000n); // 100 - 1 token
            expect(player2?.chips).toEqual(99800000000000000000n); // 100 - 2 tokens
            expect(game.pot).toEqual(300000000000000000n); // 1 + 2 tokens
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

        it("should validate legal actions after blinds", () => {
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 0);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 1);

            // After blinds, before dealing, the legal actions should be DEAL, FOLD
            // SIT_OUT is now a non-player action (always available), not included in legal actions
            const legalActions1 = game.getLegalActions("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            expect(legalActions1.length).toEqual(2);
            expect(legalActions1).toContainEqual(expect.objectContaining({
                action: NonPlayerActionType.DEAL
            }));

            expect(legalActions1).toContainEqual(expect.objectContaining({
                action: PlayerActionType.FOLD
            }));
        });
    });

});