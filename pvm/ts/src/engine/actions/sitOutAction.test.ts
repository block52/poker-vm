import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import SitOutAction from "./sitOutAction";
import { IUpdate } from "../types";
import { getDefaultGame, ONE_THOUSAND_TOKENS } from "../testConstants";

describe("SitOutAction", () => {
    let action: SitOutAction;
    let game: TexasHoldemGame;
    let activePlayer: Player;
    let foldedPlayer: Player;
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
            PlayerStatus.FOLDED
        ));

        game = getDefaultGame(playerStates);

        // Setup game for ante round
        jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

        action = new SitOutAction(game, updateMock);

        activePlayer = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        );

        foldedPlayer = new Player(
            "0x123456789abcdef123456789abcdef123456789a",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.FOLDED
        );

        // Mock game methods
        jest.spyOn(game, "addAction").mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("type", () => {
        it("should return SIT_OUT type", () => {
            expect(action.type).toBe(PlayerActionType.SIT_OUT);
        });
    });

    describe("verify", () => {
        it("should return correct range when player is folded", () => {
            const result = action.verify(foldedPlayer);
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should return correct range when in ante round with active player", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);
            const result = action.verify(activePlayer);
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should throw error if not in ante round and player not folded", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

            expect(() => action.verify(activePlayer))
                .toThrow("sit-out can only be performed during ante round.");
        }); it("should allow sit out in ante round regardless of player status", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

            const playerStatuses = [
                PlayerStatus.ACTIVE,
                PlayerStatus.ALL_IN,
                PlayerStatus.SHOWING,
                PlayerStatus.SITTING_OUT
            ];

            playerStatuses.forEach(status => {
                const testPlayer = new Player(
                    `0x${status}123456789abcdef123456789abcdef123456`,
                    undefined,
                    ONE_THOUSAND_TOKENS,
                    undefined,
                    status
                );

                const result = action.verify(testPlayer);
                expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            });
        });

        it("should allow folded players to sit out in any round", () => {
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
                const result = action.verify(foldedPlayer);
                expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            });
        });

        it("should work with zero chips player", () => {
            const brokePlayer = new Player(
                "0x111222333444555666777888999aaabbbcccddd",
                undefined,
                0n,
                undefined,
                PlayerStatus.FOLDED
            );

            const result = action.verify(brokePlayer);
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should throw error if active player tries to sit out during non-ante rounds", () => {
            const nonAnteRounds = [
                TexasHoldemRound.PREFLOP,
                TexasHoldemRound.FLOP,
                TexasHoldemRound.TURN,
                TexasHoldemRound.RIVER,
                TexasHoldemRound.SHOWDOWN
            ];

            nonAnteRounds.forEach(round => {
                jest.spyOn(game, "currentRound", "get").mockReturnValue(round);
                expect(() => action.verify(activePlayer))
                    .toThrow("sit-out can only be performed during ante round.");
            });
        });
    });

    describe("execute", () => {
        it("should call verify before executing", () => {
            const verifySpy = jest.spyOn(action, "verify");
            action.execute(foldedPlayer, 5, 0n);
            expect(verifySpy).toHaveBeenCalledWith(foldedPlayer);
        });

        it("should set player status to SITTING_OUT", () => {
            action.execute(foldedPlayer, 5, 0n);
            expect(foldedPlayer.status).toBe(PlayerStatus.SITTING_OUT);
        });

        it("should add sit out action to game", () => {
            action.execute(foldedPlayer, 7, 0n);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: foldedPlayer.address,
                action: PlayerActionType.SIT_OUT,
                index: 7
            }, TexasHoldemRound.ANTE);
        });

        it("should handle different index values", () => {
            action.execute(foldedPlayer, 99, 0n);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: foldedPlayer.address,
                action: PlayerActionType.SIT_OUT,
                index: 99
            }, TexasHoldemRound.ANTE);
        });

        it("should throw error if verification fails", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
            expect(() => action.execute(activePlayer, 1, 0n))
                .toThrow("sit-out can only be performed during ante round.");
        });

        it("should preserve player chips during sit out", () => {
            const originalChips = foldedPlayer.chips;
            action.execute(foldedPlayer, 5, 0n);
            expect(foldedPlayer.chips).toBe(originalChips);
        });

        it("should work with amount parameter provided", () => {
            // Even though amount is not used for sit out, it should still work if provided
            action.execute(foldedPlayer, 5, 100n);
            expect(foldedPlayer.status).toBe(PlayerStatus.SITTING_OUT);
        });

        it("should add action with current round", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
            action.execute(foldedPlayer, 3, 0n);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: foldedPlayer.address,
                action: PlayerActionType.SIT_OUT,
                index: 3
            }, TexasHoldemRound.PREFLOP);
        });

        it("should work with active player in ante round", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);
            action.execute(activePlayer, 10, 0n);
            expect(activePlayer.status).toBe(PlayerStatus.SITTING_OUT);
        });
    });

    describe("integration scenarios", () => {
        it("should handle typical sit-out scenario for folded player", () => {
            // Setup: Player is folded and wants to leave
            expect(foldedPlayer.status).toBe(PlayerStatus.FOLDED);

            // Execute sit out
            const result = action.verify(foldedPlayer);
            action.execute(foldedPlayer, 10, 0n);

            // Verify results
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            expect(foldedPlayer.status).toBe(PlayerStatus.SITTING_OUT);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: foldedPlayer.address,
                action: PlayerActionType.SIT_OUT,
                index: 10
            }, TexasHoldemRound.ANTE);
        });

        it("should handle sit-out during ante round for active player", () => {
            // Setup: Active player wants to leave during ante
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);
            expect(activePlayer.status).toBe(PlayerStatus.ACTIVE);

            // Execute sit out
            const result = action.verify(activePlayer);
            action.execute(activePlayer, 15, 0n);

            // Verify results
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            expect(activePlayer.status).toBe(PlayerStatus.SITTING_OUT);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: activePlayer.address,
                action: PlayerActionType.SIT_OUT,
                index: 15
            }, TexasHoldemRound.ANTE);
        });

        it("should handle sit-out for folded player during different rounds", () => {
            // Test sitting out during various game rounds with folded player
            const testRounds = [
                TexasHoldemRound.PREFLOP,
                TexasHoldemRound.FLOP,
                TexasHoldemRound.TURN,
                TexasHoldemRound.RIVER,
                TexasHoldemRound.SHOWDOWN
            ];

            testRounds.forEach((round, index) => {
                // Reset player status
                foldedPlayer.updateStatus(PlayerStatus.FOLDED);
                jest.spyOn(game, "currentRound", "get").mockReturnValue(round);

                const result = action.verify(foldedPlayer);
                action.execute(foldedPlayer, index + 20, 0n);

                expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
                expect(foldedPlayer.status).toBe(PlayerStatus.SITTING_OUT);
                expect(game.addAction).toHaveBeenCalledWith({
                    playerId: foldedPlayer.address,
                    action: PlayerActionType.SIT_OUT,
                    index: index + 20
                }, round);
            });
        });

        it("should handle sit-out with zero chips", () => {
            // Setup: Player with no chips wants to sit out
            const brokePlayer = new Player(
                "0x333444555666777888999aaabbbcccdddeeefffA",
                undefined,
                0n,
                undefined,
                PlayerStatus.FOLDED
            );

            // Execute sit out
            const result = action.verify(brokePlayer);
            action.execute(brokePlayer, 25, 0n);

            // Verify results
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            expect(brokePlayer.status).toBe(PlayerStatus.SITTING_OUT);
            expect(brokePlayer.chips).toBe(0n);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: brokePlayer.address,
                action: PlayerActionType.SIT_OUT,
                index: 25
            }, TexasHoldemRound.ANTE);
        });

        it("should reject active player trying to sit out during gameplay", () => {
            // Setup: Active player tries to sit out during non-ante round
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.FLOP);

            // Verify it throws error
            expect(() => action.verify(activePlayer))
                .toThrow("sit-out can only be performed during ante round.");

            expect(() => action.execute(activePlayer, 30, 0n))
                .toThrow("sit-out can only be performed during ante round.");
        });
    });
});