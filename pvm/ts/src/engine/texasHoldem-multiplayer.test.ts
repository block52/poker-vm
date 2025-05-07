import { NonPlayerActionType, PlayerActionType, TexasHoldemRound, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, mnemonic } from "./testConstants";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in a heads-up scenario.
describe("Texas Holdem - Multiplayer", () => {
    
    describe("Four way", () => {

        const PLAYER_1 = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
        const PLAYER_2 = "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac";
        const PLAYER_3 = "0x3333333333333333333333333333333333333333";
        const PLAYER_4 = "0x4444444444444444444444444444444444444444";

        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.performAction(PLAYER_1, NonPlayerActionType.JOIN, 0, ONE_HUNDRED_TOKENS);
            game.performAction(PLAYER_2, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS);
            game.performAction(PLAYER_3, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS);
            game.performAction(PLAYER_4, NonPlayerActionType.JOIN, 3, ONE_HUNDRED_TOKENS);
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
            game.performAction(PLAYER_1, PlayerActionType.SMALL_BLIND, 4, ONE_TOKEN);
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Get legal actions for the next player
            let actual = game.getLegalActions(PLAYER_2);

            expect(actual.length).toEqual(2);
            expect(actual[0].action).toEqual(PlayerActionType.BIG_BLIND);
            expect(actual[1].action).toEqual(PlayerActionType.FOLD);

            const nextToAct = game.getNextPlayerToAct();
            expect(nextToAct).toBeDefined();
            expect(nextToAct?.address).toEqual(PLAYER_2);

            // Perform the big blind action
            game.performAction(PLAYER_2, PlayerActionType.BIG_BLIND, 5, TWO_TOKENS);
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Now deal the cards
            expect(() => {
                game.performAction(PLAYER_3, NonPlayerActionType.DEAL, 6);
            }).toThrow("Only the dealer or small blind can initiate the deal.");

            game.performAction(PLAYER_1, NonPlayerActionType.DEAL, 6, ONE_TOKEN);

            // Should be players 3 turn
        });
    });
});
