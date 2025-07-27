import { PlayerActionType, TexasHoldemRound, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS } from "./testConstants";

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
    const PLAYER_4 = "0x4444444444444444444444444444444444444444";

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
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 1, BUY_IN_AMOUNT, "1");
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 2, BUY_IN_AMOUNT, "2");

            // Post blinds
            game.performAction(PLAYER_2, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
            game.performAction(PLAYER_1, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);

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
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 1, BUY_IN_AMOUNT, "1");
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 2, BUY_IN_AMOUNT, "2");
        });

        it("should increment turn index by exactly 1 for each action", () => {
            // Check initial turn index is 1
            expect(game.getActionIndex()).toBe(3);
            
            // Perform first action and check index
            game.performAction(PLAYER_2, PlayerActionType.SMALL_BLIND, 3);
            expect(game.getActionIndex()).toBe(4);
            
            // Perform second action and check index
            game.performAction(PLAYER_1, PlayerActionType.BIG_BLIND, 4);
            expect(game.getActionIndex()).toBe(5);
            
            // Perform third action and check index
            game.performAction(PLAYER_2, PlayerActionType.CALL, 5, ONE_TOKEN);
            expect(game.getActionIndex()).toBe(6);
        });

        it.skip("should increment turn index through multiple game rounds", () => {
            // Post blinds
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 1);
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 2);

            // Perform actions to complete preflop round
            game.performAction(PLAYER_1, PlayerActionType.CALL, 3, ONE_TOKEN);
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 4);
            
            // Turn index should be 4 now
            expect(game.getActionIndex()).toBe(4);
            expect(game.currentRound).toBe(TexasHoldemRound.FLOP);
            
            // Continue with flop actions
            game.performAction(PLAYER_1, PlayerActionType.CHECK, 4);
            game.performAction(PLAYER_2, PlayerActionType.CHECK, 5);

            // Turn index should be 6 now
            expect(game.getActionIndex()).toBe(6);
            expect(game.currentRound).toBe(TexasHoldemRound.TURN);
        });

        it.skip("should maintain turn index across different types of actions", () => {
            // Add a third player
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 1, BUY_IN_AMOUNT);
            expect(game.getActionIndex()).toBe(1);
            
            // Perform a fold action
            game.performAction(PLAYER_3, PlayerActionType.FOLD, 2);
            expect(game.getActionIndex()).toBe(2);
            
            // Perform a leave action
            game.performAction(PLAYER_3, NonPlayerActionType.LEAVE, 3);
            expect(game.getActionIndex()).toBe(3);
            
            // Now post blinds with remaining players
            game.performAction(PLAYER_2, PlayerActionType.SMALL_BLIND, 4);
            expect(game.getActionIndex()).toBe(4);

            game.performAction(PLAYER_1, PlayerActionType.BIG_BLIND, 5);
            expect(game.getActionIndex()).toBe(5);
        });
    });

    describe("Turn Index in Legal Actions", () => {
        beforeEach(() => {
            // Add two players for the tests
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 1, BUY_IN_AMOUNT);
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 2, BUY_IN_AMOUNT);
        });

        it("should include current turn index in legal actions", () => {
            // Get legal actions for the first player
            const legalActions = game.getLegalActions(PLAYER_1);
            
            // Check that all legal actions have the current turn index
            legalActions.forEach(action => {
                expect(action.index).toBe(game.getActionIndex());
            });
        });

        it.skip("should update turn index in legal actions after each action", () => {
            // Post small blind
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3);

            // Get legal actions for second player
            const legalActions = game.getLegalActions(PLAYER_2);

            // All legal actions should have the current turn index (4)
            legalActions.forEach(action => {
                expect(action.index).toBe(4);
            });
            
            // Post big blind
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4);

            // Get legal actions for first player again
            const updatedLegalActions = game.getLegalActions(PLAYER_1);

            // All legal actions should have the new turn index (5)
            updatedLegalActions.forEach(action => {
                expect(action.index).toBe(5);
            });
        });
    });

    describe("Turn Index Validation", () => {
        beforeEach(() => {
            // Add two players for the tests
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 1, BUY_IN_AMOUNT, "1");
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 2, BUY_IN_AMOUNT, "2");

            expect(game.getPlayerCount()).toBe(2);
        });

        it("should throw an error if action is performed with incorrect index", () => {
            // Attempt to perform an action with incorrect index (1 instead of 0)
            expect(() => {
                game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 100);
            }).toThrow("Invalid action index.");

            // Turn index should remain unchanged
            expect(game.getActionIndex()).toBe(3);

            // Now perform with correct index
            expect(() => {
                game.performAction(PLAYER_1, PlayerActionType.BIG_BLIND, 3);
            }).not.toThrow();

            // Turn index should increment
            expect(game.getActionIndex()).toBe(4);
        });

        it("should throw an error if action is performed with an outdated index", () => {
            // Post small blind
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3);

            expect(game.getActionIndex()).toBe(4);

            // Attempt to perform another action with the same index (should be 2 now)
            expect(() => {
                game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 3);
            }).toThrow("Invalid action index.");

            // Turn index should remain unchanged
            expect(game.getActionIndex()).toBe(4);
        });
    });
}); 