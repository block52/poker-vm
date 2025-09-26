import { NonPlayerActionType, PlayerActionType } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "../src/engine/texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS } from "../src/engine/testConstants";

describe("SCenarios to prove the correct calculation for the minimum raise/Slidebar", () => {
    const PLAYER_1 = "0x1111111111111111111111111111111111111111";
    const PLAYER_2 = "0x2222222222222222222222222222222222222222";

    let game: TexasHoldemGame;

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        
        // Add players to the game
        game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1");
        game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2");
    });

    it("scenarios to prove the correct calculation for the minimum raise/slidebar", () => {
        // Execute the setup actions
        game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
        game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);
        game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 5);
        game.performAction(PLAYER_1, PlayerActionType.RAISE, 6, 300000000000000000nn);
        game.performAction(PLAYER_2, PlayerActionType.RAISE, 7, 400000000000000000nn);
        game.performAction(PLAYER_1, PlayerActionType.CALL, 8, TWO_TOKENS);
        game.performAction(PLAYER_1, PlayerActionType.CHECK, 9, 0n);
        game.performAction(PLAYER_2, PlayerActionType.BET, 10, 800000000000000000nn);
        game.performAction(PLAYER_1, PlayerActionType.RAISE, 11, 1600000000000000000nn);
        game.performAction(PLAYER_2, PlayerActionType.RAISE, 12, 1600000000000000000nn);
        game.performAction(PLAYER_1, PlayerActionType.RAISE, 13, 2000000000000000000nn);
        game.performAction(PLAYER_2, PlayerActionType.RAISE, 14, 2400000000000000000nn);
        game.performAction(PLAYER_1, PlayerActionType.CALL, 15, 1200000000000000000nn);

        // Verify the game executed correctly
        expect(game.currentRound).toBeDefined();
        expect(game.getPlayerCount()).toEqual(2);
        
        const nextToAct = game.getNextPlayerToAct();
        
        // TODO: Add assertions specific to this test case
        const legalActions = game.getLegalActions(nextToAct?.address);
        expect(legalActions).toBeDefined();
        expect(legalActions.length).toEqual(0); // TODO: CHECK
    });
});