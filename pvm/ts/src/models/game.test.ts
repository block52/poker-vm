import { ethers } from "ethers";
import { PlayerState, TexasHoldemGameState } from "./game";
import { Card } from "./deck";
import { TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "../engine/texasHoldem";

describe.only("Game Tests", () => {
    // Remove texas holdem game state, now obsolete
    it.skip("should get texas holdem state as DTO", async () => {
        const address = ethers.ZeroAddress;
        const sb = 10;
        const bb = 30;
        const dealer = 0;
        const players: PlayerState[] = [];
        const communityCards: Card[] = [];
        const pot = 0;
        const currentBet = 0;
        const round = TexasHoldemRound.PREFLOP;
        const winners = undefined;

        const texasHoldemGameState = new TexasHoldemGameState(address, sb, bb, dealer, players, communityCards, pot, currentBet, round, winners);

        const dto = texasHoldemGameState.toJson();

        expect(dto).toEqual({
            type: "cash",
            address: ethers.ZeroAddress,
            smallBlind: "10000000000000000000",
            bigBlind: "30000000000000000000",
            dealer: 0,
            players: [],
            communityCards: [],
            pots: ["0"],
            nextToAct: 0,
            round: "preflop",
            winners: [],
            signature: ethers.ZeroHash
        });
    });

    it("should get texas holdem state from DTO", async () => {
        // const address = ethers.ZeroAddress;
        // const sb = 10;
        // const bb = 30;
        // const dealer = 0;
        // const players: PlayerState[] = [];
        // const communityCards: Card[] = [];
        // const pot = 0;
        // const currentBet = 0;
        // const round = TexasHoldemRound.PREFLOP;
        // const winners = undefined;

        const json = {
            type: "cash",
            address: ethers.ZeroAddress,
            smallBlind: "10000000000000000000",
            bigBlind: "30000000000000000000",
            dealer: 0,
            players: [],
            communityCards: [],
            pots: ["0"],
            nextToAct: 0,
            round: "preflop",
            winners: [],
            signature: ethers.ZeroHash
        };

        const texasHoldemGameState = TexasHoldemGameState.fromJson(json);

        expect(texasHoldemGameState).toBeDefined();
    });

    it("should recreate the texas holdem game from state", async () => {
        const json = {
            type: "cash",
            address: ethers.ZeroAddress,
            smallBlind: "10000000000000000000",
            bigBlind: "30000000000000000000",
            dealer: 0,
            players: [],
            communityCards: [],
            pots: ["0"],
            nextToAct: 0,
            round: "preflop",
            winners: [],
            signature: ethers.ZeroHash
        };

        const texasHoldemGameState = TexasHoldemGameState.fromJson(json);

        expect(texasHoldemGameState).toBeDefined();
    });

    it.only("should create a state object from the game", async () => {
        const address = ethers.ZeroAddress;
        const sb = 10;
        const bb = 30;
        const dealer = 0;
        const communityCards: Card[] = [];        
        const round = TexasHoldemRound.PREFLOP;
        
        const texasHoldemGame = new TexasHoldemGame(address, sb, bb, dealer, 0, round, communityCards, 0);
        const state: TexasHoldemGameState = texasHoldemGame.state;
        const json = state.toJson();

        expect(state).toBeDefined();
        
        expect(json).toEqual({
            type: "cash",
            address: ethers.ZeroAddress,
            smallBlind: "10000000000000000000",
            bigBlind: "30000000000000000000",
            dealer: 0,
            players: [],
            communityCards: [],
            pots: ["0"],
            nextToAct: 0,
            round: "preflop",
            winners: [],
            signature: ethers.ZeroHash
        });
    });
});
