import { NonPlayerActionType } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS } from "./testConstants";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in with 3 players.
describe("Texas Holdem - Ante - 3 Players", () => {
    describe("3 Players", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 0, ONE_HUNDRED_TOKENS);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS);
        });

        it("should have the correct players pre flop", () => {
            expect(game.getPlayerCount()).toEqual(2);

            game.performAction("0x3333333333333333333333333333333333333333", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS);
            expect(game.getPlayerCount()).toEqual(3);
            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeDefined();
            expect(game.getPlayer("0x3333333333333333333333333333333333333333")).toBeDefined();

            expect(game.findNextSeat()).toEqual(4);
        });
    });
});
