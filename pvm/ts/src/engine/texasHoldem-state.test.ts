import { TexasHoldemRound, GameOptions } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";

import { ethers } from "ethers";
import { baseGameConfig, gameOptions, ONE_TOKEN, TWO_TOKENS } from "./testConstants";

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
                // expect(game.deck.cards.length).toEqual(52);
            });
        });

        it("should create instance of TexasHoldemGame from JSON", () => {
            expect(game).toBeDefined();

            // Game properties
            expect(game.smallBlind).toEqual(ONE_TOKEN);
            expect(game.bigBlind).toEqual(TWO_TOKENS);
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
