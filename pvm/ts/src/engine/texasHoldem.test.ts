import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../models/game";
import TexasHoldemGame from "./texasHoldem";

import { ethers } from "ethers";

describe.skip("Texas Holdem Game", () => {
    const seed = "unfold law prevent sail where ketchup oxygen now tip cream denial pool";
    const wallet = ethers.Wallet.fromPhrase(seed);

    const json = {
        address: ethers.ZeroAddress,
        minPlayers: 2,
        maxPlayers: 9,
        smallBlind: 10000000000000000000n,
        bigBlind: 30000000000000000000n,
        dealer: 9,
        nextToAct: 1,
        currentRound: "ante",
        communityCards: [],
        pot: 0n,
        players: []
    };

    const minBuyIn = 1000000000000000000000n;
    const maxBuyIn = 10000000000000000000000n;

    describe.only("Properties from constructor", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(json, minBuyIn, maxBuyIn);
        });

        it("should create instance of TexasHoldemGame from JSON", () => {
            expect(game).toBeDefined();

            // Game properties
            expect(game.bigBlind).toEqual(30000000000000000000n);
            expect(game.smallBlind).toEqual(10000000000000000000n);
            expect(game.dealerPosition).toEqual(9);
            expect(game.currentPlayerId).toEqual(ethers.ZeroAddress);

            // Player properties
            expect(game.getPlayerCount()).toEqual(0);
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            // Community properties
            // expect(game.communityCards).toHaveLength(0);
        });
    });

    describe("Ante game states", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(json, minBuyIn, maxBuyIn);
        });

        it("should find next seat", () => {
            expect(game.findNextSeat()).toEqual(1);
        });

        it("should not have player", () => {
            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeFalsy();
        });

        it("should not allow player to join with insufficient funds", () => {
            expect(() => game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", 100000000000000000n)).toThrow(
                "Player has insufficient chips to post small blind."
            );
        });

        it("should allow players to join", () => {
            game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", 1000000000000000000000n);
            expect(game.getPlayerCount()).toEqual(1);
            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeTruthy();
            expect(game.findNextSeat()).toEqual(2);
        });
    });

    describe("Heads up", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(json, minBuyIn, maxBuyIn);
            game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", 1000000000000000000000n);
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 1000000000000000000000n);
        });

        it("should have the correct properties pre flop", () => {
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);
            expect(game.getPlayerCount()).toEqual(2);

            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeTruthy();
            expect(game.exists("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeTruthy();
            expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
            expect(game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeDefined();
        });

        it("should have the correct properties pre flop", () => {
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);
            expect(game.getPlayerCount()).toEqual(2);

            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeTruthy();
            expect(game.exists("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeTruthy();

            // get player 1 state
            const player1 = game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            expect(player1).toBeDefined();

            // get player 2 state
            const player2 = game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(player2).toBeDefined();
        });
    });
});
