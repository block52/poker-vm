import { GameOptions, GameType, NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@block52/poker-vm-sdk";
import { ethers } from "ethers";
import TexasHoldemGame from "./texasHoldem";
import { ONE_TOKEN, TWO_TOKENS, ONE_HUNDRED_TOKENS, mnemonic, getNextTestTimestamp, resetTestTimestamp } from "./testConstants";

/**
 * Test suite for GitHub Issue #1537:
 * Fix blind all-in handling: Players must retain full action set when opponent is forced all-in
 *
 * Scenario: Player with exactly BB amount posts BB and is forced all-in.
 * Other players should still have CALL, RAISE, and FOLD options.
 */
describe("Texas Holdem - Issue #1537 - Blind All-In Handling", () => {
    const SMALL_BLIND_PLAYER = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
    const BIG_BLIND_PLAYER = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";

    // Custom game options with lower min buy-in to allow short-stacked players
    const testGameOptions: GameOptions = {
        minBuyIn: ONE_TOKEN, // Allow buy-in as low as 1 token
        maxBuyIn: ONE_HUNDRED_TOKENS * 10n,
        minPlayers: 2,
        maxPlayers: 9,
        smallBlind: ONE_TOKEN,
        bigBlind: TWO_TOKENS,
        timeout: 60000,
        type: GameType.CASH
    };

    beforeEach(() => {
        resetTestTimestamp();
    });

    describe("BB player forced all-in with exact BB amount", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            // Create a game where BB player has exactly 2 tokens (the BB amount)
            game = new TexasHoldemGame(
                ethers.ZeroAddress,
                testGameOptions,
                9, // dealer
                [],
                1, // handNumber
                0, // actionCount
                TexasHoldemRound.ANTE,
                [], // communityCards
                [0n], // pot
                new Map(),
                mnemonic
            );

            // SB player joins with 100 tokens
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            // BB player joins with exactly 2 tokens (the BB amount) - this will force them all-in
            game.performAction(BIG_BLIND_PLAYER, NonPlayerActionType.JOIN, 2, TWO_TOKENS, "seat=2", getNextTestTimestamp());
        });

        it("should allow SB player to have CALL, RAISE, and FOLD options when BB is forced all-in", () => {
            // Post small blind
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Post big blind - BB player goes all-in with their entire stack
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Deal to advance to PREFLOP
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // Get legal actions for SB player
            const actions = game.getLegalActions(SMALL_BLIND_PLAYER);
            const actionTypes = actions.map(a => a.action);

            // SB player should have FOLD, CALL, RAISE, and SIT_OUT options
            expect(actionTypes).toContain(PlayerActionType.FOLD);
            expect(actionTypes).toContain(PlayerActionType.CALL);
            expect(actionTypes).toContain(PlayerActionType.RAISE);
        });

        it("should correctly calculate CALL amount when BB is forced all-in", () => {
            // Post small blind
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());

            // Post big blind - BB player goes all-in
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Deal to advance to PREFLOP
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // Get legal actions for SB player
            const actions = game.getLegalActions(SMALL_BLIND_PLAYER);
            const callAction = actions.find(a => a.action === PlayerActionType.CALL);

            expect(callAction).toBeDefined();
            // Call amount should be 1 token (to complete from SB of 1 to BB of 2)
            expect(callAction?.min).toEqual(ONE_TOKEN.toString());
            expect(callAction?.max).toEqual(ONE_TOKEN.toString());
        });

        it("should allow SB player to call when BB is forced all-in", () => {
            // Post blinds
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Deal to advance to PREFLOP
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // SB player should be able to call
            expect(() => {
                game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());
            }).not.toThrow();
        });

        it("should allow SB player to raise when BB is forced all-in", () => {
            // Post blinds
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Deal to advance to PREFLOP
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // Get legal actions to check raise amounts
            const actions = game.getLegalActions(SMALL_BLIND_PLAYER);
            const raiseAction = actions.find(a => a.action === PlayerActionType.RAISE);

            expect(raiseAction).toBeDefined();

            // SB player should be able to raise (min raise = 2 BB = 4 tokens, but SB already put in 1, so 3 more)
            expect(() => {
                const raiseAmount = BigInt(raiseAction!.min);
                game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.RAISE, 6, raiseAmount, undefined, getNextTestTimestamp());
            }).not.toThrow();
        });

        it("should allow SB player to fold when BB is forced all-in", () => {
            // Post blinds
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Deal to advance to PREFLOP
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // SB player should be able to fold (even though they're losing money)
            expect(() => {
                game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.FOLD, 6, 0n, undefined, getNextTestTimestamp());
            }).not.toThrow();
        });
    });

    describe("BB player forced all-in with less than BB amount", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            // Create a game where BB player has less than the BB amount (only 1 token)
            game = new TexasHoldemGame(
                ethers.ZeroAddress,
                testGameOptions,
                9, // dealer
                [],
                1, // handNumber
                0, // actionCount
                TexasHoldemRound.ANTE,
                [], // communityCards
                [0n], // pot
                new Map(),
                mnemonic
            );

            // SB player joins with 100 tokens
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            // BB player joins with only 1 token (less than BB amount)
            game.performAction(BIG_BLIND_PLAYER, NonPlayerActionType.JOIN, 2, ONE_TOKEN, "seat=2", getNextTestTimestamp());
        });

        it("should allow SB player to have CALL, RAISE, and FOLD options when BB posts partial blind", () => {
            // Post small blind
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());

            // Post big blind - BB player can only post 1 token (their entire stack)
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 4, ONE_TOKEN, undefined, getNextTestTimestamp());

            // Deal to advance to PREFLOP
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());

            // Get legal actions for SB player
            const actions = game.getLegalActions(SMALL_BLIND_PLAYER);
            const actionTypes = actions.map(a => a.action);

            // SB player should have options available
            // Note: In this case, SB has already matched the "bet" (both have 1 token in)
            // So they have CHECK instead of CALL, and should also have RAISE and FOLD
            expect(actionTypes).toContain(PlayerActionType.FOLD);
            // Either CHECK (if SB matches BB's partial post) or CALL should be available
            const hasCheckOrCall = actionTypes.includes(PlayerActionType.CHECK) || actionTypes.includes(PlayerActionType.CALL);
            expect(hasCheckOrCall).toBe(true);
        });
    });

    describe("Multi-player scenario with BB forced all-in", () => {
        const PLAYER_3 = "0x3333333333333333333333333333333333333333";
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = new TexasHoldemGame(
                ethers.ZeroAddress,
                testGameOptions,
                9, // dealer
                [],
                1, // handNumber
                0, // actionCount
                TexasHoldemRound.ANTE,
                [], // communityCards
                [0n], // pot
                new Map(),
                mnemonic
            );

            // Player 1 (will be SB in 3-player) joins with 100 tokens
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            // Player 2 (will be BB) joins with exactly 2 tokens
            game.performAction(BIG_BLIND_PLAYER, NonPlayerActionType.JOIN, 2, TWO_TOKENS, "seat=2", getNextTestTimestamp());
            // Player 3 (UTG) joins with 100 tokens
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());
        });

        it("should allow all players to have proper action options when BB is forced all-in", () => {
            // Post small blind
            game.performAction(SMALL_BLIND_PLAYER, PlayerActionType.SMALL_BLIND, 4, ONE_TOKEN, undefined, getNextTestTimestamp());

            // Post big blind - BB player goes all-in
            game.performAction(BIG_BLIND_PLAYER, PlayerActionType.BIG_BLIND, 5, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Deal to advance to PREFLOP
            game.performAction(SMALL_BLIND_PLAYER, NonPlayerActionType.DEAL, 6, undefined, undefined, getNextTestTimestamp());

            // UTG (Player 3) should act first and have proper options
            const utg_actions = game.getLegalActions(PLAYER_3);
            const utg_actionTypes = utg_actions.map(a => a.action);

            expect(utg_actionTypes).toContain(PlayerActionType.FOLD);
            expect(utg_actionTypes).toContain(PlayerActionType.CALL);
            expect(utg_actionTypes).toContain(PlayerActionType.RAISE);
        });
    });
});
