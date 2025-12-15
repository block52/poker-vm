import { NonPlayerActionType, PlayerActionType, TexasHoldemRound } from "@block52/poker-vm-sdk";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, getNextTestTimestamp } from "./testConstants";

// This test suite is for the Texas Holdem game engine, specifically for a multiplayer scenario.
describe("Texas Holdem - Multiplayer", () => {

    describe("Four way", () => {

        const PLAYER_1 = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
        const PLAYER_2 = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";
        const PLAYER_3 = "0x3333333333333333333333333333333333333333";
        const PLAYER_4 = "0x4444444444444444444444444444444444444444";

        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "seat=1", getNextTestTimestamp());
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "seat=2", getNextTestTimestamp());
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS, "seat=3", getNextTestTimestamp());
            game.performAction(PLAYER_4, NonPlayerActionType.JOIN, 4, ONE_HUNDRED_TOKENS, "seat=4", getNextTestTimestamp());
        });

        it("should have the correct players pre flop", () => {
            expect(game.getPlayerCount()).toEqual(4);

            expect(game.exists(PLAYER_1)).toBeTruthy();
            expect(game.exists(PLAYER_2)).toBeTruthy();
            expect(game.exists(PLAYER_3)).toBeTruthy();
            expect(game.exists(PLAYER_4)).toBeTruthy();

            expect(game.exists(PLAYER_1)).toBeDefined();
            expect(game.exists(PLAYER_2)).toBeDefined();
            expect(game.exists(PLAYER_3)).toBeDefined();
            expect(game.exists(PLAYER_4)).toBeDefined();
        });

        it("should have correct legal actions after posting the blinds", () => {
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 5, ONE_TOKEN, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Get legal actions for the next player
            let actual = game.getLegalActions(PLAYER_2);

            // SIT_OUT is now a non-player action (always available), not included in legal actions
            expect(actual.length).toBeGreaterThanOrEqual(2);
            expect(actual[0].action).toEqual(PlayerActionType.BIG_BLIND);
            expect(actual[1].action).toEqual(PlayerActionType.FOLD);

            let nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(PLAYER_2);

            // Perform the big blind action
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 6, TWO_TOKENS, undefined, getNextTestTimestamp());
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Now deal the cards
            actual = game.getLegalActions(PLAYER_1);

            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 7, undefined, "seed", getNextTestTimestamp());
            actual = game.getLegalActions(PLAYER_1);

            // Should be players 3 turn
            nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(PLAYER_3);
            actual = game.getLegalActions(PLAYER_3);
            expect(actual.length).toBeGreaterThanOrEqual(3); // Fold, call or raise
            expect(actual[0].action).toEqual(PlayerActionType.FOLD);
            expect(actual[1].action).toEqual(PlayerActionType.CALL);
            expect(actual[2].action).toEqual(PlayerActionType.RAISE);

            // Open the action for player 3
            game.performAction(PLAYER_3, PlayerActionType.RAISE, 8, TWO_TOKENS, undefined, getNextTestTimestamp());
            expect(game.pot).toEqual(500000000000000000n);

            // Should be players 4 turn
            nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(PLAYER_4);
            actual = game.getLegalActions(PLAYER_4);
            expect(actual.length).toBeGreaterThanOrEqual(3); // Fold, call, raise
            expect(actual[0].action).toEqual(PlayerActionType.FOLD);
            expect(actual[1].action).toEqual(PlayerActionType.CALL);
            expect(actual[2].action).toEqual(PlayerActionType.RAISE);

            // Call from player 4
            game.performAction(PLAYER_4, PlayerActionType.CALL, 9, TWO_TOKENS, undefined, getNextTestTimestamp());
            expect(game.pot).toEqual(700000000000000000n);

            // Should be players 1 turn
            nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(PLAYER_1);

            actual = game.getLegalActions(PLAYER_1);
            expect(actual.length).toBeGreaterThanOrEqual(3); // Fold, call, raise
            expect(actual[0].action).toEqual(PlayerActionType.FOLD);
            expect(actual[1].action).toEqual(PlayerActionType.CALL);
            expect(actual[2].action).toEqual(PlayerActionType.RAISE);

            // Call from player 1
            game.performAction(PLAYER_1, PlayerActionType.CALL, 10, TWO_TOKENS, undefined, getNextTestTimestamp());
            expect(game.pot).toEqual(900000000000000000n);

            // Should be players 2 turn
            nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(PLAYER_2);
            actual = game.getLegalActions(PLAYER_2);
            expect(actual.length).toBeGreaterThanOrEqual(3); // Fold, check, raise (TODO REVIEW THIS)

            const json = game.toJson();
            expect(json).toBeDefined();
        });
    });
});