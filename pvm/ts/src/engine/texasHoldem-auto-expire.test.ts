import { NonPlayerActionType, PlayerActionType, TexasHoldemRound, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_TOKEN, TWO_TOKENS, mnemonic, fromTestJson } from "./testConstants";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in a heads-up scenario.
describe.skip("Texas Holdem - Auto Expire", () => {
    describe("Should have player sitting out", () => {

        const SEAT_1 = "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C";
        const SEAT_2 = "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD";

        let game: TexasHoldemGame;

        beforeEach(() => {
            baseGameConfig.now = 0;
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.performAction(SEAT_1, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "1");
            game.performAction(SEAT_2, NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "2");

            // Post blinds
            game.performAction(SEAT_1, PlayerActionType.SMALL_BLIND, 3, ONE_TOKEN);
            game.performAction(SEAT_2, PlayerActionType.BIG_BLIND, 4, TWO_TOKENS);
        });

        it("should have correct legal actions after turn", () => {
            const actual = game.toJson();
            expect(actual).toBeDefined();
        });
    });
});
