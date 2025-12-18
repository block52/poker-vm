import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
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
    });

    describe("type", () => {
        it("should return RAISE action type", () => {
            expect(action.type).toBe(PlayerActionType.RAISE);
        });
    });

    describe("verify", () => {
        describe("PREFLOP scenarios", () => {
            // should throw error if player has largest bet (can't raise yourself)
            it("should throw if you're not the active player", () => {
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
            const THREE_TOKENS = 300000000000000000n; // 3 tokens
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

            const TWO_TOKENS_ADDITIONAL = 200000000000000000n; // 2 additional tokens needed  
            const range = action.verify(player1);

            // Player 1 has bet 4 tokens total, needs 2 additional to raise to 6 total
            expect(range.minAmount).toBe(TWO_TOKENS_ADDITIONAL);
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

            const SIX_TOKENS_ADDITIONAL = 600000000000000000n; // 6 additional tokens needed
            const range = action.verify(player1);

            // Player 1 has bet 4 tokens total, needs 6 additional to raise to 10 total  
            expect(range.minAmount).toBe(SIX_TOKENS_ADDITIONAL);
        });

        it("should throw error when player has insufficient chips for minimum raise (must use all-in)", () => {
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

            // Player can't afford minimum raise, must use all-in instead
            expect(() => action.verify(player1)).toThrow("Insufficient chips for minimum raise - use all-in instead.");
        });

        describe("PREFLOP scenarios", () => {
            it("should throw if you're not the active player", () => {
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
    });
});