import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
import AllInAction from "./allInAction";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import { IUpdate } from "../types";
import { getDefaultGame, ONE_THOUSAND_TOKENS, TEN_TOKENS } from "../testConstants";

describe("AllInAction", () => {
    let action: AllInAction;
    let game: TexasHoldemGame;
    let player: Player;
    let updateMock: IUpdate;

    beforeEach(() => {
        // Mock the IUpdate interface
        updateMock = {
            addAction: jest.fn()
        };

        // Create default game
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

        // Setup game for preflop round (all-in is typically used during betting rounds)
        jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

        action = new AllInAction(game, updateMock);

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
        it("should return ALL_IN type", () => {
            expect(action.type).toBe(PlayerActionType.ALL_IN);
        });
    });

    describe("verify", () => {
        beforeEach(() => {
            // Mock basic validation requirements
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        });

        it("should return correct range when all-in is valid", () => {
            const result = action.verify(player);

            expect(result).toEqual({
                minAmount: ONE_THOUSAND_TOKENS,
                maxAmount: ONE_THOUSAND_TOKENS
            });
        });

        it("should throw error if player has no chips", () => {
            const playerNoChips = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                0n, // No chips
                undefined,
                PlayerStatus.ACTIVE
            );

            expect(() => action.verify(playerNoChips)).toThrow("Player has no chips so can't go all-in.");
        });

        it("should work with small chip amount", () => {
            const playerSmallStack = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                TEN_TOKENS,
                undefined,
                PlayerStatus.ACTIVE
            );

            const result = action.verify(playerSmallStack);

            expect(result).toEqual({
                minAmount: TEN_TOKENS,
                maxAmount: TEN_TOKENS
            });
        });

        it("should throw error if player is not active", () => {
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.FOLDED);

            expect(() => action.verify(player)).toThrow("Only active player can all-in.");
        });

        it("should throw error if it's not player's turn", () => {
            const otherPlayer = new Player("0xother", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE);
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(otherPlayer);

            expect(() => action.verify(player)).toThrow("Must be currently active player.");
        });
    });

    describe("getDeductAmount", () => {
        it("should return player's total chips regardless of input amount", () => {
            // Test that getDeductAmount always returns all chips, ignoring the amount parameter
            const deductAmount = (action as any).getDeductAmount(player, 100n);

            expect(deductAmount).toBe(ONE_THOUSAND_TOKENS);
        });

        it("should return correct amount for small stack", () => {
            const smallStackPlayer = new Player(
                "0xtest",
                undefined,
                TEN_TOKENS,
                undefined,
                PlayerStatus.ACTIVE
            );

            const deductAmount = (action as any).getDeductAmount(smallStackPlayer, 1000n);

            expect(deductAmount).toBe(TEN_TOKENS);
        });

        it("should return 0 for player with no chips", () => {
            const noChipsPlayer = new Player(
                "0xtest",
                undefined,
                0n,
                undefined,
                PlayerStatus.ACTIVE
            );

            const deductAmount = (action as any).getDeductAmount(noChipsPlayer, 500n);

            expect(deductAmount).toBe(0n);
        });
    });

    describe("execute", () => {
        beforeEach(() => {
            // Mock all verification requirements
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            // Mock addAction method
            jest.spyOn(game, "addAction").mockImplementation();

            // Mock getBetManager to simulate betting logic
            const mockBetManager = {
                addPlayerBet: jest.fn(),
                getLargestBet: jest.fn().mockReturnValue(0n),
                current: jest.fn().mockReturnValue(0n)
            };
            jest.spyOn(action as any, "getBetManager").mockReturnValue(mockBetManager);
        });

        it("should add all-in action to game", () => {
            action.execute(player, 1, ONE_THOUSAND_TOKENS);

            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.ALL_IN,
                amount: ONE_THOUSAND_TOKENS,
                index: 1
            }, TexasHoldemRound.PREFLOP);
        });

        it("should deduct all chips from player", () => {
            const initialChips = player.chips;
            expect(initialChips).toBe(ONE_THOUSAND_TOKENS);

            action.execute(player, 1, ONE_THOUSAND_TOKENS);

            expect(player.chips).toBe(0n);
        });

        it("should work with partial amount", () => {
            // Test that base execute behavior works with partial amounts
            action.execute(player, 1, 500n);

            expect(player.chips).toBe(ONE_THOUSAND_TOKENS - 500n);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.ALL_IN,
                amount: 500n,
                index: 1
            }, TexasHoldemRound.PREFLOP);
        });

        it("should throw error if verification fails", () => {
            // Make verification fail by giving player no chips
            const noChipsPlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                0n,
                undefined,
                PlayerStatus.ACTIVE
            );

            expect(() => action.execute(noChipsPlayer, 1, 100n)).toThrow("Player has insufficient chips to all-in.");
        });
    });

    describe("integration scenarios", () => {
        it("should handle typical all-in scenario", () => {
            // Setup: Player with chips in preflop
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
            jest.spyOn(game, "addAction").mockImplementation();

            const mockBetManager = {
                addPlayerBet: jest.fn(),
                getLargestBet: jest.fn().mockReturnValue(0n),
                current: jest.fn().mockReturnValue(0n)
            };
            jest.spyOn(action as any, "getBetManager").mockReturnValue(mockBetManager);

            const initialChips = player.chips;

            // Execute all-in action
            const result = action.verify(player);
            action.execute(player, 2, initialChips);

            // Verify results
            expect(result).toEqual({
                minAmount: initialChips,
                maxAmount: initialChips
            });
            expect(player.chips).toBe(0n);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.ALL_IN,
                amount: initialChips,
                index: 2
            }, TexasHoldemRound.PREFLOP);
        });

        it("should handle all-in with small stack", () => {
            // Test all-in with very small chip amount
            const smallStackPlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                1n, // Only 1 unit
                undefined,
                PlayerStatus.ACTIVE
            );

            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(smallStackPlayer);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
            jest.spyOn(game, "addAction").mockImplementation();

            const mockBetManager = {
                addPlayerBet: jest.fn(),
                getLargestBet: jest.fn().mockReturnValue(0n),
                current: jest.fn().mockReturnValue(0n)
            };
            jest.spyOn(action as any, "getBetManager").mockReturnValue(mockBetManager);

            const result = action.verify(smallStackPlayer);
            action.execute(smallStackPlayer, 3, 1n);

            expect(result).toEqual({ minAmount: 1n, maxAmount: 1n });
            expect(smallStackPlayer.chips).toBe(0n);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: smallStackPlayer.address,
                action: PlayerActionType.ALL_IN,
                amount: 1n,
                index: 3
            }, TexasHoldemRound.PREFLOP);
        });
    });
});