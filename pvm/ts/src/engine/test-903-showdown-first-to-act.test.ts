import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS } from "./testConstants";

/**
 * Test file generated from poker scenario: TEST - Make sure that the First player to act AT SHOWDOWN shows his hand automatically. - 903 incorrect option to muck winning hand at showdown after opponent shows
 * Ticket: #unknown
 * Status: Pending
 * 
 * This test ensures that showdown behavior is correct - specifically that
 * the first player to act at showdown must show their hand and cannot muck.
 */
describe("TEST - Make sure that the First player to act AT SHOWDOWN shows his hand automatically. - 903 incorrect option to muck winning hand at showdown after opponent shows", () => {
    const PLAYER_1 = "0x1111111111111111111111111111111111111111";
    const PLAYER_2 = "0x2222222222222222222222222222222222222222";

    let game: TexasHoldemGame;

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        
        // Add players to the game
        game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "1");
        game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "2");
    });

    it("should enforce correct showdown behavior - first to act must show", () => {
        // Execute the setup actions (up to showdown)
        game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
        game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);
        game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5);
        game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN);
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n);
        game.performAction(PLAYER_1, PlayerActionType.CHECK, 8, 0n);
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 9, 0n);
        game.performAction(PLAYER_1, PlayerActionType.CHECK, 10, 0n);
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 11, 0n);
        game.performAction(PLAYER_1, PlayerActionType.CHECK, 12, 0n);
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 13, 0n);

        // Test showdown behavior
        expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);
        
        // The first player to act should only have SHOW as a legal action
        // This is the core test - first to act cannot muck, must show
        const firstPlayerActions = game.getLegalActions(PLAYER_1);
        expect(firstPlayerActions).toBeDefined();
        expect(firstPlayerActions.length).toEqual(1);
        expect(firstPlayerActions[0].action).toEqual(PlayerActionType.SHOW);
        
        // Now perform the SHOW action to complete the test
        game.performAction(PLAYER_1, PlayerActionType.SHOW, 14, 0n);
        
        // Verify that the game state is consistent
        expect(game.getPlayerCount()).toEqual(2);
        expect(game.pot).toBeGreaterThan(0n);
    });
});

/**
 * Suggested filename: test-unknown-test___make_sure_that_the_first_player_to_act_at_s.test.ts
 * 
 * To use this test:
 * 1. Copy this entire content
 * 2. Create a new file in pvm/ts/src/engine/ with the suggested filename
 * 3. Run the test with: npm test test-unknown-test___make_sure_that_the_first_player_to_act_at_s
 */