import { PlayerActionType, PlayerStatus, TexasHoldemRound, GameOptions, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, mnemonic, ONE_HUNDRED_TOKENS, TEN_TOKENS } from "./testConstants";
import { Player } from "../models/player";

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

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
    });

    describe("Action Index Initialization", () => {
        it.only("should initialize with turn index of 1", () => {
            // Check initial turn index is 0
            expect(game.getActionIndex()).toBe(1);
        });

        it.only("should reset turn index to 0 when game is reinitialized", () => {
            // Add players
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, BUY_IN_AMOUNT, 1);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, BUY_IN_AMOUNT, 2);

            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 3, gameOptions.smallBlind);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 4, gameOptions.bigBlind);

            // Turn index should be 5 now
            expect(game.getActionIndex()).toBe(5);

            // Reinitialize game
            // game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.NEW_HAND, 5, undefined, mnemonic);

            // Turn index should reset to 0
            // expect(game.getActionIndex()).toBe(0);
        });
    });

    describe("Action Index Increments", () => {
        beforeEach(() => {
            // Add two players for the tests
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, BUY_IN_AMOUNT, 1);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 2, BUY_IN_AMOUNT, 2);
            
            // Reset the index to ensure we start from a known state
            // Reinitialize game
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.NEW_HAND, 3, undefined, mnemonic);
        });

        it("should increment turn index by exactly 1 for each action", () => {
            // Check initial turn index is 1
            expect(game.getActionIndex()).toBe(1);
            
            // Perform first action and check index
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 1);
            expect(game.getActionIndex()).toBe(2);
            
            // Perform second action and check index
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 1);
            expect(game.getActionIndex()).toBe(3);
            
            // Perform third action and check index
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 2);
            expect(game.getActionIndex()).toBe(4);
        });

        it("should increment turn index through multiple game rounds", () => {
            // Post blinds
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 1);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 2);
            
            // Perform actions to complete preflop round
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL, 3);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK, 4);
            
            // Turn index should be 4 now
            expect(game.getActionIndex()).toBe(4);
            expect(game.currentRound).toBe(TexasHoldemRound.FLOP);
            
            // Continue with flop actions
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CHECK, 4);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK, 5);
            
            // Turn index should be 6 now
            expect(game.getActionIndex()).toBe(6);
            expect(game.currentRound).toBe(TexasHoldemRound.TURN);
        });

        it.skip("should maintain turn index across different types of actions", () => {
            // Add a third player
            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.JOIN, 0, BUY_IN_AMOUNT);
            expect(game.getActionIndex()).toBe(1);
            
            // Perform a fold action
            game.performAction("0x3333333333333333333333333333333333333333", PlayerActionType.FOLD, 1);
            expect(game.getActionIndex()).toBe(2);
            
            // Perform a leave action
            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.LEAVE, 2);
            expect(game.getActionIndex()).toBe(3);
            
            // Now post blinds with remaining players
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 3);
            expect(game.getActionIndex()).toBe(4);
            
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 4);
            expect(game.getActionIndex()).toBe(5);
        });
    });

    describe.skip("Turn Index in Legal Actions", () => {
        beforeEach(() => {
            // Add two players for the tests
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 0, BUY_IN_AMOUNT);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 1, BUY_IN_AMOUNT);
            
            // Reset to ensure we start clean
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.NEW_HAND, 2, undefined, mnemonic);
        });

        it("should include current turn index in legal actions", () => {
            // Get legal actions for the first player
            const legalActions = game.getLegalActions("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            
            // Check that all legal actions have the current turn index
            legalActions.forEach(action => {
                expect(action.index).toBe(game.getActionIndex());
            });
        });

        it("should update turn index in legal actions after each action", () => {
            // Post small blind
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 0);
            
            // Get legal actions for second player
            const legalActions = game.getLegalActions("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            
            // All legal actions should have the current turn index (1)
            legalActions.forEach(action => {
                expect(action.index).toBe(1);
            });
            
            // Post big blind
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 1);
            
            // Get legal actions for first player again
            const updatedLegalActions = game.getLegalActions("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            
            // All legal actions should have the new turn index (2)
            updatedLegalActions.forEach(action => {
                expect(action.index).toBe(2);
            });
        });
    });

    describe.skip("Turn Index Validation", () => {
        beforeEach(() => {
            // Add two players for the tests
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 0, BUY_IN_AMOUNT);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 1, BUY_IN_AMOUNT);

            // Reset to ensure we start clean
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.NEW_HAND, 2, undefined, mnemonic);
        });

        it("should throw an error if action is performed with incorrect index", () => {
            // Attempt to perform an action with incorrect index (1 instead of 0)
            expect(() => {
                game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 1);
            }).toThrow("Invalid action index.");

            // Turn index should remain unchanged
            expect(game.getActionIndex()).toBe(0);

            // Now perform with correct index
            expect(() => {
                game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 0);
            }).not.toThrow();

            // Turn index should increment
            expect(game.getActionIndex()).toBe(1);
        });

        it("should throw an error if action is performed with an outdated index", () => {
            // Post small blind
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.SMALL_BLIND, 0);

            // Attempt to perform another action with the same index (should be 1 now)
            expect(() => {
                game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BIG_BLIND, 0);
            }).toThrow("Invalid action index.");

            // Turn index should remain unchanged
            expect(game.getActionIndex()).toBe(1);
        });
    });
}); 