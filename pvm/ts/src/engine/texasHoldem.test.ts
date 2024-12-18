import { PlayerActionType, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../models/game";
import TexasHoldemGame from "./texasHoldem";

import { ethers } from "ethers";

describe("Texas Holdem Game", () => {
    describe("Heads up", () => {
        // const wallet = ethers.Wallet.fromPhrase("panther ahead despair juice crystal inch seat drill sight special vote guide");

        it.only("should have the correct properties pre flop", () => {
            const game = new TexasHoldemGame(ethers.ZeroAddress, 10, 30, 2);
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            game.join(new Player("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f", 250));
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);

            game.join(new Player("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 200));
            // expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // // get player state
            // const player1 = game.getPlayer("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f");
            // expect(player1).toBeDefined();
            // expect(player1?.id).toEqual("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f");
        });

        it.skip("should allow a round to be played heads up", () => {
            const game = new TexasHoldemGame(ethers.ZeroAddress, 10, 30, 2);
            game.join(new Player("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f", 250));
            game.join(new Player("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 200));

            // get player state
            const player1 = game.getPlayer("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f");
            expect(player1).toBeDefined();
            expect(player1?.id).toEqual("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f");

            const player2 = game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(player2).toBeDefined();
            expect(player2?.id).toEqual("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");

            const players = game.players;
            expect(players).toHaveLength(2);

            // game.deal();
            expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);

            // get big blind and small blind
            expect(game.getBets().get("0xb297255C6e686B3FC05E9F1A95CbCF46EEF9981f")).toEqual(10); // Small blind
            expect(game.getBets().get("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toEqual(25); // Big blind
            expect(game.pot).toEqual(35);
        });
    });

    it("should process messages", function () {
        const game = new TexasHoldemGame(ethers.ZeroAddress, 10, 30);

        game.join(new Player("1", 100));
        game.join(new Player("2", 200));
        game.join(new Player("3", 300));
        game.deal();

        // Pre-flop
        game.performAction("1", PlayerActionType.CALL);
        game.performAction("2", PlayerActionType.CALL);
        game.performAction("3", PlayerActionType.FOLD);

        // Flop
        game.performAction("2", PlayerActionType.CHECK);
        game.performAction("1", PlayerActionType.BET, 30);
        game.performAction("2", PlayerActionType.CALL);

        // Turn
        game.performAction("2", PlayerActionType.CHECK);
        game.performAction("1", PlayerActionType.CHECK);

        // River
        game.performAction("2", PlayerActionType.CHECK);
        game.performAction("1", PlayerActionType.CHECK);
    });

    it("should allow a round to be played", () => {
        const game = new TexasHoldemGame(ethers.ZeroAddress, 10, 25, 2);
        game.join(new Player("1", 250));
        game.join(new Player("2", 200));
        game.join(new Player("3", 100));
        game.join(new Player("4", 100));
        game.deal();

        expect(game.getBets().get("4")).toEqual(10); // Small blind
        expect(game.getBets().get("1")).toEqual(25); // Big blind
        expect(game.getBets().get("2")).toEqual(undefined);
        expect(game.getBets().get("3")).toEqual(undefined);

        // Pre-flop
        expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
        expect(game.currentPlayerId).toEqual("2");
        expect(game.getValidActions("1")).toEqual([]);
        expect(game.getValidActions("3")).toEqual([]);
        expect(game.getValidActions("4")).toEqual([]);
        expect(() => game.performAction("1", PlayerActionType.BET, 40)).toThrow("Must be currently active player.");
        expect(() => game.performAction("3", PlayerActionType.FOLD)).toThrow("Must be currently active player.");
        expect(() => game.performAction("4", PlayerActionType.RAISE, 30)).toThrow("Must be currently active player.");
        expect(game.getValidActions("2")).toEqual([
            {
                action: "fold"
            },
            {
                action: "call"
            },
            {
                action: "raise",
                maxAmount: 175,
                minAmount: 25
            },
            {
                action: "going all-in"
            }
        ]);
        expect(() => game.performAction("2", PlayerActionType.CHECK)).toThrow("Player has insufficient stake to check.");
        game.performAction("2", PlayerActionType.CALL);

        expect(game.currentPlayerId).toEqual("3");
        expect(game.getValidActions("3")).toEqual([
            {
                action: "fold"
            },
            {
                action: "call"
            },
            {
                action: "raise",
                maxAmount: 75,
                minAmount: 25
            },
            {
                action: "going all-in"
            }
        ]);
        game.performAction("3", PlayerActionType.FOLD);

        expect(game.currentPlayerId).toEqual("4");
        game.performAction("4", PlayerActionType.CALL);

        expect(game.currentPlayerId).toEqual("1");
        expect(game.getValidActions("1")).toEqual([
            {
                action: "fold"
            },
            {
                action: "check"
            },
            {
                action: "raise",
                maxAmount: 225,
                minAmount: 25
            },
            {
                action: "going all-in"
            }
        ]);
        expect(game.currentRound).toEqual(TexasHoldemRound.PREFLOP);
        game.performAction("1", PlayerActionType.CHECK);

        // Flop
        expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
        expect(game.currentPlayerId).toEqual("4");
        expect(game.getValidActions("4")).toEqual([
            {
                action: "fold"
            },
            {
                action: "check"
            },
            {
                action: "bet",
                maxAmount: 75,
                minAmount: 25
            },
            {
                action: "going all-in"
            }
        ]);
        game.performAction("4", PlayerActionType.CHECK);

        expect(() => game.performAction("1", PlayerActionType.BET, 10)).toThrow("Amount is less than minimum allowed.");
        game.performAction("1", PlayerActionType.BET, 25);

        expect(() => game.performAction("2", PlayerActionType.CHECK)).toThrow("Player has insufficient stake to check.");
        game.performAction("2", PlayerActionType.CALL);

        expect(game.currentPlayerId).toEqual("4");
        expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
        game.performAction("4", PlayerActionType.CALL);

        // Turn
        expect(game.currentRound).toEqual(TexasHoldemRound.TURN);
        expect(game.currentPlayerId).toEqual("4");

        game.performAction("4", PlayerActionType.CHECK);
        game.performAction("1", PlayerActionType.BET, 25);
        game.performAction("2", PlayerActionType.RAISE, 50);

        expect(game.getValidActions("4")).toEqual([
            {
                action: "fold"
            },
            {
                action: "all-in"
            }
        ]);

        // NOTE: You can always call
        //expect(() => game.performAction("4", PlayerActionType.CALL)).toThrow("Player has insufficient chips to call.");
        game.performAction("4", PlayerActionType.ALL_IN);

        game.performAction("1", PlayerActionType.RAISE, 25);
        expect(game.currentRound).toEqual(TexasHoldemRound.TURN);
        game.performAction("2", PlayerActionType.CALL);

        // River
        expect(game.currentRound).toEqual(TexasHoldemRound.RIVER);
        expect(game.currentPlayerId).toEqual("1");
        game.performAction("1", PlayerActionType.CHECK);
        game.performAction("2", PlayerActionType.BET, 25);
        expect(game.currentRound).toEqual(TexasHoldemRound.RIVER);
        game.performAction("1", PlayerActionType.RAISE, 25);
        game.performAction("2", PlayerActionType.ALL_IN);

        expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);
    });
});
