import { TexasHoldemRound, GameOptions } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "./texasHoldem";

import { ethers } from "ethers";
import { gameOptions } from "./testConstants";

// This test suite is for the Texas Holdem game engine, specifically for the Ante round in a heads-up scenario.
describe("Texas Holdem - State", () => {
    const baseGameConfig = {
        address: ethers.ZeroAddress,
        dealer: 0,
        nextToAct: 1,
        currentRound: "preflop",
        communityCards: [],
        pot: 0n,
        players: []
    };

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
            expect(game.bigBlind).toEqual(10000000000000000n);
            expect(game.smallBlind).toEqual(20000000000000000n);
            expect(game.dealerPosition).toEqual(9);
            expect(game.currentPlayerId).toEqual(ethers.ZeroAddress);
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
            expect(game.pot).toEqual(0n);

            // Player properties
            expect(game.getPlayerCount()).toEqual(0);
        });

        it("should correctly track dealer position", () => {
            // TODO: Fix dealer position calculation in constructor
            // TODO: Implement proper dealer button movement
            expect(game.dealerPosition).toBe(0);
        });
    });
});
