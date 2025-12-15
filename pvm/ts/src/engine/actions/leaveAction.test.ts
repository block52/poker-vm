import { NonPlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
import LeaveAction from "./leaveAction";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import { IUpdate } from "../types";
import { getDefaultGame, ONE_THOUSAND_TOKENS, TEN_TOKENS } from "../testConstants";

describe("LeaveAction", () => {
    let action: LeaveAction;
    let game: TexasHoldemGame;
    let player: Player;
    let updateMock: IUpdate;

    beforeEach(() => {
        // Mock the IUpdate interface
        updateMock = {
            addAction: jest.fn()
        };

        // Create default game with multiple players
        const playerStates = new Map<number, Player | null>();
        playerStates.set(1, new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        ));
        playerStates.set(2, new Player(
            "0x123456789abcdef123456789abcdef123456789a",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        ));

        game = getDefaultGame(playerStates);

        action = new LeaveAction(game, updateMock);

        player = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("type", () => {
        it("should return LEAVE type", () => {
            expect(action.type).toBe(NonPlayerActionType.LEAVE);
        });
    });

    describe("verify", () => {
        it("should return player's chip amount as range when in ANTE round", () => {
            // Mock game to be in ANTE round
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

            const result = action.verify(player);

            expect(result).toEqual({
                minAmount: ONE_THOUSAND_TOKENS,
                maxAmount: ONE_THOUSAND_TOKENS
            });
        });

        it("should work with different chip amounts when FOLDED", () => {
            const playerWithDifferentChips = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                TEN_TOKENS,
                undefined,
                PlayerStatus.FOLDED
            );

            const result = action.verify(playerWithDifferentChips);

            expect(result).toEqual({
                minAmount: TEN_TOKENS,
                maxAmount: TEN_TOKENS
            });
        });

        it("should work with zero chips when SITTING_OUT", () => {
            const playerWithZeroChips = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                0n,
                undefined,
                PlayerStatus.SITTING_OUT
            );

            const result = action.verify(playerWithZeroChips);

            expect(result).toEqual({
                minAmount: 0n,
                maxAmount: 0n
            });
        });

        it("should allow leaving when player is FOLDED", () => {
            const foldedPlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                ONE_THOUSAND_TOKENS,
                undefined,
                PlayerStatus.FOLDED
            );

            expect(() => action.verify(foldedPlayer)).not.toThrow();
            expect(action.verify(foldedPlayer)).toEqual({
                minAmount: ONE_THOUSAND_TOKENS,
                maxAmount: ONE_THOUSAND_TOKENS
            });
        });

        it("should allow leaving when player is SITTING_OUT", () => {
            const sittingOutPlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                ONE_THOUSAND_TOKENS,
                undefined,
                PlayerStatus.SITTING_OUT
            );

            expect(() => action.verify(sittingOutPlayer)).not.toThrow();
            expect(action.verify(sittingOutPlayer)).toEqual({
                minAmount: ONE_THOUSAND_TOKENS,
                maxAmount: ONE_THOUSAND_TOKENS
            });
        });

        it("should NOT allow leaving when player is ACTIVE in hand", () => {
            const activePlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                ONE_THOUSAND_TOKENS,
                undefined,
                PlayerStatus.ACTIVE
            );

            // Mock game to be in preflop round (active hand)
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

            expect(() => action.verify(activePlayer)).toThrow(
                "Cannot leave during active hand"
            );
        });

        it("should allow leaving in ANTE round even if status is ACTIVE", () => {
            const activePlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                ONE_THOUSAND_TOKENS,
                undefined,
                PlayerStatus.ACTIVE
            );

            // Mock game to be in ANTE round (no hand in progress)
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

            expect(() => action.verify(activePlayer)).not.toThrow();
            expect(action.verify(activePlayer)).toEqual({
                minAmount: ONE_THOUSAND_TOKENS,
                maxAmount: ONE_THOUSAND_TOKENS
            });
        });
    });

    describe("execute", () => {
        beforeEach(() => {
            // Mock game methods
            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(1);
            jest.spyOn(game, "removePlayer").mockImplementation();
            jest.spyOn(game, "addNonPlayerAction").mockImplementation();
            // Allow leaving by setting game to ANTE round
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

            // Mock dealer manager
            const mockDealerManager = {
                handlePlayerLeave: jest.fn()
            };
            (game as any).dealerManager = mockDealerManager;

            // Mock console.log to avoid test output
            jest.spyOn(console, "log").mockImplementation();
        });

        it("should call verify before executing", () => {
            const verifySpy = jest.spyOn(action, "verify");

            action.execute(player, 1);

            expect(verifySpy).toHaveBeenCalledWith(player);
        });

        it("should get player seat number", () => {
            action.execute(player, 1);

            expect(game.getPlayerSeatNumber).toHaveBeenCalledWith(player.address);
        });

        it("should handle dealer manager leave logic", () => {
            action.execute(player, 1);

            expect(game.dealerManager.handlePlayerLeave).toHaveBeenCalledWith(1);
        });

        it("should remove player from game", () => {
            action.execute(player, 1);

            expect(game.removePlayer).toHaveBeenCalledWith(player.address);
        });

        it("should add leave action to game history", () => {
            action.execute(player, 1);

            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: NonPlayerActionType.LEAVE,
                index: 1,
                amount: ONE_THOUSAND_TOKENS
            }, "1");
        });

        it("should log player leaving", () => {
            action.execute(player, 1);

            expect(console.log).toHaveBeenCalledWith(
                `Player ${player.address} at seat 1 leaving with ${ONE_THOUSAND_TOKENS} chips...`
            );
        });

        it("should handle different seat numbers", () => {
            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(5);

            action.execute(player, 2);

            expect(game.dealerManager.handlePlayerLeave).toHaveBeenCalledWith(5);
            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: NonPlayerActionType.LEAVE,
                index: 2,
                amount: ONE_THOUSAND_TOKENS
            }, "5");
        });

        it("should handle different chip amounts", () => {
            const playerWithSmallStack = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                TEN_TOKENS,
                undefined,
                PlayerStatus.ACTIVE
            );

            action.execute(playerWithSmallStack, 3);

            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: playerWithSmallStack.address,
                action: NonPlayerActionType.LEAVE,
                index: 3,
                amount: TEN_TOKENS
            }, "1");
        });

        it("should handle player with zero chips", () => {
            const playerWithZeroChips = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                0n,
                undefined,
                PlayerStatus.ACTIVE
            );

            action.execute(playerWithZeroChips, 4);

            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: playerWithZeroChips.address,
                action: NonPlayerActionType.LEAVE,
                index: 4,
                amount: 0n
            }, "1");
        });

        it("should handle different index values", () => {
            action.execute(player, 99);

            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: NonPlayerActionType.LEAVE,
                index: 99,
                amount: ONE_THOUSAND_TOKENS
            }, "1");
        });
    });

    describe("integration scenarios", () => {
        it("should handle typical leave scenario", () => {
            // Setup: Player at seat 2 with chips
            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(2);
            jest.spyOn(game, "removePlayer").mockImplementation();
            jest.spyOn(game, "addNonPlayerAction").mockImplementation();
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

            const mockDealerManager = {
                handlePlayerLeave: jest.fn()
            };
            (game as any).dealerManager = mockDealerManager;
            jest.spyOn(console, "log").mockImplementation();

            // Execute leave action
            const result = action.verify(player);
            action.execute(player, 5);

            // Verify results
            expect(result).toEqual({
                minAmount: ONE_THOUSAND_TOKENS,
                maxAmount: ONE_THOUSAND_TOKENS
            });
            expect(game.getPlayerSeatNumber).toHaveBeenCalledWith(player.address);
            expect(game.dealerManager.handlePlayerLeave).toHaveBeenCalledWith(2);
            expect(game.removePlayer).toHaveBeenCalledWith(player.address);
            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: NonPlayerActionType.LEAVE,
                index: 5,
                amount: ONE_THOUSAND_TOKENS
            }, "2");
        });

        it("should handle leave during different game states", () => {
            // Test that leaving works regardless of game state
            const foldedPlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                ONE_THOUSAND_TOKENS,
                undefined,
                PlayerStatus.FOLDED
            );

            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(3);
            jest.spyOn(game, "removePlayer").mockImplementation();
            jest.spyOn(game, "addNonPlayerAction").mockImplementation();

            const mockDealerManager = {
                handlePlayerLeave: jest.fn()
            };
            (game as any).dealerManager = mockDealerManager;
            jest.spyOn(console, "log").mockImplementation();

            expect(() => action.verify(foldedPlayer)).not.toThrow();
            action.execute(foldedPlayer, 6);

            expect(game.removePlayer).toHaveBeenCalledWith(foldedPlayer.address);
            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: foldedPlayer.address,
                action: NonPlayerActionType.LEAVE,
                index: 6,
                amount: ONE_THOUSAND_TOKENS
            }, "3");
        });

        it("should handle leave with all-in player who has folded", () => {
            const allInPlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                0n, // All-in players typically have 0 chips
                undefined,
                PlayerStatus.FOLDED // All-in player who folded can leave
            );

            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(4);
            jest.spyOn(game, "removePlayer").mockImplementation();
            jest.spyOn(game, "addNonPlayerAction").mockImplementation();

            const mockDealerManager = {
                handlePlayerLeave: jest.fn()
            };
            (game as any).dealerManager = mockDealerManager;
            jest.spyOn(console, "log").mockImplementation();

            const result = action.verify(allInPlayer);
            action.execute(allInPlayer, 7);

            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: allInPlayer.address,
                action: NonPlayerActionType.LEAVE,
                index: 7,
                amount: 0n
            }, "4");
        });
    });
});