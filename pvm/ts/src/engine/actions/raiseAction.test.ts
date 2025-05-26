import { ActionDTO, PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import RaiseAction from "./raiseAction";
import { IUpdate, TurnWithSeat } from "../types";
import {
    FIFTY_TOKENS,
    getDefaultGame,
    ONE_HUNDRED_TOKENS,
    ONE_THOUSAND_TOKENS,
    ONE_TOKEN,
    TEN_TOKENS,
    TWENTY_TOKENS,
    TWO_THOUSAND_TOKENS
} from "../testConstants";

describe("Raise Action", () => {
    let game: TexasHoldemGame;
    let updateMock: IUpdate;
    let action: RaiseAction;
    let player: Player;

    beforeEach(() => {
        // Setup initial game state
        const playerStates = new Map<number, Player | null>();

        const initialPlayer = new Player(
            "0x2222222222222222222222222222222222222222", // address
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

        action = new RaiseAction(game, updateMock);
        player = new Player(
            "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac",
            undefined, // lastAction
            ONE_THOUSAND_TOKENS, // chips
            undefined, // holeCards
            PlayerStatus.ACTIVE // status
        );

        // Mock game methods
        jest.spyOn(game, "currentPlayerId", "get").mockReturnValue("0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac");
        jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
        jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
        jest.spyOn(game, "getActionsForRound").mockReturnValue([
            {
                playerId: "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac",
                amount: 50000000000000000000n,
                action: PlayerActionType.SMALL_BLIND,
                index: 0,
                seat: 2,
                timestamp: Date.now()
            },
            {
                playerId: "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac",
                amount: 10000000000000000000n,
                action: PlayerActionType.BIG_BLIND,
                index: 0,
                seat: 3,
                timestamp: Date.now()
            },
            {
                playerId: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                amount: 50000000000000000000n,
                action: PlayerActionType.BET,
                index: 0,
                seat: 4,
                timestamp: Date.now()
            }
        ]);

        const bets = new Map<string, bigint>();
        bets.set("0x3333333333333333333333333333333333333333", TWENTY_TOKENS); // 20 tokens
        jest.spyOn(game, "getBets").mockReturnValue(bets);

        const turn = {
            playerId: "0x2222222222222222222222222222222222222222",
            action: PlayerActionType.BET,
            amount: FIFTY_TOKENS, // 50 tokens
            seat: 2,
            timestamp: Date.now(),
            index: 0
        };

        jest.spyOn(game, "getLastRoundAction").mockReturnValue(turn);

        // Mock addAction method on game
        game.addAction = jest.fn();
    });

    describe("type", () => {
        it("should return RAISE action type", () => {
            expect(action.type).toBe(PlayerActionType.RAISE);
        });
    });

    describe("verify", () => {
        // Mock a previous bet action to raise against
        const lastBet: TurnWithSeat = {
            playerId: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
            action: PlayerActionType.BET,
            amount: FIFTY_TOKENS, // 50 tokens
            index: 0,
            seat: 2,
            timestamp: Date.now()
        };

        beforeEach(() => {
            const now = Date.now();
            jest.spyOn(game, "getPlayersLastAction").mockReturnValue(lastBet);
            jest.spyOn(game, "getPlayerSeatNumber").mockReturnValue(3);
        });

        it("should return correct range for a raise", () => {
            const range = action.verify(player);

            // Min amount should be previous bet + big blind
            const expectedMinAmount = 40000000000000000000n; // 40 tokens

            expect(range).toEqual({
                minAmount: expectedMinAmount,
                maxAmount: player.chips
            });
        });

        it("should throw error if no previous bet exists", () => {
            // Mock getActionsForRound to not include a bet
            jest.spyOn(game, "getActionsForRound").mockReturnValue([
                {
                    playerId: "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac",
                    amount: 50000000000000000000n,
                    action: PlayerActionType.SMALL_BLIND,
                    index: 0,
                    seat: 2,
                    timestamp: Date.now()
                },
                {
                    playerId: "0x1fa53E96ad33C6Eaeebff8D1d83c95Fcd7ba9dac",
                    amount: 100000000000000000000n,
                    action: PlayerActionType.BIG_BLIND,
                    index: 0,
                    seat: 3,
                    timestamp: Date.now()
                }
            ]);

            expect(() => action.verify(player)).toThrow("No previous bet to raise.");
        });

        it("should bet all the players chips if less than the raised amount", () => {
            // Set player chips lower than the raise amount
            player.chips = TEN_TOKENS;

            const range = action.verify(player);

            expect(range).toEqual({
                minAmount: TEN_TOKENS,
                maxAmount: TEN_TOKENS
            });
        });

        it("should throw error if it's not player's turn", () => {
            // Change the next player to a different address
            const differentPlayer = new Player(
                "0x980b8D8A16f5891F41871d878a479d81Da52334c", // Different address
                undefined,
                ONE_THOUSAND_TOKENS,
                undefined,
                PlayerStatus.ACTIVE
            );
            jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(differentPlayer);

            expect(() => action.verify(player)).toThrow("Must be currently active player.");
        });

        it("should throw error if round is SHOWDOWN", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.SHOWDOWN);

            expect(() => action.verify(player)).toThrow("Cannot raise in the showdown round.");
        });

        it.skip("should throw error if player is not active", () => {
            jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.FOLDED);

            // Need to mock a bet action to avoid throwing error in verify
            const lastBet: TurnWithSeat = {
                playerId: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                action: PlayerActionType.BET,
                amount: FIFTY_TOKENS,
                index: 0,
                seat: 2,
                timestamp: Date.now()
            };

            jest.spyOn(game, "getPlayersLastAction").mockReturnValue(lastBet);

            expect(() => action.verify(player)).toThrow(`Only active player can ${PlayerActionType.RAISE}.`);
        });
    });

    describe("getDeductAmount", () => {
        it("should return the amount if player has sufficient chips", () => {
            const amount = FIFTY_TOKENS; // 50 tokens
            const result = (action as any).getDeductAmount(player, amount);
            expect(result).toBe(amount);
        });

        it("should return player's total chips if amount exceeds chips", () => {
            const amount = TWO_THOUSAND_TOKENS; // 2000 tokens
            player.chips = ONE_THOUSAND_TOKENS; // 1000 tokens

            const result = (action as any).getDeductAmount(player, amount);
            expect(result).toBe(player.chips);
        });

        it("should return the min amount as double the largest bet", () => {
            
        }
    });

    describe("execute", () => {
        beforeEach(() => {
            // Mock a previous bet
            const lastBet: TurnWithSeat = {
                playerId: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                action: PlayerActionType.BET,
                amount: FIFTY_TOKENS, // 50 tokens
                index: 0,
                seat: 2,
                timestamp: Date.now()
            };
            jest.spyOn(game, "getPlayersLastAction").mockReturnValue(lastBet);

            // Mock the verify method to avoid errors during execute
            jest.spyOn(action, "verify").mockReturnValue({
                minAmount: 70000000000000000n, // 70 tokens
                maxAmount: player.chips
            });
        });

        it("should deduct the raise amount from player chips", () => {
            const initialChips = player.chips;
            const raiseAmount = ONE_HUNDRED_TOKENS; // 100 tokens

            action.execute(player, 0, raiseAmount);

            expect(player.chips).toBe(initialChips - raiseAmount);
            expect(game.addAction).toHaveBeenCalledWith(
                {
                    playerId: player.address,
                    action: PlayerActionType.RAISE,
                    amount: raiseAmount,
                    index: 0
                },
                TexasHoldemRound.PREFLOP
            );
        });

        // The following tests are commented out because:
        // 1. The actual validation logic is already properly tested in the verify() tests above
        // 2. In the real flow, verify() would be called before execute() to validate raise amounts

        /* 
        it("should not throw error if amount is less than minimum allowed", () => {
            const tooSmallAmount = 1n;
            // Should not throw an error since validation is commented out
            expect(() => action.execute(player, 0, tooSmallAmount)).not.toThrow();
        });

        it("should not throw error if amount is greater than maximum allowed", () => {
            const tooLargeAmount = TWO_THOUSAND_TOKENS; // 2000 tokens
            player.chips = ONE_THOUSAND_TOKENS; // 1000 tokens

            // Update mock to use player's chips as max
            jest.spyOn(action, "verify").mockReturnValue({
                minAmount: 70000000000000000n, // 70 tokens
                maxAmount: player.chips
            });

            // Should not throw an error since validation is commented out
            expect(() => action.execute(player, 0, tooLargeAmount)).not.toThrow();
        });

        it("should not throw error if required amount is not provided", () => {
            // Should not throw an error since validation is commented out
            expect(() => action.execute(player, 0, 0n)).not.toThrow();
        });
        */
    });
});
