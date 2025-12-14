import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";
import SmallBlindAction from "./smallBlindAction";
import TexasHoldemGame from "../texasHoldem";
import { getDefaultGame, DETERMINISTIC_TIMESTAMP } from "../testConstants";
import { IUpdate } from "../types";

describe("SmallBlindAction", () => {
    let game: TexasHoldemGame;
    let updateMock: IUpdate;
    let action: SmallBlindAction;
    let player: Player;

    beforeEach(() => {
        // Setup initial game state
        const playerStates = new Map<number, Player | null>();
        const initialPlayer = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            100000000000000000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
        playerStates.set(1, initialPlayer);

        game = getDefaultGame(playerStates);
        game.setActionTimestamp(DETERMINISTIC_TIMESTAMP);

        updateMock = {
            addAction: jest.fn(action => {
                console.log("Action recorded:", action);
                console.log("Pot will be updated with this amount");
            })
        };

        action = new SmallBlindAction(game, updateMock);
        player = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            100000000000000000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
    });

    describe("type", () => {
        it("should return SMALL_BLIND action type", () => {
            const type = action.type;
            expect(type).toBe(PlayerActionType.SMALL_BLIND);
        });
    });

    describe("verify", () => {
        beforeEach(() => {
            // Mock player as the next player to act
            const mockNextPlayer = {
                address: "0x980b8D8A16f5891F41871d878a479d81Da52334c"
            };
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(mockNextPlayer as Player);

            // Mock current round
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

            // Mock player status
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            // Mock player seat number
            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(1);
        });

        it("should throw if only one player", () => {
            expect(() => action.verify(player)).toThrow("Cannot post small blind with less than 2 players.");
        });

        it("should return correct range for small blind", () => {
            jest.spyOn(game, "getActivePlayerCount").mockReturnValue(2); // Mocking that there are 2 players
            const range = action.verify(player);
            expect(range).toEqual({
                minAmount: game.smallBlind,
                maxAmount: game.smallBlind
            });
        });

        it("should throw error if not in ANTE round", () => {
            // Override the current round mock to be FLOP instead of ANTE
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.FLOP);

            expect(() => action.verify(player)).toThrow("post-small-blind can only be performed during ante round.");
        });
    });

    describe("getDeductAmount", () => {
        it("should return small blind amount", () => {
            const amount = action.getDeductAmount();
            expect(amount).toBe(game.smallBlind);
        });
    });

    describe("execute", () => {
        beforeEach(() => {
            // Mock player as the next player to act
            const mockNextPlayer = {
                address: "0x980b8D8A16f5891F41871d878a479d81Da52334c"
            };
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(mockNextPlayer as Player);

            // Mock current round
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

            // Mock player status
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        });

        it("should deduct small blind amount from player chips", () => {
            const initialChips = player.chips;
            action.execute(player, 0, game.smallBlind);
            expect(player.chips).toBe(initialChips - game.smallBlind);
        });
    });
});
