import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import FoldAction from "./foldAction";
import TexasHoldemGame from "../texasHoldem";
import { getDefaultGame } from "../testConstants";

describe("FoldAction", () => {
    let game: TexasHoldemGame;
    let updateMock: any;
    let action: FoldAction;
    let player: Player;

    beforeEach(() => {
        // Setup initial game state
        const playerStates = new Map<number, Player | null>();
        const initialPlayer = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            1000000000000000000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
        playerStates.set(0, initialPlayer);

        game = getDefaultGame(playerStates);

        updateMock = {
            addAction: jest.fn(action => {
                console.log("Action recorded:", action);
                console.log("Pot will be updated with this amount");
            })
        };

        action = new FoldAction(game, updateMock);
        player = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            1000000000000000000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
    });

    describe("type", () => {
        it("should return FOLD action type", () => {
            const type = action.type;
            expect(type).toBe(PlayerActionType.FOLD);
        });
    });

    describe("verify", () => {
        beforeEach(() => {
            // Mock player as the next player to act
            const mockNextPlayer = {
                address: "0x980b8D8A16f5891F41871d878a479d81Da52334c"
            };
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(mockNextPlayer as any);

            // Mock current round
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

            // Mock player status
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        });

        it("should return a range for fold action", () => {
            const range = action.verify(player);
            expect(range).toBeDefined();
            expect(range).toEqual({
                minAmount: 0n, // No chips are lost when folding
                maxAmount: 0n
            });
        });

        it.skip("should throw error if not player's turn", () => {
            // Mock a different player as next to act
            const differentPlayer = {
                address: "0x980b8D8A16f5891F41871d878a479d81Da52334d"
            };
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(differentPlayer as any);

            expect(() => action.verify(player)).toThrow("Must be currently active player.");
        });

        it.skip("should throw error if player is not active", () => {
            // Mock player status as FOLDED
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.FOLDED);

            expect(() => action.verify(player)).toThrow("Only active player can fold.");
        });

        it.skip("should throw error if game is in showdown", () => {
            // Mock game in showdown state
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.SHOWDOWN);

            expect(() => action.verify(player)).toThrow("Hand has ended.");
        });
    });

    describe("execute", () => {
        beforeEach(() => {
            // Mock player as the next player to act
            const mockNextPlayer = {
                address: "0x980b8D8A16f5891F41871d878a479d81Da52334c"
            };
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(mockNextPlayer as any);

            // Mock current round
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

            // Mock player status
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            // Mock game's addAction method
            game.addAction = jest.fn();
        });

        it("should not change player's chips", () => {
            const initialChips = player.chips;
            action.execute(player, 0);
            expect(player.chips).toBe(initialChips);
        });

        it.skip("should add FOLD action with 0 amount", () => {
            action.execute(player, 0);

            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.FOLD
            });
        });
    });
});
