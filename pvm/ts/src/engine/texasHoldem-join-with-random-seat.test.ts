import { PlayerStatus, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS } from "./testConstants";
import { Player } from "../models/player";

describe("Texas Holdem - Random Join", () => {
    describe("Player Management - Sit without a seat number", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        it("should let one player join with random seat", () => {
            jest.spyOn(game, "getActionIndex").mockReturnValue(1);

            // Create test players with sufficient chips
            const player1 = new Player("0x1111111111111111111111111111111111111111", undefined, ONE_HUNDRED_TOKENS, undefined, PlayerStatus.ACTIVE);

            game.performAction(player1.address, NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS); // Only one player
            
            expect(game.getPlayerCount()).toEqual(1);
            expect(game.exists(player1.address)).toBeTruthy();
        });

        // it("should not be able to join more than once", () => {
        //     expect(game.findNextEmptySeat()).toEqual(1);
        //     game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS, "1");
        //     expect(() => {
        //         game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 2, ONE_HUNDRED_TOKENS, "2");
        //     }).toThrow("Player already joined.");
        // });
    });
});
