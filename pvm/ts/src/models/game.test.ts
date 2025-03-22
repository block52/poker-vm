import { ethers } from "ethers";
import TexasHoldemGame, { GameOptions } from "../engine/texasHoldem";

describe("Game Tests", () => {
    // These need to be fetched from the contract in the future
    const gameOptions: GameOptions = {
        minBuyIn: 100000000000000000n,
        maxBuyIn: 1000000000000000000n,
        minPlayers: 2,
        maxPlayers: 9,
        smallBlind: 10000000000000000n,
        bigBlind: 20000000000000000n,
    };

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
            dealer: 0,
            players: [],
            communityCards: [],
            pots: ["0"],
            nextToAct: 0,
            round: "preflop",
            winners: [],
            signature: ethers.ZeroHash
        };

        const texasHoldemGameState = TexasHoldemGame.fromJson(json, gameOptions);
        expect(texasHoldemGameState).toBeDefined();
    });

    it("should recreate the texas holdem game from state", async () => {
        const json = {
            type: "cash",
            address: ethers.ZeroAddress,
            dealer: 0,
            players: [],
            communityCards: [],
            pots: ["0"],
            nextToAct: 0,
            round: "preflop",
            winners: [],
            signature: ethers.ZeroHash
        };

        const texasHoldemGameState = TexasHoldemGame.fromJson(json, gameOptions);

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
