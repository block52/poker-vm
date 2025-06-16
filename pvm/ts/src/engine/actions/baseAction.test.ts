import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BaseAction from "./baseAction";
import TexasHoldemGame from "../texasHoldem";
import { IUpdate, Turn } from "../types";
import { getDefaultGame, mnemonic } from "../testConstants";

// Test implementation of abstract BaseAction
class TestAction extends BaseAction {
    get type(): PlayerActionType {
        return PlayerActionType.CHECK;
    }

    public shouldReturnRange: boolean = false;

    verify(player: Player) {
        const baseResult = super.verify(player);
        return this.shouldReturnRange ? { minAmount: 10n, maxAmount: 100n } : baseResult;
    }

    // public testGetDeductAmount(player: Player, amount?: bigint): bigint {
    //     return this.getDeductAmount(player, amount);
    // }
}

describe("BaseAction", () => {
    let game: TexasHoldemGame;
    let updateMock: IUpdate;
    let action: TestAction;
    let player: Player;
    let addedActions: Turn[];

    beforeEach(() => {
        // Setup initial game state
        const playerStates = new Map<number, Player | null>();

        // Create player with correct constructor parameters
        const initialPlayer = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            1000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
        playerStates.set(0, initialPlayer);
        game = getDefaultGame(playerStates);

        addedActions = [];
        updateMock = {
            addAction: (action: Turn) => {
                addedActions.push(action);
            }
        };

        action = new TestAction(game, updateMock);
        player = new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, 1000n, undefined, PlayerStatus.ACTIVE);
    });

    describe("verify", () => {
        describe("game state validation", () => {
            it.only("should throw error if player is not active", () => {
                jest.spyOn(game as any, "getPlayerStatus").mockReturnValue(PlayerStatus.FOLDED);
                expect(() => action.verify(player)).toThrow("Must be currently active player.");
            });

            it.skip("should allow verification in non-showdown rounds", () => {
                const rounds = [TexasHoldemRound.ANTE, TexasHoldemRound.PREFLOP, TexasHoldemRound.FLOP, TexasHoldemRound.TURN, TexasHoldemRound.RIVER];

                rounds.forEach(round => {
                    jest.spyOn(game, "currentRound", "get").mockReturnValue(round);
                    jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x980b8D8A16f5891F41871d878a479d81Da52334c");
                    jest.spyOn(game as any, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

                    expect(() => action.verify(player)).not.toThrow();
                });
            });
        });

        describe("player validation", () => {
            beforeEach(() => {
                jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
            });

            it("should throw error if not player's turn", () => {
                jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x456");

                expect(() => action.verify(player)).toThrow("Must be currently active player.");
            });

            it("should throw error if player is not active", () => {
                jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x980b8D8A16f5891F41871d878a479d81Da52334c");
                jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.FOLDED);

                expect(() => action.verify(player)).toThrow("Must be currently active player.");
            });

            it.only("should allow verification for active player on their turn", () => {
                jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x980b8D8A16f5891F41871d878a479d81Da52334c");
                jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

                expect(() => action.verify(player)).not.toThrow();
            });
        });
    });

    describe.skip("execute", () => {
        beforeEach(() => {
            // Setup for successful verification
            jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
            jest.spyOn(game as any, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        });

        describe("amount validation", () => {
            it("should throw error if amount provided but not required", () => {
                action.shouldReturnRange = false;
                expect(() => action.execute(player, 0, 50n)).toThrow("Amount should not be specified for check");
            });

            it("should throw error if amount is less than minimum", () => {
                action.shouldReturnRange = true;
                expect(() => action.execute(player, 0, 5n)).toThrow("Amount is less than minimum allowed.");
            });

            it("should throw error if amount is greater than maximum", () => {
                action.shouldReturnRange = true;
                expect(() => action.execute(player, 0, 150n)).toThrow("Amount is greater than maximum allowed.");
            });

            it("should accept amount within valid range", () => {
                action.shouldReturnRange = true;
                expect(() => action.execute(player, 0, 50n)).not.toThrow();
            });
        });

        describe("chip handling", () => {
            it("should throw error if player has insufficient chips", () => {
                action.shouldReturnRange = true;
                const poorPlayer = new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, 5n, undefined, PlayerStatus.ACTIVE);

                expect(() => action.execute(poorPlayer, 0, 50n)).toThrow("Player has insufficient chips to check.");
            });

            it("should deduct correct amount from player chips", () => {
                action.shouldReturnRange = true;
                const initialChips = player.chips;
                action.execute(player, 0, 50n);
                expect(player.chips).toBe(initialChips - 50n);
            });

            it("should handle all-in scenario", () => {
                action.shouldReturnRange = true;
                const allInPlayer = new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, 50n, undefined, PlayerStatus.ACTIVE);
                action.execute(allInPlayer, 0, 50n);

                expect(allInPlayer.chips).toBe(0n);
                expect(addedActions[0].action).toBe(PlayerActionType.ALL_IN);
            });
        });

        describe("action recording", () => {
            it("should record normal action", () => {
                action.shouldReturnRange = true;
                action.execute(player, 0, 50n);

                expect(addedActions[0]).toEqual({
                    playerId: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                    action: PlayerActionType.CHECK,
                    amount: 50n
                });
            });

            it("should record action without amount when not required", () => {
                action.shouldReturnRange = false;
                action.execute(player, 0, 0n);

                expect(addedActions[0]).toEqual({
                    playerId: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                    action: PlayerActionType.CHECK,
                    amount: 0n
                });
            });
        });
    });

    // describe.skip("getDeductAmount", () => {
    //     it("should return 0n when no amount provided", () => {
    //         expect(action.testGetDeductAmount(player)).toBe(0n);
    //     });

    //     it("should return provided amount when specified", () => {
    //         expect(action.testGetDeductAmount(player, 100n)).toBe(100n);
    //     });
    // });

    describe.skip("round-specific behavior", () => {
        beforeEach(() => {
            jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x980b8D8A16f5891F41871d878a479d81Da52334c");
            jest.spyOn(game as any, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        });

        describe("ANTE round", () => {
            beforeEach(() => {
                jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);
            });

            it("should validate blind actions during ANTE", () => {
                action.shouldReturnRange = true;
                expect(() => action.verify(player)).not.toThrow();
            });
        });

        describe("PREFLOP round", () => {
            beforeEach(() => {
                jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
            });

            it("should validate betting actions", () => {
                action.shouldReturnRange = true;
                expect(() => action.verify(player)).not.toThrow();
            });
        });

        describe("betting sequence validation", () => {
            it("should handle all-in situations correctly", () => {
                const shortStackPlayer = new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, 25n, undefined, PlayerStatus.ACTIVE);
                action.shouldReturnRange = true;
                action.execute(shortStackPlayer, 0, 25n);
                expect(addedActions[0].action).toBe(PlayerActionType.ALL_IN);
            });
        });
    });

    describe.skip("BaseAction core functions", () => {
        describe("verify function", () => {
            it("should check game round is not SHOWDOWN", () => {
                jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.SHOWDOWN);

                expect(() => action.verify(player)).toThrow("Hand has ended.");
            });

            it("should check if it's player's turn", () => {
                jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x456"); // different player ID

                expect(() => action.verify(player)).toThrow("Must be currently active player.");
            });

            it("should check if player is active", () => {
                jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x980b8D8A16f5891F41871d878a479d81Da52334c");
                jest.spyOn(game as any, "getPlayerStatus").mockReturnValue(PlayerStatus.FOLDED);

                expect(() => action.verify(player)).toThrow("Only active player can check.");
            });
        });

        describe("execute function", () => {
            beforeEach(() => {
                // Setup for successful verification
                jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x980b8D8A16f5891F41871d878a479d81Da52334c");
                jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
                jest.spyOn(game as any, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
            });

            it("should validate amount when range is provided", () => {
                action.shouldReturnRange = true;
                expect(() => action.execute(player, 0, 5n)).toThrow("Amount is less than minimum allowed.");
            });

            it("should not allow amount when range is undefined", () => {
                action.shouldReturnRange = false;
                expect(() => action.execute(player, 0, 50n)).toThrow("Amount should not be specified for check");
            });

            it("should check if player has sufficient chips", () => {
                action.shouldReturnRange = true;
                const poorPlayer = new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, 5n, undefined, PlayerStatus.ACTIVE);
                expect(() => action.execute(poorPlayer, 0, 50n)).toThrow("Player has insufficient chips to check");
            });

            it("should deduct chips correctly", () => {
                action.shouldReturnRange = true;
                const initialChips = player.chips;
                action.execute(player, 0, 50n);
                expect(player.chips).toBe(initialChips - 50n);
            });

            it("should convert to ALL_IN when player uses all chips", () => {
                action.shouldReturnRange = true;
                const allInPlayer = new Player("0x980b8D8A16f5891F41871d878a479d81Da52334c", undefined, 50n, undefined, PlayerStatus.ACTIVE);
                action.execute(allInPlayer, 0, 50n);
                expect(addedActions[0].action).toBe(PlayerActionType.ALL_IN);
            });
        });
    });
});
