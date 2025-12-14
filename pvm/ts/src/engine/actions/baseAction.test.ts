import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import TexasHoldemGame from "../texasHoldem";
import { IUpdate, TurnWithSeat } from "../types";
import { getDefaultGame, ONE_THOUSAND_TOKENS } from "../testConstants";

// Test implementation of abstract BaseAction
class TestAction extends BaseAction {
    get type(): PlayerActionType {
        return PlayerActionType.CHECK;
    }

    // Expose protected methods for testing
    public testGetBetManager(includeBlinds?: boolean) {
        return this.getBetManager(includeBlinds);
    }

    public testValidateNotInAnteRound() {
        return this.validateNotInAnteRound();
    }

    public testValidateNotInShowdownRound() {
        return this.validateNotInShowdownRound();
    }

    public testValidateInSpecificRound(round: TexasHoldemRound) {
        return this.validateInSpecificRound(round);
    }

    public testValidateNotInSpecificRound(round: TexasHoldemRound) {
        return this.validateNotInSpecificRound(round);
    }

    public testSetAllInWhenBalanceIsZero(player: Player) {
        return this.setAllInWhenBalanceIsZero(player);
    }

    public testVerifyPlayerIsActive(player: Player) {
        return this.verifyPlayerIsActive(player);
    }
}

describe("BaseAction", () => {
    let game: TexasHoldemGame;
    let updateMock: IUpdate;
    let action: TestAction;
    let player: Player;

    beforeEach(() => {
        // Setup initial game state
        const playerStates = new Map<number, Player | null>();

        const initialPlayer = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        );
        playerStates.set(1, initialPlayer);
        game = getDefaultGame(playerStates);

        updateMock = {
            addAction: jest.fn()
        };

        action = new TestAction(game, updateMock);
        player = new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE);

        // Mock game state for basic functionality
        jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
        jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
        jest.spyOn(game, "addAction").mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("verify", () => {
        it("should allow verification for active player on their turn", () => {
            const result = action.verify(player);
            expect(result).toBeUndefined();
        });

        it("should throw error if not player's turn", () => {
            const differentPlayer = new Player("0x1234567890abcdef1234567890abcdef12345678", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE);
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(differentPlayer);

            expect(() => action.verify(player)).toThrow("Must be currently active player.");
        });

        it("should throw error if player is not active", () => {
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.FOLDED);

            expect(() => action.verify(player)).toThrow("Only active player can check.");
        });

        it("should allow ACTIVE players to act", () => {
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            expect(() => action.verify(player)).not.toThrow();
        });

        it("should throw error if player has no chips and action doesn't allow zero chips", () => {
            const brokePlayer = new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, 0n, undefined, PlayerStatus.ACTIVE);
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(brokePlayer);

            expect(() => action.verify(brokePlayer)).toThrow("Player has no chips left and cannot perform this action.");
        });
    });

    describe("execute", () => {
        it("should deduct chips from player", () => {
            const initialChips = player.chips;
            action.execute(player, 1, 100n);

            expect(player.chips).toBe(initialChips - 100n);
        });

        it("should throw error if player has insufficient chips", () => {
            const poorPlayer = new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, 50n, undefined, PlayerStatus.ACTIVE);

            expect(() => action.execute(poorPlayer, 1, 100n)).toThrow("Player has insufficient chips to check.");
        });

        it("should add action to game", () => {
            action.execute(player, 1, 100n);

            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.CHECK,
                amount: 100n,
                index: 1
            }, TexasHoldemRound.PREFLOP);
        });

        it("should convert to ALL_IN when player uses all chips", () => {
            const allInPlayer = new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, 100n, undefined, PlayerStatus.ACTIVE);
            action.execute(allInPlayer, 1, 100n);

            expect(game.addAction).toHaveBeenCalledWith({
                playerId: allInPlayer.address,
                action: PlayerActionType.ALL_IN,
                amount: 100n,
                index: 1
            }, TexasHoldemRound.PREFLOP);
        });
    });

    describe("utility methods", () => {
        describe("getBetManager", () => {
            beforeEach(() => {
                const mockActions: TurnWithSeat[] = [
                    { playerId: player.address, action: PlayerActionType.BET, amount: 100n, index: 1, seat: 1, timestamp: Date.now() }
                ];
                jest.spyOn(game, "getActionsForRound").mockReturnValue(mockActions);
            });

            it("should return BetManager for current round", () => {
                const betManager = action.testGetBetManager();
                expect(betManager).toBeDefined();
                expect(betManager.getLargestBet()).toBe(100n);
            });

            it("should include blinds when requested", () => {
                const anteActions: TurnWithSeat[] = [
                    { playerId: player.address, action: PlayerActionType.SMALL_BLIND, amount: 50n, index: 0, seat: 1, timestamp: Date.now() }
                ];
                jest.spyOn(game, "getActionsForRound").mockReturnValueOnce([]).mockReturnValueOnce(anteActions);

                const betManager = action.testGetBetManager(true);
                expect(betManager).toBeDefined();
            });
        });

        describe("round validation methods", () => {
            it("validateNotInAnteRound should throw error in ANTE round", () => {
                jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

                expect(() => action.testValidateNotInAnteRound()).toThrow("Cannot check in the ante round.");
            });

            it("validateNotInAnteRound should not throw error in other rounds", () => {
                jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

                expect(() => action.testValidateNotInAnteRound()).not.toThrow();
            });

            it("validateNotInShowdownRound should throw error in SHOWDOWN round", () => {
                jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.SHOWDOWN);

                expect(() => action.testValidateNotInShowdownRound()).toThrow("Cannot check in the showdown round.");
            });

            it("validateInSpecificRound should throw error if not in required round", () => {
                jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

                expect(() => action.testValidateInSpecificRound(TexasHoldemRound.ANTE)).toThrow("check can only be performed during ante round.");
            });

            it("validateNotInSpecificRound should throw error if in forbidden round", () => {
                jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.SHOWDOWN);

                expect(() => action.testValidateNotInSpecificRound(TexasHoldemRound.SHOWDOWN)).toThrow("check action is not allowed during showdown round.");
            });
        });

        describe("setAllInWhenBalanceIsZero", () => {
            it("should set player status to ALL_IN when chips are zero", () => {
                const allInPlayer = new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, 0n, undefined, PlayerStatus.ACTIVE);
                action.testSetAllInWhenBalanceIsZero(allInPlayer);

                expect(allInPlayer.status).toBe(PlayerStatus.ALL_IN);
            });

            it("should not change status when player has chips", () => {
                action.testSetAllInWhenBalanceIsZero(player);
                expect(player.status).toBe(PlayerStatus.ACTIVE);
            });
        });

        describe("verifyPlayerIsActive", () => {
            it("should not throw error for active player", () => {
                expect(() => action.testVerifyPlayerIsActive(player)).not.toThrow();
            });

            it("should not throw error for ACTIVE player", () => {
                jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
                expect(() => action.testVerifyPlayerIsActive(player)).not.toThrow();
            });

            it("should throw error for folded player", () => {
                jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.FOLDED);
                expect(() => action.testVerifyPlayerIsActive(player)).toThrow("Only active player can check.");
            });
        });
    });
});
