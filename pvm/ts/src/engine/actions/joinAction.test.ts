import { NonPlayerActionType, PlayerStatus } from "@bitcoinbrisbane/block52";
import JoinAction from "./joinAction";
import TexasHoldemGame from "../texasHoldem";
import { Player } from "../../models/player";
import { baseGameConfig, gameOptions, ONE_HUNDRED_TOKENS, ONE_THOUSAND_TOKENS } from "../testConstants";
import { IUpdate } from "../types";

describe("JoinAction", () => {
    let game: TexasHoldemGame;
    let joinAction: JoinAction;
    let player: Player;
    let updateMock: IUpdate;

    beforeEach(() => {
        game = TexasHoldemGame.fromJson(baseGameConfig, gameOptions);
        updateMock = {
            addAction: jest.fn()
        };
        joinAction = new JoinAction(game, updateMock);
        player = new Player("0x1234567890123456789012345678901234567890", undefined, ONE_HUNDRED_TOKENS, undefined, PlayerStatus.ACTIVE);
    });

    describe("type", () => {
        it("should return JOIN action type", () => {
            expect(joinAction.type).toBe(NonPlayerActionType.JOIN);
        });
    });

    describe("verify", () => {
        it("should return min and max buy-in range", () => {
            const range = joinAction.verify(player);
            expect(range.minAmount).toBe(game.minBuyIn);
            expect(range.maxAmount).toBe(game.maxBuyIn);
        });

        it("should throw error if player already exists", () => {
            // Add player to game first
            game.joinAtSeat(player, 1);

            expect(() => joinAction.verify(player)).toThrow("Player already exists in the game.");
        });
    });

    describe("execute", () => {
        it("should successfully join a player with valid amount and seat", () => {
            const index = 1;
            const amount = ONE_HUNDRED_TOKENS;
            const seat = "seat=1";

            joinAction.execute(player, index, amount, seat);

            expect(game.exists(player.address)).toBe(true);
            expect(game.getPlayerSeatNumber(player.address)).toBe(1);
            expect(game.getPlayerCount()).toBe(1);
        });

        it("should assign random seat when no seat specified", () => {
            const index = 1;
            const amount = ONE_HUNDRED_TOKENS;

            joinAction.execute(player, index, amount);

            expect(game.exists(player.address)).toBe(true);
            expect(game.getPlayerCount()).toBe(1);
            // Should be assigned a valid seat between 1 and maxPlayers
            const assignedSeat = game.getPlayerSeatNumber(player.address);
            expect(assignedSeat).toBeGreaterThanOrEqual(1);
            expect(assignedSeat).toBeLessThanOrEqual(gameOptions.maxPlayers);
        });

        it("should assign random seat when empty string provided", () => {
            const index = 1;
            const amount = ONE_HUNDRED_TOKENS;

            joinAction.execute(player, index, amount, "");

            expect(game.exists(player.address)).toBe(true);
            expect(game.getPlayerCount()).toBe(1);
        });

        it("should throw error if amount is below minimum buy-in", () => {
            const index = 1;
            const amount = 10n; // Below minimum
            const seat = "seat=1";

            expect(() => joinAction.execute(player, index, amount, seat))
                .toThrow("Player does not have enough or too many chips to join.");
        });

        it("should throw error if amount is above maximum buy-in", () => {
            const index = 1;
            const amount = ONE_THOUSAND_TOKENS * 10n; // Above maximum
            const seat = "seat=1";

            expect(() => joinAction.execute(player, index, amount, seat))
                .toThrow("Player does not have enough or too many chips to join.");
        });

        it("should throw error if player already exists in game", () => {
            const index = 1;
            const amount = ONE_HUNDRED_TOKENS;
            const seat = "seat=1";

            // Join player first time
            joinAction.execute(player, index, amount, seat);

            // Try to join again
            expect(() => joinAction.execute(player, index + 1, amount, "seat=2"))
                .toThrow("Player already exists in the game.");
        });

        it("should throw error if requested seat is invalid", () => {
            const index = 1;
            const amount = ONE_HUNDRED_TOKENS;

            expect(() => joinAction.execute(player, index, amount, "seat=0"))
                .toThrow("Invalid seat number: 0");

            expect(() => joinAction.execute(player, index, amount, "seat=-1"))
                .toThrow('Invalid seat data format: seat=-1. Expected format: "seat=<number>"');

            expect(() => joinAction.execute(player, index, amount, "seat=abc"))
                .toThrow('Invalid seat data format: seat=abc. Expected format: "seat=<number>"');

            expect(() => joinAction.execute(player, index, amount, "invalid_format"))
                .toThrow('Invalid seat data format: invalid_format. Expected format: "seat=<number>"');
        });

        it("should throw error if no available seats", () => {
            // Fill all available seats
            for (let i = 1; i <= gameOptions.maxPlayers; i++) {
                const testPlayer = new Player(`0x${i.toString().padStart(40, '0')}`, undefined, ONE_HUNDRED_TOKENS, undefined, PlayerStatus.ACTIVE);
                game.joinAtSeat(testPlayer, i);
            }

            const index = 1;
            const amount = ONE_HUNDRED_TOKENS;

            expect(() => joinAction.execute(player, index, amount))
                .toThrow("No available seats to join.");
        });

        it("should parse seat number correctly from seat=X format", () => {
            const index = 1;
            const amount = ONE_HUNDRED_TOKENS;

            joinAction.execute(player, index, amount, "seat=5");

            expect(game.getPlayerSeatNumber(player.address)).toBe(5);
        });

        it("should handle seat number in middle of string", () => {
            const index = 1;
            const amount = ONE_HUNDRED_TOKENS;

            joinAction.execute(player, index, amount, "some other data seat=3 more data");

            expect(game.getPlayerSeatNumber(player.address)).toBe(3);
        });

        it("should add action to game history", () => {
            const index = 1;
            const amount = ONE_HUNDRED_TOKENS;
            const seat = "seat=2";

            const initialActionsCount = game.getPreviousActions().length;
            joinAction.execute(player, index, amount, seat);

            // The action should be added to the game's history
            expect(game.getPreviousActions().length).toBeGreaterThan(initialActionsCount);
        });

        it("should use default amount of 0 if not provided", () => {
            // Create a game with 0 minimum buy-in for this test
            const customGameOptions = { ...gameOptions, minBuyIn: 0n };
            const customGame = TexasHoldemGame.fromJson(baseGameConfig, customGameOptions);
            const customUpdateMock = { addAction: jest.fn() };
            const customJoinAction = new JoinAction(customGame, customUpdateMock);

            const index = 1;
            const seat = "seat=1";

            customJoinAction.execute(player, index, undefined, seat);

            expect(customGame.exists(player.address)).toBe(true);
        });
    });

    describe("getSeat method edge cases", () => {
        it("should handle null data", () => {
            const index = 1;
            const amount = ONE_HUNDRED_TOKENS;

            joinAction.execute(player, index, amount, null as any);

            expect(game.exists(player.address)).toBe(true);
        });

        it("should handle undefined data", () => {
            const index = 1;
            const amount = ONE_HUNDRED_TOKENS;

            joinAction.execute(player, index, amount, undefined);

            expect(game.exists(player.address)).toBe(true);
        });
    });
});