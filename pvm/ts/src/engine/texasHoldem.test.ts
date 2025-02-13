import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../models/game";
import TexasHoldemGame from "./texasHoldem";

import { ethers } from "ethers";

describe.only("Texas Holdem Game", () => {
    // unfold law prevent sail where ketchup oxygen now tip cream denial pool
    // const wallet = ethers.Wallet.fromMnemonic("unfold law prevent sail where ketchup oxygen now tip cream denial pool");

    describe.only("Properties and methods", () => {
        it("should create instance of TexasHoldemGame from JSON", () => {

            const json = {
                address: ethers.ZeroAddress,
                minPlayers: 2,
                maxPlayers: 9,
                minBuyIn: 1000000000000000000000n,
                maxBuyIn: 3000000000000000000000n,
                smallBlind: 10000000000000000000n,
                bigBlind: 30000000000000000000n,
                dealer: ethers.ZeroAddress,
                players: [],
                communityCards: [],
                pot: 0,
                currentBet: 0,
                currentRound: TexasHoldemRound.ANTE,
                currentTurn: ethers.ZeroAddress
            }

            const game = TexasHoldemGame.fromJson(json);
            expect(game).toBeDefined();

            // expect(game.address).toEqual(ethers.ZeroAddress);
            // expect(game.minPlayers).toEqual(2);
        });
    });

    // describe("Properties and methods", () => {
    //     it("should get a player status after joining", () => {
    //         const game = new TexasHoldemGame(ethers.ZeroAddress, "2,9,10000000000000000000,300000000000000000");

    //         expect(game.findNextSeat()).toEqual(1);
    //         game.join(new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", 100n));

    //         // get player count
    //         expect(game.getPlayerCount()).toEqual(1);
    //         expect(game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
    //         expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeTruthy();
    //     });

    //     it("should find the next player", () => {
    //         const game = new TexasHoldemGame(ethers.ZeroAddress, "2,9,10000000000000000000,300000000000000000");
    //         game.join(new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", 100n));
    //         expect(game.findNextSeat()).toEqual(2);

    //         game.join(new Player("0x1F396d3EE16553E94e26f07c41895E97845AbE0a", 200n));
    //         expect(game.findNextSeat()).toEqual(3);

    //         const player1 = game.getPlayer("0x980b8D8A16f5891F41871d878a479d81Da52334c");
    //         expect(player1).toBeDefined();
    //         expect(player1.holeCards).toBeDefined();

    //         const player2 = game.getPlayer("0x1F396d3EE16553E94e26f07c41895E97845AbE0a");
    //         expect(player2).toBeDefined();
    //         expect(player2.holeCards).toBeDefined();
    //     });
    // });

    // describe("Heads up", () => {
    //     // const wallet = ethers.Wallet.fromPhrase("panther ahead despair juice crystal inch seat drill sight special vote guide");

    //     it("should have the correct properties pre flop", () => {
    //         const game = new TexasHoldemGame(ethers.ZeroAddress, "2,9,10000000000000000000,300000000000000000");
    //         expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

    //         game.join(new Player("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f", 250n));
    //         expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

    //         game.join(new Player("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 200n));
    //         expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

    //         // get player state
    //         const player1 = game.getPlayer("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f");
    //         expect(player1).toBeDefined();

    //         const player2 = game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
    //         expect(player2).toBeDefined();
    //     });

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
    // });
});
