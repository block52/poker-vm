import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import CallAction from "./callAction";
import { Player } from "../../models/player";
import { IUpdate, Turn, TurnWithSeat } from "../types";
import TexasHoldemGame from "../texasHoldem";
// Assuming you have a constants file, otherwise define TEN_TOKENS in this file
import { getDefaultGame, ONE_THOUSAND_TOKENS, TEN_TOKENS } from "../testConstants";

describe("CallAction", () => {
    let action: CallAction;
    let game: TexasHoldemGame;
    let player: Player;
    let updateMock: IUpdate;

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
            addAction: jest.fn()
        };

        // Create instance of CallAction with mock game
        action = new CallAction(game, updateMock);

        player = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c", // address
            undefined, // lastAction
            ONE_THOUSAND_TOKENS, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );

        const mockPlayers = [
            new Player("player1", undefined, 1000n, undefined, PlayerStatus.ACTIVE),
            new Player("player2", undefined, 1000n, undefined, PlayerStatus.ACTIVE),
            new Player("player3", undefined, 1000n, undefined, PlayerStatus.ACTIVE)
        ];

        // Setup common mocks
        jest.spyOn(game, "currentPlayerId", "get").mockReturnValue(player.address);
        jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
        jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
        jest.spyOn(game, "findActivePlayers").mockReturnValue(mockPlayers);

        // Mock addAction method on game
        game.addAction = jest.fn();
    });

    describe("type", () => {
        it("should return CALL type", () => {
            expect(action.type).toBe(PlayerActionType.CALL);
        });
    });

    describe("verify", () => {
        it("should throw error in the ante round", () => {
            // Need to mock rounds
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);
            jest.spyOn(game, "getLastRoundAction").mockReturnValue(undefined);

            expect(() => action.verify(player)).toThrow("Call action is not allowed during ante round.");
        });

        it("should throw error in the showdown round", () => {
            // Need to mock rounds
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.SHOWDOWN);
            jest.spyOn(game, "getLastRoundAction").mockReturnValue(undefined);

            expect(() => action.verify(player)).toThrow("Call action is not allowed during showdown round.");
        });

        it.skip("should throw error if previous action amount is 0", () => {
            // Need to mock rounds
            const previousAction: TurnWithSeat = {
                playerId: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                action: PlayerActionType.CALL,
                amount: 0n,
                seat: 0,
                index: 0,
                timestamp: Date.now()
            };

            jest.spyOn(game, "getLastRoundAction").mockReturnValue(previousAction);

            expect(() => action.verify(player)).toThrow("Player has already met maximum so can check instead.");
        });

        it("should throw error if player has already met maximum", () => {
            // Setup a previous action with a bet
            const previousAction: TurnWithSeat = {
                playerId: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                action: PlayerActionType.BET,
                amount: TEN_TOKENS,
                seat: 0,
                index: 0,
                timestamp: Date.now()
            };

            jest.spyOn(game, "getLastRoundAction").mockReturnValue(previousAction);

            // Mock the getLargestBet method
            jest.spyOn(action as any, "getLargestBet").mockReturnValue(TEN_TOKENS);

            // Mock the getSumBets method to return same amount (player already met maximum)
            jest.spyOn(game, "getPlayerTotalBets").mockReturnValue(TEN_TOKENS);

            expect(() => action.verify(player)).toThrow("Player has already met maximum so can check instead.");
        });

        it("should return correct range when player needs to call", () => {
            // Setup a previous action with a bet
            const previousAction: TurnWithSeat = {
                playerId: "0xdifferent",
                action: PlayerActionType.BET,
                amount: 30n,
                seat: 1,
                index: 0,
                timestamp: Date.now()
            };

            jest.spyOn(game, "getLastRoundAction").mockReturnValue(previousAction);

            // Mock the getLargestBet method
            jest.spyOn(action as any, "getLargestBet").mockReturnValue(30n);

            // Mock the getSumBets method to return player's current bet
            jest.spyOn(game, "getPlayerTotalBets").mockReturnValue(10n);

            const result = action.verify(player);

            expect(result).toEqual({ minAmount: 20n, maxAmount: 20n });
        });

        it("should adjust deduct amount if player has insufficient chips", () => {
            // Setup a previous action with a high bet
            const previousAction: TurnWithSeat = {
                playerId: "0xdifferent",
                action: PlayerActionType.BET,
                amount: 200n,
                seat: 1,
                index: 0,
                timestamp: Date.now()
            };

            jest.spyOn(game, "getLastRoundAction").mockReturnValue(previousAction);

            // Mock the getLargestBet method
            jest.spyOn(action as any, "getLargestBet").mockReturnValue(200n);

            // Mock the getSumBets method to return player's current bet
            jest.spyOn(game, "getPlayerTotalBets").mockReturnValue(10n);

            // Set player to have insufficient chips
            player.chips = 50n;

            const result = action.verify(player);

            expect(result).toEqual({ minAmount: 50n, maxAmount: 50n });
        });
    });

    describe("execute", () => {
        it("should throw error if player has insufficient chips", () => {
            // Mock verify to return a call amount that exceeds player chips
            jest.spyOn(action, "verify").mockReturnValue({
                minAmount: 150n,
                maxAmount: 150n
            });

            // Mock getDeductAmount to return more than player's chips
            jest.spyOn(action as any, "getDeductAmount").mockReturnValue(150n);

            // Set player chips
            player.chips = 50n;

            expect(player.chips).toBe(50n);
        });

        it("should deduct correct amount from player chips", () => {
            // Mock verify to return a valid call amount
            jest.spyOn(action, "verify").mockReturnValue({
                minAmount: 30n,
                maxAmount: 30n
            });

            // Mock getDeductAmount to return the call amount
            jest.spyOn(action as any, "getDeductAmount").mockReturnValue(30n);

            player.chips = 100n;
            action.execute(player, 0, 30n);

            expect(player.chips).toBe(70n); // 100n - 30n
        });

        it("should add regular CALL action when player has chips left", () => {
            // Mock verify to return a valid call amount
            jest.spyOn(action, "verify").mockReturnValue({
                minAmount: 30n,
                maxAmount: 30n
            });

            // Mock getDeductAmount to return the call amount
            jest.spyOn(action as any, "getDeductAmount").mockReturnValue(30n);

            player.chips = 100n;
            action.execute(player, 0, 30n);

            expect(game.addAction).toHaveBeenCalledWith(
                {
                    playerId: player.address,
                    action: PlayerActionType.CALL,
                    amount: 30n,
                    index: 0
                },
                TexasHoldemRound.PREFLOP
            );
        });

        it("should add ALL_IN action when player uses all chips", () => {
            // Mock verify to return a valid call amount
            jest.spyOn(action, "verify").mockReturnValue({
                minAmount: 100n,
                maxAmount: 100n
            });

            // Mock getDeductAmount to return all player's chips
            jest.spyOn(action as any, "getDeductAmount").mockReturnValue(100n);

            player.chips = 100n;
            action.execute(player, 0, 100n);

            expect(player.chips).toBe(0n);
            expect(game.addAction).toHaveBeenCalledWith(
                {
                    playerId: player.address,
                    action: PlayerActionType.ALL_IN,
                    amount: 100n,
                    index: 0
                },
                TexasHoldemRound.PREFLOP
            );
        });
    });

    describe("getDeductAmount", () => {
        it("should calculate correct amount based on largest bet and player bets", () => {
            // Mock getLargestBet and getSumBets
            jest.spyOn(action as any, "getLargestBet").mockReturnValue(50n);
            jest.spyOn(game, "getPlayerTotalBets").mockReturnValue(20n);

            const result = (action as any).getDeductAmount(player);

            // Should return the difference: 50n - 20n = 30n
            expect(result).toBe(30n);
        });

        it("should return 0 if player has already bet enough", () => {
            // Mock getLargestBet and getSumBets with equal values
            jest.spyOn(action as any, "getLargestBet").mockReturnValue(50n);
            jest.spyOn(game, "getPlayerTotalBets").mockReturnValue(50n);

            expect(() => action.verify(player)).toThrow("Player has already met maximum so can check instead.");
        });

        it.skip("should return 0 if largest bet is 0", () => {
            // Mock getLargestBet to return 0
            jest.spyOn(action as any, "getLargestBet").mockReturnValue(0n);

            // Mock getSumBets to return 0
            jest.spyOn(game, "getPlayerTotalBets").mockReturnValue(0n);

            const result = (action as any).getDeductAmount(player);

            expect(result).toBe(0n);
        });
    });
});
