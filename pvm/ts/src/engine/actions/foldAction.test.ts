import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import FoldAction from "./foldAction";
import TexasHoldemGame from "../texasHoldem";
import { getDefaultGame, PLAYER_1_ADDRESS, PLAYER_2_ADDRESS } from "../testConstants";
import { IUpdate } from "../types";

describe("FoldAction", () => {
    let game: TexasHoldemGame;
    let updateMock: IUpdate;
    let action: FoldAction;
    let player: Player;
    let mockNextPlayer: Player;

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

        mockNextPlayer = new Player(
            PLAYER_1_ADDRESS, // address
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
            const players: Player[] = [player, mockNextPlayer];

            // Mock the methods that verify() calls
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
            // Mock findLivePlayers to return multiple players
            jest.spyOn(game, "findLivePlayers").mockReturnValue(players);
        });

        it("should return a range for fold action", () => {
            const range = action.verify(player);
            expect(range).toBeDefined();
            expect(range).toEqual({
                minAmount: 0n,
                maxAmount: 0n
            });
        });

        it("should throw error if player has already folded", () => {
            player.status = PlayerStatus.FOLDED;

            expect(() => action.verify(player)).toThrow("Player has already folded.");
        });

        it("should throw error if game is in showdown", () => {
            // Mock game in showdown state
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.SHOWDOWN);

            expect(() => action.verify(player)).toThrow("fold action is not allowed during showdown round.");
        });

        it("should throw error if player is the last live player", () => {
            // Mock findLivePlayers to return only this player (making them the last live player)
            jest.spyOn(game, "findLivePlayers").mockReturnValue([player]);

            expect(() => action.verify(player)).toThrow("Cannot fold when you are the last live player.");
        });

        it("should allow fold when multiple live players exist", () => {
            // Mock findLivePlayers to return multiple players
            const otherPlayer = new Player(
                PLAYER_2_ADDRESS,
                undefined,
                1000000000000000000n,
                undefined,
                PlayerStatus.ACTIVE
            );
            jest.spyOn(game, "findLivePlayers").mockReturnValue([player, otherPlayer]);

            const range = action.verify(player);
            expect(range).toEqual({
                minAmount: 0n,
                maxAmount: 0n
            });
        });
    });

    describe("execute", () => {
        beforeEach(() => {
            // Mock all the dependencies for verify()
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            // Mock findLivePlayers to have multiple players so fold is allowed
            jest.spyOn(game, "findLivePlayers").mockReturnValue([player, mockNextPlayer]);

            // Mock game's addAction method
            game.addAction = jest.fn();
        });

        it("should not change player's chips", () => {
            const initialChips = player.chips;
            action.execute(player, 0);
            expect(player.chips).toBe(initialChips);
        });

        it("should set player status to FOLDED", () => {
            const updateStatusSpy = jest.spyOn(player, "updateStatus");

            action.execute(player, 0);

            expect(updateStatusSpy).toHaveBeenCalledWith(PlayerStatus.FOLDED);
        });

        it("should add FOLD action to game", () => {
            action.execute(player, 0);

            expect(game.addAction).toHaveBeenCalledWith({
                playerId: player.address,
                action: PlayerActionType.FOLD,
                index: 0
            }, TexasHoldemRound.PREFLOP);
        });

        it("should call verify before executing", () => {
            const verifySpy = jest.spyOn(action, "verify");

            action.execute(player, 0);

            expect(verifySpy).toHaveBeenCalledWith(player);
        });
    });
});