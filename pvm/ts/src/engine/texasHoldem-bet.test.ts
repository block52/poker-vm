import { PlayerActionType, TexasHoldemRound, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN } from "./testConstants";

describe("Texas Holdem Game - Bet after flop", () => {

    let game: TexasHoldemGame;

    const PLAYER_1_ADDRESS = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";
    const PLAYER_2_ADDRESS = "0x980b8D8A16f5891F41871d878a479d81Da52334c";

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        // Add minimum required players
        game.performAction(PLAYER_1_ADDRESS, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "1");
        game.performAction(PLAYER_2_ADDRESS, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "2");
        // Post blinds
        game.performAction(PLAYER_1_ADDRESS, PlayerActionType.SMALL_BLIND, 3);
        game.performAction(PLAYER_2_ADDRESS, PlayerActionType.BIG_BLIND, 4);

        game.performAction(PLAYER_1_ADDRESS, NonPlayerActionType.DEAL, 5);
        expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

        // Call the big blind
        game.performAction(PLAYER_1_ADDRESS, PlayerActionType.CALL, 6, ONE_TOKEN);

        // Check back to big blind
        game.performAction(PLAYER_2_ADDRESS, PlayerActionType.CHECK, 7, 0n);
    });

    it("should have correct bet values for sb", () => {
        // Should be on the flop
        expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
        expect(game.communityCards).toHaveLength(3);
        expect(game.getNextPlayerToAct()?.address).toEqual(PLAYER_1_ADDRESS);

        // After small blind calls, big blind acts next
        const legalActions = game.getLegalActions(PLAYER_1_ADDRESS);
        expect(legalActions).toBeDefined();
        expect(legalActions.length).toEqual(2);
        expect(legalActions[0].action).toEqual(PlayerActionType.FOLD);
        expect(legalActions[1].action).toEqual(PlayerActionType.BET);
    });
});