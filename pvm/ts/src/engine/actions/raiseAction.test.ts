import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import { Player } from "../../models/player";
import TexasHoldemGame from "../texasHoldem";
import RaiseAction from "./raiseAction";
import { IUpdate } from "../types";
import { FIVE_TOKENS, getDefaultGame, ONE_THOUSAND_TOKENS, ONE_TOKEN, TWO_TOKENS } from "../testConstants";

// Player address constants
const PLAYER_1_ADDRESS = "0x1111111111111111111111111111111111111111"; // Small Blind
const PLAYER_2_ADDRESS = "0x2222222222222222222222222222222222222222"; // Big Blind
const PLAYER_3_ADDRESS = "0x3333333333333333333333333333333333333333"; // Bettor

describe("Raise Action", () => {
    let game: TexasHoldemGame;
    let updateMock: IUpdate;
    let action: RaiseAction;
    let player1: Player; // Small blind player who wants to raise
    let player2: Player; // Big blind player
    let player3: Player; // Player who made the bet

    const SEVEN_TOKENS = 700000000000000000n;
    const THREE_TOKENS = 300000000000000000n;

    beforeEach(() => {
        // Reset game state before each test
        jest.clearAllMocks();

        // Setup initial game state with 3 players
        const playerStates = new Map<number, Player | null>();

        player1 = new Player(PLAYER_1_ADDRESS, undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE);
        player2 = new Player(PLAYER_2_ADDRESS, undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE);
        player3 = new Player(PLAYER_3_ADDRESS, undefined, ONE_THOUSAND_TOKENS, undefined, PlayerStatus.ACTIVE);

        playerStates.set(1, player1); // Seat 1 - Small Blind
        playerStates.set(2, player2); // Seat 2 - Big Blind
        playerStates.set(3, player3); // Seat 3 - Bettor

        game = getDefaultGame(playerStates);

        updateMock = {
            addAction: jest.fn()
        };

        action = new RaiseAction(game, updateMock);

        //     // Mock game methods
        //     jest.spyOn(game, "currentPlayerId", "get").mockReturnValue(PLAYER_1_ADDRESS);
        //     jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
        //     jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        //     jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player1);
        //     jest.spyOn(game, "smallBlindPosition", "get").mockReturnValue(1);
        //     jest.spyOn(game, "bigBlindPosition", "get").mockReturnValue(2);
        //     jest.spyOn(game, "bigBlind", "get").mockReturnValue(TWO_TOKENS);

        //     // Mock findActivePlayers to return all 3 players
        //     jest.spyOn(game, "findActivePlayers").mockReturnValue([player1, player2, player3]);

        //     // Mock addAction method on game
        //     game.addAction = jest.fn();
    });

    describe("type", () => {
        it("should return RAISE action type", () => {
            expect(action.type).toBe(PlayerActionType.RAISE);
        });
    });

    describe("verify", () => {
        describe("PREFLOP scenarios", () => {
            // beforeEach(() => {
            //     jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);

            //     // // Mock player total bets for PREFLOP scenario:
            //     // // Player 1: 1 token (small blind)
            //     // // Player 2: 2 tokens (big blind)
            //     // // Player 3: 5 tokens (bet 3 more after big blind)
            //     // jest.spyOn(game, "getPlayerTotalBets").mockImplementation((address, round, includeBlinds) => {
            //     //     if (address === PLAYER_1_ADDRESS) return ONE_TOKEN; // Small blind only
            //     //     if (address === PLAYER_2_ADDRESS) return TWO_TOKENS; // Big blind only
            //     //     if (address === PLAYER_3_ADDRESS) return FIVE_TOKENS; // Big blind + 3 token bet
            //     //     return 0n;
            //     // });
            // });

            // it.skip("should return correct range for a raise in PREFLOP", () => {
            //     const range = action.verify(player1); // Player 1 wants to raise

            //     // Player 3 has largest bet (5 tokens)
            //     // Minimum raise = 5 + 2 (big blind) = 7 tokens total
            //     // Player 1 currently has 1 token, so needs 6 more
            //     const expectedMinAmount = FIVE_TOKENS + TWO_TOKENS; // 7 tokens total
            //     const expectedMaxAmount = ONE_TOKEN + player1.chips; // Current bet + all chips

            //     expect(range).toEqual({
            //         minAmount: expectedMinAmount,
            //         maxAmount: expectedMaxAmount
            //     });
            // });

            // should throw error if player has largest bet (can't raise yourself)
            it("should throw if you're not the active player", () => {
                // Mock so player1 has the largest bet
                // jest.spyOn(game, "getPlayerTotalBets").mockImplementation(address => {
                //     if (address === PLAYER_1_ADDRESS) return ONE_TOKEN; // Small blind
                //     if (address === PLAYER_2_ADDRESS) return TWO_TOKENS; // Big blind
                //     if (address === PLAYER_3_ADDRESS) return FIVE_TOKENS; // Smaller bet
                //     return 0n;
                // });

                jest.spyOn(game, "getActionsForRound").mockImplementation(() => {
                    // Return blind actions for ANTE round
                    return [
                        {
                            index: 1,
                            playerId: PLAYER_1_ADDRESS,
                            seat: 1,
                            action: PlayerActionType.SMALL_BLIND,
                            amount: ONE_TOKEN,
                            timestamp: 0
                        },
                        {
                            index: 2,
                            playerId: PLAYER_2_ADDRESS,
                            seat: 2,
                            action: PlayerActionType.BIG_BLIND,
                            amount: TWO_TOKENS,
                            timestamp: 0
                        }
                    ];
                });

                expect(() => action.verify(player2)).toThrow("Must be currently active player.");
            });
        });

        it("should have correct three bet range", () => {
            jest.spyOn(game, "getActionsForRound").mockImplementation(round => {
                if (round === TexasHoldemRound.ANTE) {
                    // Return blind actions for ANTE round
                    return [
                        {
                            index: 1,
                            playerId: PLAYER_1_ADDRESS,
                            seat: 1,
                            action: PlayerActionType.SMALL_BLIND,
                            amount: ONE_TOKEN,
                            timestamp: 0
                        },
                        {
                            index: 2,
                            playerId: PLAYER_2_ADDRESS,
                            seat: 2,
                            action: PlayerActionType.BIG_BLIND,
                            amount: TWO_TOKENS,
                            timestamp: 0
                        }
                    ];
                } else {
                    // Return betting actions for other rounds (PREFLOP, FLOP, etc.)
                    return [
                        {
                            index: 3,
                            playerId: PLAYER_1_ADDRESS,
                            seat: 1,
                            action: PlayerActionType.RAISE,
                            amount: THREE_TOKENS, // Player 1 raised 3 tokens
                            timestamp: 0
                        },
                        {
                            index: 4,
                            playerId: PLAYER_2_ADDRESS,
                            seat: 2,
                            action: PlayerActionType.CALL,
                            amount: TWO_TOKENS, // Player calls 2 tokens
                            timestamp: 0
                        }
                    ];
                }
            });

            const EIGHT_TOKENS = 800000000000000000n; // 8 tokens total
            const range = action.verify(player1);
            expect(range.minAmount).toBe(EIGHT_TOKENS); // Should not allow raise
        });

        it("should have correct four bet range", () => {
            jest.spyOn(game, "getActionsForRound").mockImplementation(round => {
                if (round === TexasHoldemRound.ANTE) {
                    // Return blind actions for ANTE round
                    return [
                        {
                            index: 1,
                            playerId: PLAYER_1_ADDRESS,
                            seat: 1,
                            action: PlayerActionType.SMALL_BLIND,
                            amount: ONE_TOKEN,
                            timestamp: 0
                        },
                        {
                            index: 2,
                            playerId: PLAYER_2_ADDRESS,
                            seat: 2,
                            action: PlayerActionType.BIG_BLIND,
                            amount: TWO_TOKENS,
                            timestamp: 0
                        }
                    ];
                } else {
                    // Return betting actions for other rounds (PREFLOP, FLOP, etc.)
                    return [
                        {
                            index: 3,
                            playerId: PLAYER_1_ADDRESS,
                            seat: 1,
                            action: PlayerActionType.RAISE,
                            amount: THREE_TOKENS, // Player 1 raised to 3 tokens (1 small blind + 2 more)
                            timestamp: 0
                        },
                        {
                            index: 4,
                            playerId: PLAYER_2_ADDRESS,
                            seat: 2,
                            action: PlayerActionType.RAISE,
                            amount: FIVE_TOKENS, // Player bet 5 tokens
                            timestamp: 0
                        }
                    ];
                }
            });

            const TEN_TOKENS = 1000000000000000000n; // 10 tokens total
            const range = action.verify(player1);
            expect(range.minAmount).toBe(TEN_TOKENS);
        });

        it("should handle all-in scenario when player has insufficient chips", () => {
            // Set player chips lower than minimum raise requirement
            player1.chips = TWO_TOKENS; // Only 2 tokens left

            jest.spyOn(game, "getActionsForRound").mockImplementation(() => {
                // Return blind actions for ANTE round
                return [
                    {
                        index: 1,
                        playerId: PLAYER_1_ADDRESS,
                        seat: 1,
                        action: PlayerActionType.SMALL_BLIND,
                        amount: ONE_TOKEN,
                        timestamp: 0
                    },
                    {
                        index: 2,
                        playerId: PLAYER_2_ADDRESS,
                        seat: 2,
                        action: PlayerActionType.BIG_BLIND,
                        amount: TWO_TOKENS,
                        timestamp: 0
                    }
                ];
            });

            const range = action.verify(player1);

            // Player can only go all-in: current bet (1) + remaining chips (2) = 3 total
            expect(range).toEqual({
                minAmount: TWO_TOKENS, // 2 tokens total
                maxAmount: TWO_TOKENS // Same for all-in
            });
        });
    });

    // describe("POST-FLOP scenarios", () => {
    //     beforeEach(() => {
    //         jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.FLOP);

    //         // Mock player total bets for FLOP scenario (no blinds included):
    //         // Player 1: 0 tokens (checked)
    //         // Player 2: 0 tokens (checked)
    //         // Player 3: 5 tokens (bet 5)
    //         jest.spyOn(game, "getPlayerTotalBets").mockImplementation((address, round, includeBlinds) => {
    //             if (address === PLAYER_1_ADDRESS) return 0n; // Checked
    //             if (address === PLAYER_2_ADDRESS) return 0n; // Checked
    //             if (address === PLAYER_3_ADDRESS) return FIVE_TOKENS; // Bet 5
    //             return 0n;
    //         });

    //         const mockBet: TurnWithSeat = {
    //             index: 2, // Assuming player 3 is next to act
    //             playerId: PLAYER_3_ADDRESS,
    //             seat: 1,
    //             action: PlayerActionType.BET,
    //             amount: FIVE_TOKENS, // Bet 5 tokens
    //             timestamp: 0
    //         };

    //         // jest.spyOn(game, "getActionsForRound").mockReturnValue([
    //         //     mockBet
    //         // ]);
    //     });

    //     it("should return correct range for a raise in FLOP", () => {
    //         const range = action.verify(player1);

    //         // Player 3 has largest bet (5 tokens)
    //         // Minimum raise = 5 + 2 (big blind) = 7 tokens total
    //         // Player 1 currently has 0, so needs 7 total
    //         const expectedMinAmount = SEVEN_TOKENS; // 7 tokens total
    //         const expectedMaxAmount = 0n + player1.chips; // Current bet (0) + all chips

    //         expect(range).toEqual({
    //             minAmount: expectedMinAmount,
    //             maxAmount: expectedMaxAmount
    //         });
    //     });
    // });

    // describe("Invalid scenarios", () => {
    //     it("should throw error in ANTE round", () => {
    //         jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

    //         expect(() => action.verify(player1)).toThrow("Cannot raise in the ante round. Only small and big blinds are allowed.");
    //     });

    //     it("should throw error in SHOWDOWN round", () => {
    //         jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.SHOWDOWN);

    //         expect(() => action.verify(player1)).toThrow("Cannot raise in the showdown round.");
    //     });

    //     it("should throw error if it's not player's turn", () => {
    //         jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player2); // Different player's turn

    //         expect(() => action.verify(player1)).toThrow("Must be currently active player.");
    //     });
    // });
});

