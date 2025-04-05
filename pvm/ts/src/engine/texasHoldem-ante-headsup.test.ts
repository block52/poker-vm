import { TexasHoldemRound, GameOptions } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";

import { ethers } from "ethers";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in a heads-up scenario.
describe.only("Texas Holdem - Ante - Heads Up", () => {
    const baseGameConfig = {
        address: ethers.ZeroAddress,
        dealer: 0,
        nextToAct: 1,
        currentRound: "preflop",
        communityCards: [],
        pot: 0n,
        players: []
    };

    const gameOptions: GameOptions = {
        minBuyIn: 100000000000000000n,
        maxBuyIn: 1000000000000000000n,
        minPlayers: 2,
        maxPlayers: 9,
        smallBlind: 10000000000000000n,
        bigBlind: 20000000000000000n,
    };

    describe("Preflop game states", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        it("should find next seat", () => {
            expect(game.findNextSeat()).toEqual(1);
        });

        it("should not have player", () => {
            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeFalsy();
        });

        it("should not allow player to join with insufficient funds", () => {
            expect(() => game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", 10n)).toThrow(
                "Player does not have enough chips to join."
            );
        });

        it("should allow a player to join", () => {
            game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", 1000000000000000000n);
            expect(game.getPlayerCount()).toEqual(1);
            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeTruthy();
            expect(game.findNextSeat()).toEqual(2);
        });
    });

    describe("Heads up", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
            game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", 1000000000000000000n);
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 1000000000000000000n);
        });

        it("should have the correct players pre flop", () => {
            expect(game.getPlayerCount()).toEqual(2);

            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeTruthy();
            expect(game.exists("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeTruthy();
            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeDefined();
        });
    });
});
