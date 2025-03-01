import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../models/game";
import TexasHoldemGame from "./texasHoldem";

import { ethers } from "ethers";

describe.skip("Texas Holdem Game", () => {
    const seed = "unfold law prevent sail where ketchup oxygen now tip cream denial pool";
    const wallet = ethers.Wallet.fromPhrase(seed);

    const json = {
        address: ethers.ZeroAddress,
        minBuyIn: 1000000000000000000000n,
        maxBuyIn: 3000000000000000000000n,
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

    describe.only("Properties from constructor", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(json);
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
            game = TexasHoldemGame.fromJson(json);
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
            game = TexasHoldemGame.fromJson(json);
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

    //     it("should allow a round to be played heads up", () => {
    //         const game = new TexasHoldemGame(ethers.ZeroAddress, "2,9,10000000000000000000,300000000000000000");
    //         game.join(new Player("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f", 250n));
    //         game.join(new Player("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 200n));

    //         // get player state
    //         const player1 = game.getPlayer("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f");
    //         expect(player1).toBeDefined();
    //         expect(player1?.id).toEqual("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f");

    //         const player2 = game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
    //         expect(player2).toBeDefined();
    //         expect(player2?.id).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

    //         const players = game.players;
    //         expect(players).toHaveLength(9); // 9 players, but with empty seats

    //         // game.deal();
    //         expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

    //         // get big blind and small blind
    //         expect(game.getBets().get("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f")).toEqual(10); // Small blind
    //         expect(game.getBets().get("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toEqual(25); // Big blind
    //         expect(game.pot).toEqual(35);
    //     });
    // });

    // it.skip("should process messages", function () {
    //     const game = new TexasHoldemGame(ethers.ZeroAddress, "2,9,10000000000000000000,300000000000000000");

    //     game.join(new Player("1", 100n));
    //     game.join(new Player("2", 200n));
    //     game.join(new Player("3", 300n));
    //     game.deal();

    //     // Pre-flop
    //     game.performAction("1", PlayerActionType.CALL);
    //     game.performAction("2", PlayerActionType.CALL);
    //     game.performAction("3", PlayerActionType.FOLD, 0n);

    //     // Flop
    //     game.performAction("2", PlayerActionType.CHECK, 0n);
    //     game.performAction("1", PlayerActionType.BET, 30n);
    //     game.performAction("2", PlayerActionType.CALL);

    //     // Turn
    //     game.performAction("2", PlayerActionType.CHECK, 0n);
    //     game.performAction("1", PlayerActionType.CHECK, 0n);

    //     // River
    //     game.performAction("2", PlayerActionType.CHECK);
    //     game.performAction("1", PlayerActionType.CHECK);
    // });

    // it.skip("should allow a round to be played", () => {
    //     const game = new TexasHoldemGame(ethers.ZeroAddress, "2,9,10000000000000000000,300000000000000000", 2);
    //     game.join(new Player("1", 250n));
    //     game.join(new Player("2", 200n));
    //     game.join(new Player("3", 100n));
    //     game.join(new Player("4", 100n));
    //     game.deal();

    //     expect(game.getBets().get("4")).toEqual(10); // Small blind
    //     expect(game.getBets().get("1")).toEqual(30); // Big blind
    //     expect(game.getBets().get("2")).toEqual(undefined);
    //     expect(game.getBets().get("3")).toEqual(undefined);

    //     // Pre-flop
    //     expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
    //     expect(game.currentPlayerId).toEqual("2");
    //     expect(game.getValidActions("1")).toEqual([]);
    //     expect(game.getValidActions("3")).toEqual([]);
    //     expect(game.getValidActions("4")).toEqual([]);
    //     expect(() => game.performAction("1", PlayerActionType.BET, 40n)).toThrow("Must be currently active player.");
    //     expect(() => game.performAction("3", PlayerActionType.FOLD)).toThrow("Must be currently active player.");
    //     expect(() => game.performAction("4", PlayerActionType.RAISE, 30n)).toThrow("Must be currently active player.");
    //     expect(game.getValidActions("2")).toEqual([
    //         {
    //             action: "fold"
    //         },
    //         {
    //             action: "call"
    //         },
    //         {
    //             action: "raise",
    //             maxAmount: 175,
    //             minAmount: 25
    //         },
    //         {
    //             action: "going all-in"
    //         }
    //     ]);
    //     expect(() => game.performAction("2", PlayerActionType.CHECK)).toThrow("Player has insufficient stake to check.");
    //     game.performAction("2", PlayerActionType.CALL);

    //     expect(game.currentPlayerId).toEqual("3");
    //     expect(game.getValidActions("3")).toEqual([
    //         {
    //             action: "fold"
    //         },
    //         {
    //             action: "call"
    //         },
    //         {
    //             action: "raise",
    //             maxAmount: 75,
    //             minAmount: 25
    //         },
    //         {
    //             action: "going all-in"
    //         }
    //     ]);
    //     game.performAction("3", PlayerActionType.FOLD);

    //     expect(game.currentPlayerId).toEqual("4");
    //     game.performAction("4", PlayerActionType.CALL);

    //     expect(game.currentPlayerId).toEqual("1");
    //     expect(game.getValidActions("1")).toEqual([
    //         {
    //             action: "fold"
    //         },
    //         {
    //             action: "check"
    //         },
    //         {
    //             action: "raise",
    //             maxAmount: 225,
    //             minAmount: 25
    //         },
    //         {
    //             action: "going all-in"
    //         }
    //     ]);
    //     expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
    //     game.performAction("1", PlayerActionType.CHECK);

    //     // Flop
    //     expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
    //     expect(game.currentPlayerId).toEqual("4");
    //     expect(game.getValidActions("4")).toEqual([
    //         {
    //             action: "fold"
    //         },
    //         {
    //             action: "check"
    //         },
    //         {
    //             action: "bet",
    //             maxAmount: 75,
    //             minAmount: 25
    //         },
    //         {
    //             action: "going all-in"
    //         }
    //     ]);
    //     game.performAction("4", PlayerActionType.CHECK);

    //     expect(() => game.performAction("1", PlayerActionType.BET, 10n)).toThrow("Amount is less than minimum allowed.");
    //     game.performAction("1", PlayerActionType.BET, 25n);

    //     expect(() => game.performAction("2", PlayerActionType.CHECK)).toThrow("Player has insufficient stake to check.");
    //     game.performAction("2", PlayerActionType.CALL);

    //     expect(game.currentPlayerId).toEqual("4");
    //     expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
    //     game.performAction("4", PlayerActionType.CALL);

    //     // Turn
    //     expect(game.currentRound).toEqual(TexasHoldemRound.TURN);
    //     expect(game.currentPlayerId).toEqual("4");

    //     game.performAction("4", PlayerActionType.CHECK);
    //     game.performAction("1", PlayerActionType.BET, 25n);
    //     game.performAction("2", PlayerActionType.RAISE, 50n);

    //     expect(game.getValidActions("4")).toEqual([
    //         {
    //             action: "fold"
    //         },
    //         {
    //             action: "all-in"
    //         }
    //     ]);

    //     // NOTE: You can always call
    //     //expect(() => game.performAction("4", PlayerActionType.CALL)).toThrow("Player has insufficient chips to call.");
    //     game.performAction("4", PlayerActionType.ALL_IN);

    //     game.performAction("1", PlayerActionType.RAISE, 25n);
    //     expect(game.currentRound).toEqual(TexasHoldemRound.TURN);
    //     game.performAction("2", PlayerActionType.CALL);

    //     // River
    //     expect(game.currentRound).toEqual(TexasHoldemRound.RIVER);
    //     expect(game.currentPlayerId).toEqual("1");
    //     game.performAction("1", PlayerActionType.CHECK);
    //     game.performAction("2", PlayerActionType.BET, 25n);
    //     expect(game.currentRound).toEqual(TexasHoldemRound.RIVER);
    //     game.performAction("1", PlayerActionType.RAISE, 25n);
    //     game.performAction("2", PlayerActionType.ALL_IN);

    //     expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);
    });
});
