import { TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "../src/engine/texasHoldem";
import { fromTestJson } from "../src/engine/testConstants";
import { test_json, test_735, test_753 } from "./senarios/data";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in a heads-up scenario.
describe("Texas Holdem - Data driven", () => {
    describe("Turn tests", () => {

        const SEAT_1 = "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C";
        const SEAT_2 = "0x527a896c23D93A5f381C5d1bc14FF8Ee812Ad3dD";

        let game: TexasHoldemGame;

        beforeEach(() => {
            game = fromTestJson(test_json);
        });

        it.skip("should have correct legal actions after turn", () => {
            // Check the current round
            expect(game.currentRound).toEqual(TexasHoldemRound.TURN);

            // Get legal actions for the next player
            const actual = game.getLegalActions(SEAT_1);
            expect(actual).toBeDefined();
        });

        it.skip("should test bug 735", () => {
            game = fromTestJson(test_735)
            // Check the current round
            expect(game.currentRound).toEqual(TexasHoldemRound.END);

            // Get legal actions for the next player
            const actual = game.getLegalActions(SEAT_1);
            expect(actual).toBeDefined();
        });

        it("should test bug 753", () => {
            const SEAT_1 = "0xE8DE79b707BfB7d8217cF0a494370A9cC251602C";
            const SEAT_2 = "0xc264FEDe83B081C089530BA0b8770C98266d058a";

            game = fromTestJson(test_753)
            // Check who is next to act
            expect(game.currentPlayerId).toEqual(SEAT_2);
            expect(game.smallBlindPosition).toEqual(2);
            expect(game.bigBlindPosition).toEqual(1);

            const actual = game.getLegalActions(SEAT_2);
            expect(actual).toBeDefined();
        });
    });
});