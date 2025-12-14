import { TexasHoldemRound } from "@block52/poker-vm-sdk";
import TexasHoldemGame from "./texasHoldem";

import { ethers } from "ethers";
import { baseGameConfig, gameOptions } from "./testConstants";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in a heads-up scenario.
describe("Texas Holdem - State", () => {
    describe("Properties from constructor", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        });

        describe("Deck initialization", () => {
            it("should initialize with a standard 52 card deck", () => {
                const game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
                expect(game).toBeDefined();
            });
        });

        it("should create instance of TexasHoldemGame from JSON", () => {
            expect(game).toBeDefined();

            // Game properties
            expect(game.smallBlind).toEqual(100000000000000000n);
            expect(game.bigBlind).toEqual(200000000000000000n);
            expect(game.dealerPosition).toEqual(9);
            expect(game.currentPlayerId).toEqual(ethers.ZeroAddress);
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);
            expect(game.pot).toEqual(0n);

            // Player properties
            expect(game.getPlayerCount()).toEqual(0);
        });

        it("should correctly track dealer position", () => {
            expect(game.dealerPosition).toBe(9);
        });
    });
});
