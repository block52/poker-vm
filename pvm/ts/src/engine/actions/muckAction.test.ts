import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import MuckAction from "./muckAction";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import { IUpdate, TurnWithSeat } from "../types";
import { gameOptions, getDefaultGame, ONE_THOUSAND_TOKENS } from "../testConstants";

describe("MuckAction", () => {
    let action: MuckAction;
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

        // Setup game for showdown round
        jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.SHOWDOWN);

        action = new MuckAction(game, updateMock);

        player = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined, // No hole cards for simplicity
            PlayerStatus.ACTIVE
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("type", () => {
        it("should return MUCK type", () => {
            expect(action.type).toBe(PlayerActionType.MUCK);
        });
    });

    describe("verify", () => {
        beforeEach(() => {
            // Mock basic validation requirements
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            // Mock that someone has already shown (requirement for mucking)
            const mockShowAction: TurnWithSeat = {
                playerId: "0x123456789abcdef123456789abcdef123456789a",
                action: PlayerActionType.SHOW,
                index: 1,
                seat: 2,
                timestamp: Date.now()
            };
            jest.spyOn(game, "getActionsForRound").mockReturnValue([mockShowAction]);

            // Mock that player doesn't have winning hand
            jest.spyOn(game, "findWinners").mockReturnValue(false);
        });

        it("should return correct range when muck is valid", () => {
            const result = action.verify(player);

            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should throw error if not in showdown round", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

            expect(() => action.verify(player)).toThrow("muck can only be performed during showdown round.");
        });

        it("should throw error if no one has shown first", () => {
            // Mock that no actions have been taken in showdown round
            jest.spyOn(game, "getActionsForRound").mockReturnValue([]);

            expect(() => action.verify(player)).toThrow("A player must show first.");
        });

        it("should throw error if player has winning hand", () => {
            // Create a player with hole cards to test winning hand logic
            const playerWithCards = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                ONE_THOUSAND_TOKENS,
                [
                    { mnemonic: "AS", suit: "spades", rank: "A" },
                    { mnemonic: "KS", suit: "spades", rank: "K" }
                ] as any, // Mock cards with mnemonic property
                PlayerStatus.ACTIVE
            );

            // Mock that player has winning hand
            jest.spyOn(game, "findWinners").mockReturnValue(true);

            expect(() => action.verify(playerWithCards)).toThrow("Cannot muck winning hand.");
        });

        it("should not throw error if player has no hole cards", () => {
            // Test edge case where player has no hole cards
            const playerNoCards = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                undefined,
                ONE_THOUSAND_TOKENS,
                undefined, // No hole cards
                PlayerStatus.ACTIVE
            );

            expect(() => action.verify(playerNoCards)).not.toThrow();
        });

        it("should throw error if player is not active", () => {
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.FOLDED);

            expect(() => action.verify(player)).toThrow("Only active player can muck.");
        });

        it("should throw error if it's not player's turn", () => {
            const otherPlayer = new Player("0xother", undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE);
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(otherPlayer);

            expect(() => action.verify(player)).toThrow("Must be currently active player.");
        });
    });

    describe("execute", () => {
        beforeEach(() => {
            // Mock all verification requirements
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            const mockShowAction: TurnWithSeat = {
                playerId: "0x123456789abcdef123456789abcdef123456789a",
                action: PlayerActionType.SHOW,
                index: 1,
                seat: 2,
                timestamp: Date.now()
            };
            jest.spyOn(game, "getActionsForRound").mockReturnValue([mockShowAction]);
            jest.spyOn(game, "findWinners").mockReturnValue(false);

            // Mock addAction method
            jest.spyOn(game, "addAction").mockImplementation();
        });

        it("should set player status to FOLDED", () => {
            const initialStatus = player.status;
            expect(initialStatus).toBe(PlayerStatus.ACTIVE);

            action.execute(player, 1);

            expect(player.status).toBe(PlayerStatus.FOLDED);
        });

        it("should add muck action to game", () => {
            action.execute(player, 1);

            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.MUCK,
                index: 1
            });
        });

        it("should call verify before executing", () => {
            const verifySpy = jest.spyOn(action, "verify");

            action.execute(player, 1);

            expect(verifySpy).toHaveBeenCalledWith(player);
        });

        it("should work with optional amount parameter", () => {
            expect(() => action.execute(player, 1, 100n)).not.toThrow();
            expect(player.status).toBe(PlayerStatus.FOLDED);
        });

        it("should throw error if verification fails", () => {
            // Make verification fail by setting wrong round
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

            expect(() => action.execute(player, 1)).toThrow("muck can only be performed during showdown round.");
        });
    });

    describe("integration scenarios", () => {
        it("should handle typical showdown muck scenario", () => {
            // Setup: Someone has shown, player has non-winning cards
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            const mockShowAction: TurnWithSeat = {
                playerId: "0x123456789abcdef123456789abcdef123456789a",
                action: PlayerActionType.SHOW,
                index: 1,
                seat: 2,
                timestamp: Date.now()
            };
            jest.spyOn(game, "getActionsForRound").mockReturnValue([mockShowAction]);
            jest.spyOn(game, "findWinners").mockReturnValue(false);
            jest.spyOn(game, "addAction").mockImplementation();

            // Execute muck action
            const result = action.verify(player);
            action.execute(player, 2);

            // Verify results
            expect(result).toEqual({ minAmount: 0n, maxAmount: 0n });
            expect(player.status).toBe(PlayerStatus.FOLDED);
            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.MUCK,
                index: 2
            });
        });
    });
});