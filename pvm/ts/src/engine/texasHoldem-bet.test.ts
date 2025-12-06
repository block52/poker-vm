import { PlayerActionType, TexasHoldemRound, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, getNextTestTimestamp } from "./testConstants";

describe("Texas Holdem Game - Bet after flop", () => {

    let game: TexasHoldemGame;

    const PLAYER_1_ADDRESS = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";
    const PLAYER_2_ADDRESS = "0x980b8D8A16f5891F41871d878a479d81Da52334c";

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        // Add minimum required players
        game.performAction(PLAYER_1_ADDRESS, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
        game.performAction(PLAYER_2_ADDRESS, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
        // Post blinds
        game.performAction(PLAYER_1_ADDRESS, PlayerActionType.SMALL_BLIND, 3, undefined, undefined, getNextTestTimestamp());
        game.performAction(PLAYER_2_ADDRESS, PlayerActionType.BIG_BLIND, 4, undefined, undefined, getNextTestTimestamp());

        game.performAction(PLAYER_1_ADDRESS, NonPlayerActionType.DEAL, 5, undefined, undefined, getNextTestTimestamp());
        expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

        // Call the big blind
        game.performAction(PLAYER_1_ADDRESS, PlayerActionType.CALL, 6, ONE_TOKEN, undefined, getNextTestTimestamp());

        // Check back to big blind
        game.performAction(PLAYER_2_ADDRESS, PlayerActionType.CHECK, 7, 0n, undefined, getNextTestTimestamp());
    });

    it("should have correct bet values for small blind", () => {
        // Should be on the flop
        expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
        expect(game.communityCards).toHaveLength(3);
        expect(game.getNextPlayerToAct()?.address).toEqual(PLAYER_1_ADDRESS);

        // After small blind calls, big blind acts next
        const legalActions = game.getLegalActions(PLAYER_1_ADDRESS);
        expect(legalActions).toBeDefined();
        expect(legalActions.length).toEqual(3);
        expect(legalActions[0].action).toEqual(PlayerActionType.FOLD);
        expect(legalActions[1].action).toEqual(PlayerActionType.CHECK);
        expect(legalActions[2].action).toEqual(PlayerActionType.BET);
    });
});