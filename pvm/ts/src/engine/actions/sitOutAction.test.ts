import { NonPlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
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
        jest.spyOn(game, "addNonPlayerAction").mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("type", () => {
        it("should return SIT_OUT type", () => {
            expect(action.type).toBe(NonPlayerActionType.SIT_OUT);
        });
    });

    describe("verify", () => {
        it("should return correct range - players can always sit out", () => {
            const result = action.verify(foldedPlayer);
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should allow sit out for active player in any round", () => {
            const rounds = [
                TexasHoldemRound.ANTE,
                TexasHoldemRound.PREFLOP,
                TexasHoldemRound.FLOP,
                TexasHoldemRound.TURN,
                TexasHoldemRound.RIVER,
                TexasHoldemRound.SHOWDOWN,
                TexasHoldemRound.END
            ];

            rounds.forEach(round => {
                jest.spyOn(game, "currentRound", "get").mockReturnValue(round);
                const result = action.verify(activePlayer);
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

        it("should add sit out as non-player action", () => {
            action.execute(foldedPlayer, 7, 0n);
            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: foldedPlayer.address,
                action: NonPlayerActionType.SIT_OUT,
                index: 7
            });
        });

        it("should handle different index values", () => {
            action.execute(foldedPlayer, 99, 0n);
            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: foldedPlayer.address,
                action: NonPlayerActionType.SIT_OUT,
                index: 99
            });
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

        it("should fold active player mid-hand before sitting out", () => {
            // Setup: Active player during PREFLOP (mid-hand)
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
            activePlayer.holeCards = [{ suit: 1, rank: 14, value: 14, mnemonic: "Ah" }, { suit: 2, rank: 13, value: 13, mnemonic: "Kd" }];

            action.execute(activePlayer, 10, 0n);

            // Player should be sitting out
            expect(activePlayer.status).toBe(PlayerStatus.SITTING_OUT);
            // Cards should be mucked
            expect(activePlayer.holeCards).toBeUndefined();
        });

        it("should not fold player during ANTE round", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

            action.execute(activePlayer, 10, 0n);

            // Player should be sitting out directly (no fold step needed)
            expect(activePlayer.status).toBe(PlayerStatus.SITTING_OUT);
        });

        it("should not fold player during END round", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.END);

            action.execute(activePlayer, 10, 0n);

            // Player should be sitting out directly (no fold step needed)
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
            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: foldedPlayer.address,
                action: NonPlayerActionType.SIT_OUT,
                index: 10
            });
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
            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: activePlayer.address,
                action: NonPlayerActionType.SIT_OUT,
                index: 15
            });
        });

        it("should handle sit-out for active player during gameplay (auto-fold)", () => {
            // Setup: Active player tries to sit out during FLOP
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.FLOP);
            activePlayer.holeCards = [{ suit: 1, rank: 14, value: 14, mnemonic: "Ah" }, { suit: 2, rank: 13, value: 13, mnemonic: "Kd" }];

            // Execute sit out - should work (auto-folds the player)
            const result = action.verify(activePlayer);
            action.execute(activePlayer, 30, 0n);

            // Verify results
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            expect(activePlayer.status).toBe(PlayerStatus.SITTING_OUT);
            expect(activePlayer.holeCards).toBeUndefined(); // Cards mucked
            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: activePlayer.address,
                action: NonPlayerActionType.SIT_OUT,
                index: 30
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
            expect(game.addNonPlayerAction).toHaveBeenCalledWith({
                playerId: brokePlayer.address,
                action: NonPlayerActionType.SIT_OUT,
                index: 25
            });
        });
    });
});
