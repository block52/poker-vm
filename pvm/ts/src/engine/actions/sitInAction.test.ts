import { NonPlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import SitInAction from "./sitInAction";
import { IUpdate } from "../types";
import { getDefaultGame, ONE_THOUSAND_TOKENS } from "../testConstants";

describe("SitInAction", () => {
    let action: SitInAction;
    let game: TexasHoldemGame;
    let activePlayer: Player;
    let sittingOutPlayer: Player;
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
            PlayerStatus.SITTING_OUT
        ));
        playerStates.set(2, new Player(
            "0x123456789abcdef123456789abcdef123456789a",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        ));

        game = getDefaultGame(playerStates);

        // Setup game for ante round
        jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

        action = new SitInAction(game, updateMock);

        activePlayer = new Player(
            "0x123456789abcdef123456789abcdef123456789a",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        );

        sittingOutPlayer = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.SITTING_OUT
        );

        // Mock game methods
        jest.spyOn(game, "addAction").mockImplementation();
    });

    describe("type", () => {
        it("should return SIT_IN type", () => {
            expect(action.type).toBe(NonPlayerActionType.SIT_IN);
        });
    });

    describe("verify", () => {
        it("should return correct range when sit in is valid", () => {
            const result = action.verify(sittingOutPlayer);
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should throw error if player is not sitting out", () => {
            expect(() => action.verify(activePlayer))
                .toThrow("Sit in action is not allowed if player is not sitting out.");
        });

        it("should throw error if player is ALL_IN", () => {
            const allInPlayer = new Player(
                "0x456789abcdef123456789abcdef123456789abcd",
                undefined,
                0n,
                undefined,
                PlayerStatus.ALL_IN
            );

            expect(() => action.verify(allInPlayer))
                .toThrow("Sit in action is not allowed if player is not sitting out.");
        });

        it("should throw error if player is FOLDED", () => {
            const foldedPlayer = new Player(
                "0x789abcdef123456789abcdef123456789abcdef12",
                undefined,
                ONE_THOUSAND_TOKENS,
                undefined,
                PlayerStatus.FOLDED
            );

            expect(() => action.verify(foldedPlayer))
                .toThrow("Sit in action is not allowed if player is not sitting out.");
        });

        it("should throw error if player is SHOWING", () => {
            const showingPlayer = new Player(
                "0xabcdef123456789abcdef123456789abcdef123456",
                undefined,
                ONE_THOUSAND_TOKENS,
                undefined,
                PlayerStatus.SHOWING
            );

            expect(() => action.verify(showingPlayer))
                .toThrow("Sit in action is not allowed if player is not sitting out.");
        });

        it("should work regardless of player chips amount", () => {
            const poorPlayer = new Player(
                "0xdef123456789abcdef123456789abcdef123456789",
                undefined,
                1n, // Very small amount
                undefined,
                PlayerStatus.SITTING_OUT
            );

            const result = action.verify(poorPlayer);
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should work with zero chips player", () => {
            const brokePlayer = new Player(
                "0x111222333444555666777888999aaabbbcccddd",
                undefined,
                0n,
                undefined,
                PlayerStatus.SITTING_OUT
            );

            const result = action.verify(brokePlayer);
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should work in any game round", () => {
            const rounds = [
                TexasHoldemRound.ANTE,
                TexasHoldemRound.PREFLOP,
                TexasHoldemRound.FLOP,
                TexasHoldemRound.TURN,
                TexasHoldemRound.RIVER,
                TexasHoldemRound.SHOWDOWN
            ];

            rounds.forEach(round => {
                jest.spyOn(game, "currentRound", "get").mockReturnValue(round);
                const result = action.verify(sittingOutPlayer);
                expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            });
        });
    });

    describe("execute", () => {
        it("should call verify before executing", () => {
            const verifySpy = jest.spyOn(action, "verify");
            action.execute(sittingOutPlayer, 5, 0n);
            expect(verifySpy).toHaveBeenCalledWith(sittingOutPlayer);
        });

        it("should set player status to ACTIVE", () => {
            action.execute(sittingOutPlayer, 5, 0n);
            expect(sittingOutPlayer.status).toBe(PlayerStatus.ACTIVE);
        });

        it("should add sit in action to game", () => {
            action.execute(sittingOutPlayer, 7, 0n);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: sittingOutPlayer.address,
                action: NonPlayerActionType.SIT_IN,
                index: 7
            }, TexasHoldemRound.ANTE);
        });

        it("should handle different index values", () => {
            action.execute(sittingOutPlayer, 99, 0n);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: sittingOutPlayer.address,
                action: NonPlayerActionType.SIT_IN,
                index: 99
            }, TexasHoldemRound.ANTE);
        });

        it("should throw error if verification fails", () => {
            expect(() => action.execute(activePlayer, 1, 0n))
                .toThrow("Sit in action is not allowed if player is not sitting out.");
        });

        it("should preserve player chips during sit in", () => {
            const originalChips = sittingOutPlayer.chips;
            action.execute(sittingOutPlayer, 5, 0n);
            expect(sittingOutPlayer.chips).toBe(originalChips);
        });

        it("should work with amount parameter provided", () => {
            // Even though amount is not used for sit in, it should still work if provided
            action.execute(sittingOutPlayer, 5, 100n);
            expect(sittingOutPlayer.status).toBe(PlayerStatus.ACTIVE);
        });

        it("should add action with current round", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
            action.execute(sittingOutPlayer, 3, 0n);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: sittingOutPlayer.address,
                action: NonPlayerActionType.SIT_IN,
                index: 3
            }, TexasHoldemRound.PREFLOP);
        });
    });

    describe("integration scenarios", () => {
        it("should handle typical sit-in scenario", () => {
            // Setup: Player is sitting out and wants to rejoin
            expect(sittingOutPlayer.status).toBe(PlayerStatus.SITTING_OUT);

            // Execute sit in
            const result = action.verify(sittingOutPlayer);
            action.execute(sittingOutPlayer, 10, 0n);

            // Verify results
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            expect(sittingOutPlayer.status).toBe(PlayerStatus.ACTIVE);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: sittingOutPlayer.address,
                action: NonPlayerActionType.SIT_IN,
                index: 10
            }, TexasHoldemRound.ANTE);
        });

        it("should handle sit-in during different rounds", () => {
            // Test sitting in during various game rounds
            const testRounds = [
                TexasHoldemRound.PREFLOP,
                TexasHoldemRound.FLOP,
                TexasHoldemRound.TURN,
                TexasHoldemRound.RIVER
            ];

            testRounds.forEach((round, index) => {
                // Reset player status
                sittingOutPlayer.updateStatus(PlayerStatus.SITTING_OUT);
                jest.spyOn(game, "currentRound", "get").mockReturnValue(round);

                const result = action.verify(sittingOutPlayer);
                action.execute(sittingOutPlayer, index + 20, 0n);

                expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
                expect(sittingOutPlayer.status).toBe(PlayerStatus.ACTIVE);
                expect(game.addAction).toHaveBeenCalledWith({
                    playerId: sittingOutPlayer.address,
                    action: NonPlayerActionType.SIT_IN,
                    index: index + 20
                }, round);
            });
        });

        it("should handle sit-in with zero chips", () => {
            // Setup: Player with no chips wants to sit in
            const brokePlayer = new Player(
                "0x333444555666777888999aaabbbcccdddeeefffA",
                undefined,
                0n,
                undefined,
                PlayerStatus.SITTING_OUT
            );

            // Execute sit in
            const result = action.verify(brokePlayer);
            action.execute(brokePlayer, 15, 0n);

            // Verify results
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            expect(brokePlayer.status).toBe(PlayerStatus.ACTIVE);
            expect(brokePlayer.chips).toBe(0n);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: brokePlayer.address,
                action: NonPlayerActionType.SIT_IN,
                index: 15
            }, TexasHoldemRound.ANTE);
        });
    });
});