import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";
import CheckAction from "./checkAction";
import TexasHoldemGame from "../texasHoldem";
import { getDefaultGame, ONE_THOUSAND_TOKENS } from "../testConstants";
import { IUpdate } from "../types";

describe("CheckAction", () => {
    let game: TexasHoldemGame;
    let updateMock: IUpdate;
    let action: CheckAction;
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
            addAction: jest.fn(action => {
                console.log("Action recorded:", action);
                console.log("Pot will be updated with this amount");
            })
        };

        action = new CheckAction(game, updateMock);
        player = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            1000000000000000000n, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );
    });

    describe("type", () => {
        it("should return CHECK action type", () => {
            expect(action.type).toBe(PlayerActionType.CHECK);
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
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

            // Mock player status
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            // Mock game's current bet or pot to ensure check is valid
            // This would typically check if the player has already matched the current bet
            Object.defineProperty(game, "currentBet", {
                get: jest.fn(() => 0n)
            });

            // Mock getBets to return player's current bet
            jest.spyOn(game, "getBets").mockReturnValue(new Map([["0x980b8D8A16f5891F41871d878a479d81Da52334c", 0n]]));
        });

        it("should return a range for check action", () => {
            // this should throw an error if the player has not matched the current bet
            const range = action.verify(player);
            expect(range).toBeDefined();
            expect(range).toEqual({ minAmount: 0n, maxAmount: 0n });
        });

        it("should throw error if it's not player's turn", () => {
            // Mock a different player as next to act
            const differentPlayer = new Player(
                "0x1234567890abcdef1234567890abcdef12345678", // Different address
                undefined,
                ONE_THOUSAND_TOKENS,
                undefined,
                PlayerStatus.ACTIVE
            );
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(differentPlayer);

            expect(() => action.verify(player)).toThrow("Must be currently active player.");
        });

        it("should throw error if player is not active", () => {
            // Mock player status as FOLDED
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.FOLDED);

            expect(() => action.verify(player)).toThrow("Only active player can check.");
        });

        it("should throw error if game is in ante", () => {
            // Mock game in showdown state
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

            expect(() => action.verify(player)).toThrow("Cannot check in the ante round.");
        });

        it("should throw error if game is in showdown", () => {
            // Mock game in showdown state
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.SHOWDOWN);

            expect(() => action.verify(player)).toThrow("Cannot check in the showdown round.");
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
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

            // Mock player status
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);

            // Mock verify to return undefined (no range)
            jest.spyOn(action, "verify").mockReturnValue({ minAmount: 0n, maxAmount: 0n });

            // Mock game's addAction method
            game.addAction = jest.fn();
        });

        it("should not change player's chips", () => {
            const initialChips = player.chips;
            action.execute(player, 0, 0n);
            expect(player.chips).toBe(initialChips);
        });

        it("should add CHECK action with 0 amount", () => {
            action.execute(player, 0, 0n);

            expect(game.addAction).toHaveBeenCalledWith(
                {
                    playerId: player.address,
                    action: PlayerActionType.CHECK,
                    amount: 0n,
                    index: 0
                },
                TexasHoldemRound.PREFLOP
            );
        });

        it("should throw error if an amount is specified", () => {
            expect(() => action.execute(player, 0, 10000000000000000n)).toThrow("Check amount must be zero.");
        });
    });
});
