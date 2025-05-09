import { PlayerStatus, TexasHoldemRound, GameOptions, PlayerActionType, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "../../pvm/ts/src/engine/texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS } from "../lucas_tests_files/testConstants";
import { Player } from "../../pvm/ts/src/models/player";

describe("Texas Holdem - Join and Leave", () => {

    describe("Player Management", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        it("should start in ANTE round", () => {
            expect(game.currentRound).toBe(TexasHoldemRound.ANTE);
        });

        it("should not progress rounds without minimum players", () => {
            jest.spyOn(game, "getTurnIndex").mockReturnValue(0);

            // Create test players with sufficient chips
            const player1 = new Player(
                "0x1111111111111111111111111111111111111111",
                undefined,
                ONE_HUNDRED_TOKENS,
                undefined,
                PlayerStatus.ACTIVE
            );

            game.performAction(player1.address, NonPlayerActionType.JOIN, 0, ONE_HUNDRED_TOKENS); // Only one player
            expect(() => game.deal()).toThrow("Not enough active players");
        });

        it("should not be able to join more than once", () => {
            expect(game.findNextEmptySeat()).toEqual(1);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 0, ONE_HUNDRED_TOKENS);
            expect(() => {
                game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS);
            }).toThrow("Player already joined.");
        });

        it("should not allow duplicate players", () => {
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 0, ONE_HUNDRED_TOKENS);
            expect(() => game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS)).toThrow();
        });

        // Player must fold before leaving the table
        it.skip("should not allow player to leave before folding", () => {
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 0, ONE_HUNDRED_TOKENS);
            expect(() => game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.LEAVE, 1)).toThrow(
                "Player must fold before leaving the table"
            );
        });

        it.skip("should allow player to leave after folding", () => {
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 0, ONE_HUNDRED_TOKENS);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.LEAVE, 1);
            expect(game.exists("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeFalsy();
            expect(game.getPlayerCount()).toEqual(0);
        });

        it("should track player positions correctly", () => {
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", NonPlayerActionType.JOIN, 0, ONE_HUNDRED_TOKENS);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", NonPlayerActionType.JOIN, 1, ONE_HUNDRED_TOKENS);

            expect(game.getPlayerSeatNumber("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toEqual(1);
            expect(game.getPlayerSeatNumber("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toEqual(2);
        });
    });
});