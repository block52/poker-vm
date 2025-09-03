import TexasHoldemGame from "./texasHoldem";
import { fromTestJson } from "./testConstants";
import { test_1006 } from "../../tests/scenarios/data";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in a heads-up scenario.
describe("Texas Holdem - Auto Expire", () => {
    describe("Should have player sitting out", () => {

        let game: TexasHoldemGame;

        beforeEach(() => {
            game = fromTestJson(test_1006);
        });

        it("should have players expired", () => {
            const actual = game.toJson();
            expect(actual).toBeDefined();
        });
    });
});
