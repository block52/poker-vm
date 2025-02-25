import { ethers } from "ethers";
import { Card } from "./deck";
import { TexasHoldemRound } from "@bitcoinbrisbane/block52";
import TexasHoldemGame from "../engine/texasHoldem";

describe.skip("Game Tests", () => {
    // // Remove texas holdem game state, now obsolete
    // it("should get texas holdem state as DTO", async () => {
    //     const address = ethers.ZeroAddress;
    //     const sb: bigint = 10n;
    //     const bb: bigint = 30n;
    //     const sbPosition = 1;
    //     const bbPosition = 2;
    //     const dealer = 0;
    //     const players: PlayerState[] = [];
    //     const communityCards: Card[] = [];
    //     const pot: bigint = 0n;
    //     const currentBet: bigint = 0n;
    //     const round = TexasHoldemRound.PREFLOP;
    //     const winners = undefined;

    //     const texasHoldemGameState = new TexasHoldemGameState(
    //         address,
    //         sb,
    //         bb,
    //         sbPosition,
    //         bbPosition,
    //         dealer,
    //         players,
    //         communityCards,
    //         pot,
    //         currentBet,
    //         round,
    //         winners
    //     );
    //     const dto = texasHoldemGameState.toJson();

    //     expect(dto).toEqual({
    //         type: "cash",
    //         address: ethers.ZeroAddress,
    //         smallBlind: "10",
    //         smallBlindPosition: 1,
    //         bigBlind: "30",
    //         bigBlindPosition: 2,
    //         dealer: 0,
    //         players: [],
    //         communityCards: [],
    //         pots: ["0"],
    //         nextToAct: 0,
    //         round: "preflop",
    //         winners: [],
    //         signature: ethers.ZeroHash
    //     });
    // });

    it("should get texas holdem state from JSON", async () => {
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

        const texasHoldemGameState = TexasHoldemGame.fromJson(json);
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

        const texasHoldemGameState = TexasHoldemGame.fromJson(json);

        expect(texasHoldemGameState).toBeDefined();
    });

    // it("should create a state object from the game", async () => {
    //     const address = ethers.ZeroAddress;
    //     const dealer = 0;
    //     const communityCards: Card[] = [];
    //     const round = TexasHoldemRound.PREFLOP;

    //     const players: PlayerStateType[] = [];

    //     const texasHoldemGame = new TexasHoldemGame(
    //         address,
    //         10000000000000000000n,
    //         100000000000000000000n,
    //         2,
    //         9,
    //         100000000000000000n,
    //         200000000000000000n,
    //         0,
    //         1,
    //         round,
    //         communityCards,
    //         0n,
    //         players
    //     );
    //     const state: TexasHoldemGameState = texasHoldemGame.state;
    //     const json = state.toJson();

    //     expect(state).toBeDefined();

    //     expect(json).toEqual({
    //         type: "cash",
    //         address: "0x0000000000000000000000000000000000000000",
    //         smallBlind: "10000000000000000000",
    //         smallBlindPosition: 1,
    //         bigBlind: "30000000000000000000",
    //         bigBlindPosition: 2,
    //         dealer: 0,
    //         players: [
    //             {
    //                 address: "0x0000000000000000000000000000000000000000",
    //                 seat: 0,
    //                 stack: "0",
    //                 isSmallBlind: false,
    //                 isBigBlind: false,
    //                 isDealer: true,
    //                 holeCards: undefined,
    //                 lastAction: undefined,
    //                 actions: [],
    //                 status: "active",
    //                 timeout: 0,
    //                 signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
    //             },
    //             {
    //                 address: "0x0000000000000000000000000000000000000000",
    //                 seat: 1,
    //                 stack: "0",
    //                 isSmallBlind: true,
    //                 isBigBlind: false,
    //                 isDealer: false,
    //                 holeCards: undefined,
    //                 lastAction: undefined,
    //                 actions: [],
    //                 status: "active",
    //                 timeout: 0,
    //                 signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
    //             },
    //             {
    //                 address: "0x0000000000000000000000000000000000000000",
    //                 seat: 0,
    //                 stack: "0",
    //                 isSmallBlind: false,
    //                 isBigBlind: true,
    //                 isDealer: false,
    //                 holeCards: undefined,
    //                 lastAction: undefined,
    //                 actions: [],
    //                 status: "active",
    //                 timeout: 0,
    //                 signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
    //             },
    //             {
    //                 address: "0x0000000000000000000000000000000000000000",
    //                 seat: 0,
    //                 stack: "0",
    //                 isSmallBlind: false,
    //                 isBigBlind: false,
    //                 isDealer: false,
    //                 holeCards: undefined,
    //                 lastAction: undefined,
    //                 actions: [],
    //                 status: "active",
    //                 timeout: 0,
    //                 signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
    //             },
    //             {
    //                 address: "0x0000000000000000000000000000000000000000",
    //                 seat: 0,
    //                 stack: "0",
    //                 isSmallBlind: false,
    //                 isBigBlind: false,
    //                 isDealer: false,
    //                 holeCards: undefined,
    //                 lastAction: undefined,
    //                 actions: [],
    //                 status: "active",
    //                 timeout: 0,
    //                 signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
    //             },
    //             {
    //                 address: "0x0000000000000000000000000000000000000000",
    //                 seat: 0,
    //                 stack: "0",
    //                 isSmallBlind: false,
    //                 isBigBlind: false,
    //                 isDealer: false,
    //                 holeCards: undefined,
    //                 lastAction: undefined,
    //                 actions: [],
    //                 status: "active",
    //                 timeout: 0,
    //                 signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
    //             },
    //             {
    //                 address: "0x0000000000000000000000000000000000000000",
    //                 seat: 0,
    //                 stack: "0",
    //                 isSmallBlind: false,
    //                 isBigBlind: false,
    //                 isDealer: false,
    //                 holeCards: undefined,
    //                 lastAction: undefined,
    //                 actions: [],
    //                 status: "active",
    //                 timeout: 0,
    //                 signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
    //             },
    //             {
    //                 address: "0x0000000000000000000000000000000000000000",
    //                 seat: 0,
    //                 stack: "0",
    //                 isSmallBlind: false,
    //                 isBigBlind: false,
    //                 isDealer: false,
    //                 holeCards: undefined,
    //                 lastAction: undefined,
    //                 actions: [],
    //                 status: "active",
    //                 timeout: 0,
    //                 signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
    //             },
    //             {
    //                 address: "0x0000000000000000000000000000000000000000",
    //                 seat: 0,
    //                 stack: "0",
    //                 isSmallBlind: false,
    //                 isBigBlind: false,
    //                 isDealer: false,
    //                 holeCards: undefined,
    //                 lastAction: undefined,
    //                 actions: [],
    //                 status: "active",
    //                 timeout: 0,
    //                 signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
    //             }
    //         ],
    //         communityCards: [],
    //         pots: ["0"],
    //         nextToAct: 0,
    //         round: "preflop",
    //         winners: [],
    //         signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
    //     });
    // });
});
