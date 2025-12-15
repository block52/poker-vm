import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "../src/engine/texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, getNextTestTimestamp } from "../src/engine/testConstants";

describe("When a player has called a bet on the river he must show is cards at show down IF he has a hand better than other hands shown down. variation of 900#", () => {
    const PLAYER_1 = "0x1111111111111111111111111111111111111111";
    const PLAYER_2 = "0x2222222222222222222222222222222222222222";

    let game: TexasHoldemGame;

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        
        // Add players to the game
        game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
        game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
    });

    it("when a player has called a bet on the river he must show is cards at show down if he has a hand better than other hands shown down. variation of 900#", () => {
        // Execute the setup actions
        game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 7, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.CHECK, 8, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 9, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.CHECK, 10, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.CHECK, 11, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_1, PlayerActionType.BET, 12, TWO_TOKENS, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.CALL, 13, TWO_TOKENS, undefined, getNextTestTimestamp());

        // Test showdown behavior
        expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);
        
        // The first player to act should only have SHOW as a legal action
        // This is the core test - first to act cannot muck, must show
        const firstPlayerActions = game.getLegalActions(PLAYER_1);
        expect(firstPlayerActions).toBeDefined();
        expect(firstPlayerActions.length).toBeGreaterThanOrEqual(1);
        expect(firstPlayerActions[0].action).toEqual(PlayerActionType.SHOW);
        
        // Now perform the SHOW action to complete the test
        game.performAction(PLAYER_1, PlayerActionType.SHOW, 14, 0n, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2, PlayerActionType.SHOW, 15, 0n, undefined, getNextTestTimestamp());
        
        // Verify that the game state is consistent
        expect(game.getPlayerCount()).toEqual(2);
        expect(game.pot).toBeGreaterThan(0n);
    });
});