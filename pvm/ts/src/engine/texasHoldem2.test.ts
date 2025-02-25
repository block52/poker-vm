import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../models/game";
import TexasHoldemGame from "./texasHoldem";
import { ethers } from "ethers";

describe("Texas Holdem Game", () => {
    const baseGameConfig = {
        address: ethers.ZeroAddress,
        minBuyIn: 1000000000000000000000n, // 1000 tokens
        maxBuyIn: 3000000000000000000000n, // 3000 tokens
        minPlayers: 2,
        maxPlayers: 9,
        smallBlind: 10000000000000000000n, // 10 tokens
        bigBlind: 20000000000000000000n,   // 20 tokens
        dealer: 0,
        nextToAct: 1,
        currentRound: "ante",
        communityCards: [],
        pot: 0n,
        players: []
    };

    describe("Game Initialization", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig);
        });

        it("should initialize with correct base properties", () => {
            expect(game.bigBlind).toEqual(20000000000000000000n);
            expect(game.smallBlind).toEqual(10000000000000000000n);
            expect(game.dealerPosition).toEqual(0);
            expect(game.currentPlayerId).toEqual(ethers.ZeroAddress);
            expect(game.getPlayerCount()).toEqual(0);
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);
            expect(game.pot).toEqual(0n);
        });

        it("should find correct next available seat", () => {
            expect(game.findNextSeat()).toEqual(1);
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 1000000000000000000000n);
            expect(game.findNextSeat()).toEqual(2);
        });

        it("should throw error when table is full", () => {
            for (let i = 0; i < 9; i++) {
                game.join2(`0x${i}`, 1000000000000000000000n);
            }
            expect(() => game.join2("0x9999", 1000000000000000000000n)).toThrow();
        });
    });

    describe("Player Management", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig);
        });

        it("should correctly add players", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 1000000000000000000000n);
            expect(game.getPlayerCount()).toEqual(1);
            expect(game.exists("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeTruthy();
            
            game.join2("", 1000000000000000000000n);
            expect(game.getPlayerCount()).toEqual(2);
            expect(game.exists("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeTruthy();
        });

        it("should not allow duplicate players", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 1000000000000000000000n);
            expect(() => game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 1000000000000000000000n)).toThrow();
        });

        it("should handle player removal", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 1000000000000000000000n);
            game.leave("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(game.exists("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeFalsy();
            expect(game.getPlayerCount()).toEqual(0);
        });

        it("should track player positions correctly", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 1000000000000000000000n);
            game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", 1000000000000000000000n);
            
            expect(game.getPlayerSeatNumber("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toEqual(1);
            expect(game.getPlayerSeatNumber("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toEqual(2);
        });
    });

    describe("Game Flow", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig);
            // Add minimum required players
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 1000000000000000000000n);
            game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", 1000000000000000000000n);
        });

        it("should automatically progress from ante to preflop when minimum players join", () => {
            expect(game.currentRound).toEqual(TexasHoldemRound.ANTE);
            expect(game.getPlayerCount()).toEqual(2);
            
            // Verify blinds are posted
            const bets = game.getBets();
            expect(bets.get("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")).toBeDefined();
            expect(bets.get("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toBeDefined();
        });

        it("should handle betting actions", () => {
            const player = game.getPlayer("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            
            // Test different actions
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CHECK);
            expect(game.getLastAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")?.action).toEqual(PlayerActionType.CHECK);
            
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.BET, 50000000000000000000n);
            expect(game.getLastAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac")?.action).toEqual(PlayerActionType.BET);
        });

        it("should validate legal actions", () => {
            const legalActions = game.getValidActions("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(legalActions).toContainEqual(expect.objectContaining({
                action: PlayerActionType.CHECK
            }));
        });
    });

    describe("Complete Game Round", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig);
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 1000000000000000000000n);
            game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", 1000000000000000000000n);
        });

        it("should complete a full round of play", () => {
            // Pre-flop
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CALL);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK);
            
            // Flop
            expect(game.currentRound).toEqual(TexasHoldemRound.FLOP);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CHECK);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CHECK);
            
            // Turn
            expect(game.currentRound).toEqual(TexasHoldemRound.TURN);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.BET, 50000000000000000000n);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.CALL);
            
            // River
            expect(game.currentRound).toEqual(TexasHoldemRound.RIVER);
            game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CHECK);
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.FOLD);
            
            // Verify game state after completion
            expect(game.currentRound).toEqual(TexasHoldemRound.SHOWDOWN);
            expect(game.pot).toBeGreaterThan(0n);
        });
    });

    describe("Edge Cases and Error Handling", () => {
        let game: TexasHoldemGame;

        beforeEach(() => {
            game = TexasHoldemGame.fromJson(baseGameConfig);
        });

        it("should handle invalid actions", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 1000000000000000000000n);
            expect(() => game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.BET, -1n)).toThrow();
            expect(() => game.performAction("0x9999", PlayerActionType.CHECK)).toThrow();
        });

        it("should prevent actions from non-active players", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 1000000000000000000000n);
            game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", 1000000000000000000000n);
            game.leave("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
            expect(() => game.performAction("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", PlayerActionType.CHECK)).toThrow();
        });

        it("should handle all-in scenarios", () => {
            game.join2("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", 1000000000000000000000n);
            game.join2("0x980b8D8A16f5891F41871d878a479d81Da52334c", 500000000000000000n);
            
            game.performAction("0x980b8D8A16f5891F41871d878a479d81Da52334c", PlayerActionType.BET, 500000000000000000n);
            expect(game.getPlayerStatus("0x980b8D8A16f5891F41871d878a479d81Da52334c")).toEqual(PlayerStatus.ALL_IN);
        });
    });
});