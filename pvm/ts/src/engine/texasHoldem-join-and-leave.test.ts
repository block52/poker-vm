import { PlayerActionType, PlayerStatus, TexasHoldemRound, GameOptions } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";
import { ethers } from "ethers";
import { gameOptions } from "./testConstants";

describe("Texas Holdem - Join and Leave", () => {

    const TEN_TOKENS = 10000000000000000000n;
    const FIFTY_TOKENS = 50000000000000000000n;

    const baseGameConfig = {
        address: ethers.ZeroAddress,
        dealer: 0,
        nextToAct: 1,
        currentRound: "preflop",
        communityCards: [],
        pot: 0n,
        players: []
    };

    describe("Player Management", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        it("should not be able to join more than once", () => {
            expect(game.findNextSeat()).toEqual(1);
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            expect(() => {
                game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            }).toThrow("Player already joined.");
        });

        it("should not allow duplicate players", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            expect(() => game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS)).toThrow();
        });

        // Player must fold before leaving the table
        it("should not allow player to leave before folding", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            expect(() => game.leave("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toThrow(
                "Player must fold before leaving the table"
            );
        });

        it.skip("should allow player to leave after folding", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            game.leave("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(game.exists("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeFalsy();
            expect(game.getPlayerCount()).toEqual(0);
        });

        it("should track player positions correctly", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", TEN_TOKENS);
            game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", TEN_TOKENS);

            expect(game.getPlayerSeatNumber("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toEqual(1);
            expect(game.getPlayerSeatNumber("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toEqual(2);
        });
    });
});