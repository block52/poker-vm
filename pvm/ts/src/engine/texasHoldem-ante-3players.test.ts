import { NonPlayerActionType, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TEN_TOKENS, TWO_TOKENS } from "./testConstants";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in with 3 players.
describe("Texas Holdem - Ante - 3 Players", () => {
    describe("3 Players", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 0, ONE_HUNDRED_TOKENS);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS);
        });

        it("should have the correct players in ante", () => {
            expect(game.getPlayerCount()).toEqual(2);

            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS);
            expect(game.getPlayerCount()).toEqual(3);

            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeDefined();
            expect(game.getPlayer("0x3333333333333333333333333333333333333333")).toBeDefined();

            expect(game.findNextEmptySeat()).toEqual(4);
        });

        it("should have the correct legal options with 3 players after blinds", () => {
            expect(game.getPlayerCount()).toEqual(2);

            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS);
            expect(game.getPlayerCount()).toEqual(3);

            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeDefined();
            expect(game.getPlayer("0x3333333333333333333333333333333333333333")).toBeDefined();

            expect(game.findNextEmptySeat()).toEqual(4);

            // Perform blinds
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);

            // Get round
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Get legal actions for player 0
            const actions = game.getLegalActions("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            expect(actions).toBeDefined();
            expect(actions.length).toEqual(2);
            expect(actions[0].action).toEqual(NonPlayerActionType.DEAL);
            expect(actions[1].action).toEqual(PlayerActionType.FOLD);
        });
    });
});
