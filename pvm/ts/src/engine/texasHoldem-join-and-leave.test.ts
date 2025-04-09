import { PlayerStatus, TexasHoldemRound, GameOptions } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS } from "./testConstants";
import { Player } from "../models/player";

describe("Texas Holdem - Join and Leave", () => {

    describe("Player Management", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        it("should start in PREFLOP round", () => {
            expect(game.currentRound).toBe(TexasHoldemRound.PREFLOP);
        });

        it("should not progress rounds without minimum players", () => {
            // Create test players with sufficient chips
            const player1 = new Player(
                "0x1111111111111111111111111111111111111111",
                undefined,
                ONE_HUNDRED_TOKENS,
                undefined,
                PlayerStatus.ACTIVE
            );

            game.join(player1); // Only one player
            expect(() => game.deal()).toThrow("Not enough active players");
        });

        it("should not be able to join more than once", () => {
            expect(game.findNextSeat()).toEqual(1);
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", ONE_HUNDRED_TOKENS);
            expect(() => {
                game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", ONE_HUNDRED_TOKENS);
            }).toThrow("Player already joined.");
        });

        it("should not allow duplicate players", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", ONE_HUNDRED_TOKENS);
            expect(() => game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", ONE_HUNDRED_TOKENS)).toThrow();
        });

        // Player must fold before leaving the table
        it("should not allow player to leave before folding", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", ONE_HUNDRED_TOKENS);
            expect(() => game.leave("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toThrow(
                "Player must fold before leaving the table"
            );
        });

        it.skip("should allow player to leave after folding", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", ONE_HUNDRED_TOKENS);
            game.leave("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(game.exists("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeFalsy();
            expect(game.getPlayerCount()).toEqual(0);
        });

        it("should track player positions correctly", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", ONE_HUNDRED_TOKENS);
            game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", ONE_HUNDRED_TOKENS);

            expect(game.getPlayerSeatNumber("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toEqual(1);
            expect(game.getPlayerSeatNumber("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toEqual(2);
        });
    });
});