import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import BigBlindAction from "./bigBlindAction";
import TexasHoldemGame from "../texasHoldem";
import { getDefaultGame, ONE_THOUSAND_TOKENS, TWO_TOKENS } from "../testConstants";
import { IUpdate } from "../types";

describe("BigBlindAction", () => {
    let game: TexasHoldemGame;
    let updateMock: IUpdate;
    let action: BigBlindAction;
    let player: Player;

    beforeEach(() => {
        // Setup initial game state
        const playerStates = new Map<number, Player | null>();
        const initialPlayer = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            ONE_THOUSAND_TOKENS, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
        playerStates.set(0, initialPlayer);

        game = getDefaultGame(playerStates);
        updateMock = {
            addAction: jest.fn(_action => { })
        };

        action = new BigBlindAction(game, updateMock);
        player = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            ONE_THOUSAND_TOKENS, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
    });

    describe("type", () => {
        it("should return BIG_BLIND action type", () => {
            const type = action.type;
            expect(type).toBe(PlayerActionType.BIG_BLIND);
        });
    });

    describe("verify", () => {
        beforeEach(() => {
            // Mock player as the next player to act
            const mockNextPlayer = {
                address: "0x980b8D8A16f5891F41871d878a479d81Da52334c"
            };

            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(mockNextPlayer as Player);
            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(2);

            // Mock current round
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

            // Mock player status
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            // Mock smallBlindPosition
            Object.defineProperty(game, "smallBlindPosition", {
                get: jest.fn(() => 1)
            });

            // Mock bigBlindPosition
            Object.defineProperty(game, "bigBlindPosition", {
                get: jest.fn(() => 2)
            });

            // Mock getPlayerSeatNumber
            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(0);
        });

        it("should return correct range for big blind", () => {
            // Mock that small blind has been posted and player is in correct position
            jest.spyOn(game, "getActionsForRound").mockReturnValue([
                { playerId: "0x123", action: PlayerActionType.SMALL_BLIND, amount: TWO_TOKENS, index: 0, seat: 1, timestamp: Date.now() }
            ]);
            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(2); // Big blind position
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            const range = action.verify(player);
            expect(range).toEqual({
                minAmount: game.bigBlind,
                maxAmount: game.bigBlind
            });
        });

        it("should throw error if not in ANTE round", () => {
            // Override the current round mock to be FLOP instead of PREFLOP
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.FLOP);

            expect(() => action.verify(player)).toThrow("post-big-blind can only be performed during ante round.");
        });

        it("should throw error if player is not in small blind position", () => {
            // Mock player in a different position than small blind
            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(1);

            expect(() => action.verify(player)).toThrow("Only the big blind player can post the big blind.");
        });
    });

    describe("getDeductAmount", () => {
        it("should return big blind amount", () => {
            const amount = action.getDeductAmount();
            expect(amount).toBe(game.bigBlind);
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

            jest.spyOn(game, "getActionsForRound").mockReturnValue([
                {
                    playerId: "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac",
                    amount: 50000000000000000000n,
                    action: PlayerActionType.SMALL_BLIND,
                    index: 0,
                    seat: 2,
                    timestamp: Date.now()
                }
            ]);

            // Mock player status
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(1);

            // Mock smallBlindPosition
            Object.defineProperty(game, "smallBlindPosition", {
                get: jest.fn(() => 1)
            });

            // Mock getPlayerSeatNumber
            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(2);
        });

        it("should deduct big blind amount from player chips", () => {
            const initialChips = player.chips;
            action.execute(player, 0, TWO_TOKENS);
            expect(player.chips).toBe(initialChips - game.bigBlind);
        });
    });
});
