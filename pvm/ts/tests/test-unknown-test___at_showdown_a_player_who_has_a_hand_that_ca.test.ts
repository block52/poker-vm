import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "../src/engine/texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS } from "../src/engine/testConstants";

describe("TEST - At showdown a player who has a hand that can beat all other hands shown down prior MUST REVEAL his hole crads.", () => {
    const PLAYER_1 = "0x1111111111111111111111111111111111111111";
    const PLAYER_2 = "0x2222222222222222222222222222222222222222";

    let game: TexasHoldemGame;

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        
        // Add players to the game
        game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1");
        game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2");
    });

    it("test - at showdown a player who has a hand that can beat all other hands shown down prior must reveal his hole crads.", () => {
        // Execute the setup actions
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
        game.performAction(PLAYER_2, PlayerActionType.SHOW, 15, 0n);
        
        // Verify that the game state is consistent
        expect(game.getPlayerCount()).toEqual(2);
        expect(game.pot).toBeGreaterThan(0n);
    });
});