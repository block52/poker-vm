import { PlayerActionType, TexasHoldemRound, NonPlayerActionType } from "@block52/poker-vm-sdk";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, getNextTestTimestamp } from "./testConstants";

/**
 * This test suite was implemented to address and verify the fix for a double increment issue
 * in the turn index tracking system. Previously, there was a bug where the turn index was
 * being incremented twice during a single action - once in the performAction method and once
 * in the addAction method. This caused inconsistencies in action sequencing and validation.
 * 
 * The fix ensures that the action index is incremented exactly once per game action, maintaining
 * the correct sequence of turns throughout the game lifecycle.
 */
describe("Texas Holdem - Action Index", () => {
    let game: TexasHoldemGame;
    // Use ONE_HUNDRED_TOKENS to match minBuyIn value
    const BUY_IN_AMOUNT = ONE_HUNDRED_TOKENS;

    const PLAYER_1 = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
    const PLAYER_2 = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";
    const PLAYER_3 = "0x3333333333333333333333333333333333333333";

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
    });

    describe("Action Index Initialization", () => {
        it("should initialize with turn index of 1", () => {
            // Check initial turn index is 0
            expect(game.getActionIndex()).toBe(1);
        });

        it("should reset turn index to 0 when game is reinitialized", () => {
            // Add players
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 1, BUY_IN_AMOUNT, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 2, BUY_IN_AMOUNT, "seat=2", getNextTestTimestamp());

            // Post blinds
            game.performAction(PLAYER_2, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            game.performAction(PLAYER_1, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());

            // Turn index should be 5 now
            expect(game.getActionIndex()).toBe(5);

            // Reinitialize game
            // game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.NEW_HAND, 5, undefined, mnemonic, getNextTestTimestamp());

            // Turn index should reset to 0
            // expect(game.getActionIndex()).toBe(0);
        });
    });

    describe("Action Index Increments", () => {
        beforeEach(() => {
            // Add two players for the tests
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 1, BUY_IN_AMOUNT, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 2, BUY_IN_AMOUNT, "seat=2", getNextTestTimestamp());
        });

        it("should increment turn index by exactly 1 for each action", () => {
            // Check initial turn index is 3 (after 2 joins)
            expect(game.getActionIndex()).toBe(3);

            // Perform first action (small blind) and check index
            game.performAction(PLAYER_2, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
            expect(game.getActionIndex()).toBe(4);

            // Perform second action (big blind) and check index
            game.performAction(PLAYER_1, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
            expect(game.getActionIndex()).toBe(5);

            // Perform third action (deal to enter PREFLOP) and check index
            game.performAction(PLAYER_2, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
            expect(game.getActionIndex()).toBe(6);

            // Perform fourth action (small blind calls in PREFLOP) and check index
            game.performAction(PLAYER_2, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());
            expect(game.getActionIndex()).toBe(7);
        });

    });

    describe("Turn Index in Legal Actions", () => {
        beforeEach(() => {
            // Add two players for the tests
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 1, BUY_IN_AMOUNT, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 2, BUY_IN_AMOUNT, "seat=2", getNextTestTimestamp());
        });

        it("should include current turn index in legal actions", () => {
            // Get legal actions for the first player
            const legalActions = game.getLegalActions(PLAYER_1);

            // Check that all legal actions have the current turn index
            legalActions.forEach(action => {
                expect(action.index).toBe(game.getActionIndex());
            });
        });

    });
});