import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
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
    TWO_TOKENS,
    TWENTY_TOKENS,
    TWO_THOUSAND_TOKENS,
    FIVE_TOKENS,
    TEN_TOKENS
} from "../testConstants";

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

    beforeEach(() => {
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

        // Mock game methods
        jest.spyOn(game, "currentPlayerId", "get").mockReturnValue(PLAYER_1_ADDRESS);
        jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
        jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player1);
        jest.spyOn(game, "smallBlindPosition", "get").mockReturnValue(1);
        jest.spyOn(game, "bigBlindPosition", "get").mockReturnValue(2);
        jest.spyOn(game, "bigBlind", "get").mockReturnValue(TWO_TOKENS);

        // Mock findActivePlayers to return all 3 players
        jest.spyOn(game, "findActivePlayers").mockReturnValue([player1, player2, player3]);

        // Mock addAction method on game
        game.addAction = jest.fn();
    });

    describe("type", () => {
        it("should return RAISE action type", () => {
            expect(action.type).toBe(PlayerActionType.RAISE);
        });
    });

    describe("verify", () => {
        describe("PREFLOP scenarios", () => {
            beforeEach(() => {
                jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
                
                // Mock player total bets for PREFLOP scenario:
                // Player 1: 1 token (small blind)
                // Player 2: 2 tokens (big blind) 
                // Player 3: 5 tokens (bet 3 more after big blind)
                jest.spyOn(game, "getPlayerTotalBets").mockImplementation((address, round, includeBlinds) => {
                    if (address === PLAYER_1_ADDRESS) return ONE_TOKEN;      // Small blind only
                    if (address === PLAYER_2_ADDRESS) return TWO_TOKENS;     // Big blind only
                    if (address === PLAYER_3_ADDRESS) return FIVE_TOKENS;    // Big blind + 3 token bet
                    return 0n;
                });
            });

            it("should return correct range for a raise in PREFLOP", () => {
                const range = action.verify(player1); // Player 1 wants to raise

                // Player 3 has largest bet (5 tokens)
                // Minimum raise = 5 + 2 (big blind) = 7 tokens total
                // Player 1 currently has 1 token, so needs 6 more
                const expectedMinAmount = FIVE_TOKENS + TWO_TOKENS; // 7 tokens total
                const expectedMaxAmount = ONE_TOKEN + player1.chips; // Current bet + all chips

                expect(range).toEqual({
                    minAmount: expectedMinAmount,
                    maxAmount: expectedMaxAmount
                });
            });

            it("should throw error if player has largest bet (can't raise yourself)", () => {
                // Mock so player1 has the largest bet
                jest.spyOn(game, "getPlayerTotalBets").mockImplementation((address) => {
                    if (address === PLAYER_1_ADDRESS) return TEN_TOKENS;     // Largest bet
                    if (address === PLAYER_2_ADDRESS) return TWO_TOKENS;     // Big blind
                    if (address === PLAYER_3_ADDRESS) return FIVE_TOKENS;    // Smaller bet
                    return 0n;
                });

                expect(() => action.verify(player1)).toThrow("Cannot raise - you already have the largest bet.");
            });

            it("should handle all-in scenario when player has insufficient chips", () => {
                // Set player chips lower than minimum raise requirement
                player1.chips = TWO_TOKENS; // Only 2 tokens left

                const range = action.verify(player1);

                // Player can only go all-in: current bet (1) + remaining chips (2) = 3 total
                expect(range).toEqual({
                    minAmount: ONE_TOKEN + TWO_TOKENS, // 3 tokens total
                    maxAmount: ONE_TOKEN + TWO_TOKENS  // Same for all-in
                });
            });
        });

        describe("POST-FLOP scenarios", () => {
            beforeEach(() => {
                jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.FLOP);
                
                // Mock player total bets for FLOP scenario (no blinds included):
                // Player 1: 0 tokens (checked)
                // Player 2: 0 tokens (checked)
                // Player 3: 5 tokens (bet 5)
                jest.spyOn(game, "getPlayerTotalBets").mockImplementation((address, round, includeBlinds) => {
                    if (address === PLAYER_1_ADDRESS) return 0n;           // Checked
                    if (address === PLAYER_2_ADDRESS) return 0n;           // Checked  
                    if (address === PLAYER_3_ADDRESS) return FIVE_TOKENS;  // Bet 5
                    return 0n;
                });
            });

            it("should return correct range for a raise in FLOP", () => {
                const range = action.verify(player1);

                // Player 3 has largest bet (5 tokens)
                // Minimum raise = 5 + 2 (big blind) = 7 tokens total
                // Player 1 currently has 0, so needs 7 total
                const expectedMinAmount = FIVE_TOKENS + TWO_TOKENS; // 7 tokens total
                const expectedMaxAmount = 0n + player1.chips; // Current bet (0) + all chips

                expect(range).toEqual({
                    minAmount: expectedMinAmount,
                    maxAmount: expectedMaxAmount
                });
            });
        });

        describe("Invalid scenarios", () => {
            it("should throw error in ANTE round", () => {
                jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

                expect(() => action.verify(player1)).toThrow("Cannot raise in the ante round. Only small and big blinds are allowed.");
            });

            it("should throw error in SHOWDOWN round", () => {
                jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.SHOWDOWN);

                expect(() => action.verify(player1)).toThrow("Cannot raise in the showdown round.");
            });

            it("should throw error if it's not player's turn", () => {
                jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player2); // Different player's turn

                expect(() => action.verify(player1)).toThrow("Must be currently active player.");
            });
        });
    });

    describe("getDeductAmount", () => {
        beforeEach(() => {
            // Mock current bets for deduction calculation
            jest.spyOn(game, "getPlayerTotalBets").mockReturnValue(ONE_TOKEN); // Player has 1 token currently
        });

        it("should return the delta amount if player has sufficient chips", () => {
            const totalAmount = FIFTY_TOKENS; // Player wants to have 50 tokens total
            const result = (action as any).getDeductAmount(player1, totalAmount);
            
            // Should deduct: 50 - 1 (current) = 49 tokens
            expect(result).toBe(FIFTY_TOKENS - ONE_TOKEN);
        });

        it("should return player's total chips if delta exceeds chips", () => {
            const totalAmount = TWO_THOUSAND_TOKENS; // Want 2000 tokens total
            player1.chips = ONE_HUNDRED_TOKENS; // Only have 100 chips left
            
            // Delta would be 2000 - 1 = 1999, but player only has 100 chips
            const result = (action as any).getDeductAmount(player1, totalAmount);
            expect(result).toBe(player1.chips); // Should return all remaining chips
        });
    });
});
