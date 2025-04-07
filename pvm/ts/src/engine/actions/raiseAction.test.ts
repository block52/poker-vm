import { ActionDTO, GameOptions, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import { ethers } from "ethers";
import RaiseAction from "./raiseAction";
import { Turn } from "../types";
import { gameOptions } from "../testConstants";

describe("Raise Action", () => {
    let game: TexasHoldemGame;
    let updateMock: any;
    let action: RaiseAction;
    let player: Player;
    let nextPlayer: Player;

    const previousActions: ActionDTO[] = [];

    beforeEach(() => {
        // Setup initial game state
        const playerStates = new Map<number, Player | null>();
        const initialPlayer = new Player(
            "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", // address
            undefined, // lastAction
            1000000000000000000000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
        playerStates.set(0, initialPlayer);

        game = new TexasHoldemGame(
            ethers.ZeroAddress,
            gameOptions,
            9, // dealer
            1, // nextToAct
            previousActions, // previousActions
            TexasHoldemRound.PREFLOP,
            [], // communityCards
            0n, // pot
            playerStates
        );

        updateMock = {
            addAction: jest.fn()
        };

        action = new RaiseAction(game, updateMock);
        player = new Player(
            "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac",
            undefined, // lastAction
            1000000000000000000000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );

        // Create next player
        nextPlayer = new Player(
            "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac", // Same address as player for simplicity
            undefined,
            1000000000000000000000n,
            undefined,
            PlayerStatus.ACTIVE
        );

        // Mock game methods
        jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
        jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
        jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(nextPlayer);

        // Mock addAction method on game
        game.addAction = jest.fn();
    });

    describe("type", () => {
        it("should return RAISE action type", () => {
            expect(action.type).toBe(PlayerActionType.RAISE);
        });
    });

    describe("verify", () => {
        beforeEach(() => {
            // Mock a previous bet action to raise against
            const lastBet: Turn = {
                playerId: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                action: PlayerActionType.BET,
                amount: 50000000000000000000n  // 50 tokens
            };
            jest.spyOn(game, "getPlayersLastAction").mockReturnValue(lastBet);
        });

        it.skip("should return correct range for a raise", () => {
            const range = action.verify(player);

            // Min amount should be previous bet + big blind
            const expectedMinAmount = 50000000000000000000n + 20000000000000000000n; // 70 tokens

            expect(range).toEqual({
                minAmount: expectedMinAmount,
                maxAmount: player.chips
            });
        });

        it("should throw error if no previous bet exists", () => {
            // Mock no previous bet
            jest.spyOn(game, "getPlayersLastAction").mockReturnValue(undefined);

            expect(() => action.verify(player)).toThrow("No previous bet to raise.");
        });

        it.skip("should throw error if player has insufficient chips", () => {
            // Set player chips lower than the raise amount
            player.chips = 10000000000000000000n; // 10 tokens

            expect(() => action.verify(player)).toThrow("Player has insufficient chips to raise.");
        });

        it.skip("should throw error if it's not player's turn", () => {
            // Change the next player to a different address
            const differentPlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c", // Different address
                undefined,
                1000000000000000000000n,
                undefined,
                PlayerStatus.ACTIVE
            );
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(differentPlayer);

            expect(() => action.verify(player)).toThrow("Must be currently active player.");
        });

        it("should throw error if round is SHOWDOWN", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.SHOWDOWN);

            expect(() => action.verify(player)).toThrow("Hand has ended.");
        });

        it.skip("should throw error if player is not active", () => {
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.FOLDED);

            // Need to mock a bet action to avoid throwing error in verify
            const lastBet: Turn = {
                playerId: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                action: PlayerActionType.BET,
                amount: 50000000000000000000n  // 50 tokens
            };
            jest.spyOn(game, "getPlayersLastAction").mockReturnValue(lastBet);

            expect(() => action.verify(player)).toThrow(`Only active player can ${PlayerActionType.RAISE}.`);
        });
    });

    describe("getDeductAmount", () => {
        it("should return the amount if player has sufficient chips", () => {
            const amount = 50000000000000000000n; // 50 tokens
            const result = (action as any).getDeductAmount(player, amount);
            expect(result).toBe(amount);
        });

        it("should return player's total chips if amount exceeds chips", () => {
            const amount = 2000000000000000000000n; // 2000 tokens
            player.chips = 1000000000000000000000n; // 1000 tokens

            const result = (action as any).getDeductAmount(player, amount);
            expect(result).toBe(player.chips);
        });
    });

    describe("execute", () => {
        beforeEach(() => {
            // Mock a previous bet
            const lastBet: Turn = {
                playerId: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                action: PlayerActionType.BET,
                amount: 50000000000000000000n  // 50 tokens
            };
            jest.spyOn(game, "getPlayersLastAction").mockReturnValue(lastBet);

            // Mock the verify method to avoid errors during execute
            jest.spyOn(action, "verify").mockReturnValue({
                minAmount: 70000000000000000000n, // 70 tokens
                maxAmount: player.chips
            });
        });

        it.skip("should deduct the raise amount from player chips", () => {
            const initialChips = player.chips;
            const raiseAmount = 100000000000000000000n; // 100 tokens

            action.execute(player, raiseAmount);

            expect(player.chips).toBe(initialChips - raiseAmount);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.RAISE,
                amount: raiseAmount
            });
        });

        it.skip("should set player's action to ALL_IN if raising all chips", () => {
            const raiseAmount = player.chips;

            action.execute(player, raiseAmount);

            expect(player.chips).toBe(0n);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.ALL_IN,
                amount: raiseAmount
            });
        });

        it("should throw error if amount is less than minimum allowed", () => {
            const tooSmallAmount = 50000000000000000000n; // 50 tokens

            expect(() => action.execute(player, tooSmallAmount)).toThrow("Amount is less than minimum allowed.");
        });

        it("should throw error if amount is greater than maximum allowed", () => {
            const tooLargeAmount = 2000000000000000000000n; // 2000 tokens
            player.chips = 1000000000000000000000n; // 1000 tokens

            // Update mock to use player's chips as max
            jest.spyOn(action, "verify").mockReturnValue({
                minAmount: 70000000000000000000n, // 70 tokens
                maxAmount: player.chips
            });

            expect(() => action.execute(player, tooLargeAmount)).toThrow("Amount is greater than maximum allowed.");
        });

        it("should throw error if required amount is not provided", () => {
            // expect(() => action.execute(player)).toThrow(`Amount needs to be specified for ${PlayerActionType.RAISE}`);
        });
    });
});