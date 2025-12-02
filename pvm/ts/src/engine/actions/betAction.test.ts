import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@bitcoinbrisbane/block52";
import BetAction from "./betAction";
import { Player } from "../../models/player";
import { IUpdate } from "../types";
import TexasHoldemGame from "../texasHoldem";
import { BetManager } from "../managers/betManager";
import { getDefaultGame, ONE_THOUSAND_TOKENS, PLAYER_1_ADDRESS, PLAYER_2_ADDRESS } from "../testConstants";
import { MockBetManager } from "../testConstants";

describe("BetAction", () => {
    let action: BetAction;
    let game: TexasHoldemGame;
    let player: Player;
    let updateMock: IUpdate;
    let mockBetManager: MockBetManager;

    beforeEach(() => {
        // Setup initial game state
        const playerStates = new Map<number, Player | null>();
        const initialPlayer = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        );
        playerStates.set(0, initialPlayer);

        game = getDefaultGame(playerStates);
        updateMock = {
            addAction: jest.fn()
        };

        // Create mock BetManager
        mockBetManager = new MockBetManager();

        // Mock the BetManager methods
        jest.spyOn(BetManager.prototype, 'current').mockImplementation(() => mockBetManager.current());
        jest.spyOn(BetManager.prototype, 'getTotalBetsForPlayer').mockImplementation((playerId: string) => 
            mockBetManager.getTotalBetsForPlayer(playerId)
        );
        jest.spyOn(BetManager.prototype, 'getLargestBet').mockImplementation(() => mockBetManager.getLargestBet());

        action = new BetAction(game, updateMock);

        player = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        );

        const mockPlayers = [
            new Player("player1", undefined, 1000n, undefined, PlayerStatus.ACTIVE),
            new Player("player2", undefined, 1000n, undefined, PlayerStatus.ACTIVE),
            new Player("player3", undefined, 1000n, undefined, PlayerStatus.ACTIVE)
        ];

        // Setup common mocks for game
        jest.spyOn(game, "currentPlayerId", "get").mockReturnValue(player.address);
        jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
        jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
        jest.spyOn(game, "findActivePlayers").mockReturnValue(mockPlayers);
        jest.spyOn(game, "getActionsForRound").mockReturnValue([]);
        jest.spyOn(game, "bigBlind", "get").mockReturnValue(20n);

        // Mock addAction method on game
        game.addAction = jest.fn();
    });

    afterEach(() => {
        mockBetManager.reset();
        jest.restoreAllMocks();
    });

    describe("type", () => {
        it("should return BET type", () => {
            expect(action.type).toBe(PlayerActionType.BET);
        });
    });

    describe("verify", () => {
        it("should throw error in the ante round", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.ANTE);

            expect(() => action.verify(player)).toThrow("Cannot bet in the ante round.");
        });

        it("should throw error in the showdown round", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.SHOWDOWN);

            expect(() => action.verify(player)).toThrow("Cannot bet in the showdown round.");
        });

        it("should throw error if current bet is greater than 0", () => {
            // Setup: Someone has already bet 50n
            mockBetManager.setCurrentBet(50n);

            expect(() => action.verify(player)).toThrow("Cannot bet - player must call or raise.");
        });

        it("should return correct range when no current bet exists", () => {
            // Setup: No one has bet yet (current bet = 0)
            mockBetManager.setCurrentBet(0n);
            
            const result = action.verify(player);

            expect(result).toEqual({ 
                minAmount: 20n, // bigBlind
                maxAmount: ONE_THOUSAND_TOKENS // player.chips
            });
        });

        it("should handle preflop round with blinds correctly", () => {
            // Setup for preflop with blinds but no additional betting
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
            jest.spyOn(game, "getActionsForRound")
                .mockReturnValueOnce([]) // PREFLOP actions (no betting yet)
                .mockReturnValueOnce([   // ANTE actions (blinds)
                    {
                        playerId: PLAYER_1_ADDRESS,
                        action: PlayerActionType.BET,
                        amount: 10n,
                        index: 1,
                        seat: 1,
                        timestamp: Date.now()
                    },
                    {
                        playerId: PLAYER_2_ADDRESS,
                        action: PlayerActionType.BET,
                        amount: 20n,
                        index: 2,
                        seat: 2,
                        timestamp: Date.now()
                    }
                ]);

            // Current bet is 0 (no one has bet in the current round beyond blinds)
            mockBetManager.setCurrentBet(0n);

            const result = action.verify(player);

            expect(result).toEqual({ 
                minAmount: 20n, // bigBlind
                maxAmount: ONE_THOUSAND_TOKENS // player.chips
            });
        });

        it("should handle flop round with no previous betting", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.FLOP);
            
            // No current bet in flop round
            mockBetManager.setCurrentBet(0n);

            const result = action.verify(player);

            expect(result).toEqual({ 
                minAmount: 20n, // bigBlind
                maxAmount: ONE_THOUSAND_TOKENS // player.chips
            });
        });

        it("should handle turn round with no previous betting", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.TURN);
            
            // No current bet in turn round
            mockBetManager.setCurrentBet(0n);

            const result = action.verify(player);

            expect(result).toEqual({ 
                minAmount: 20n, // bigBlind
                maxAmount: ONE_THOUSAND_TOKENS // player.chips
            });
        });

        it("should handle river round with no previous betting", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.RIVER);
            
            // No current bet in river round
            mockBetManager.setCurrentBet(0n);

            const result = action.verify(player);

            expect(result).toEqual({ 
                minAmount: 20n, // bigBlind
                maxAmount: ONE_THOUSAND_TOKENS // player.chips
            });
        });

        it("should handle player with limited chips", () => {
            // Setup: Player only has 50n chips
            player.chips = 50n;
            mockBetManager.setCurrentBet(0n);

            const result = action.verify(player);

            expect(result).toEqual({ 
                minAmount: 20n, // bigBlind
                maxAmount: 50n // player.chips (limited)
            });
        });

        it("should handle player with chips less than big blind", () => {
            // Setup: Player only has 10n chips (less than big blind of 20n)
            player.chips = 10n;
            mockBetManager.setCurrentBet(0n);

            const result = action.verify(player);

            expect(result).toEqual({ 
                minAmount: 20n, // bigBlind (still minimum)
                maxAmount: 10n // player.chips (all they have)
            });
        });
    });

    describe("execute", () => {
        beforeEach(() => {
            // Setup valid betting scenario for execute tests
            mockBetManager.setCurrentBet(0n);
            jest.spyOn(action, "verify").mockReturnValue({
                minAmount: 20n,
                maxAmount: ONE_THOUSAND_TOKENS
            });
        });

        it("should throw error if bet amount is zero", () => {
            expect(() => action.execute(player, 0, 0n)).toThrow("Bet amount must be greater than zero.");
        });

        it("should throw error if bet amount is negative", () => {
            expect(() => action.execute(player, 0, -10n)).toThrow("Bet amount must be greater than zero.");
        });

        it("should deduct correct amount from player chips", () => {
            player.chips = 1000n;
            action.execute(player, 0, 50n);

            expect(player.chips).toBe(950n); // 1000n - 50n
        });

        it("should add regular BET action when player has chips left", () => {
            player.chips = 1000n;
            action.execute(player, 0, 50n);

            expect(game.addAction).toHaveBeenCalledWith(
                {
                    playerId: player.address,
                    action: PlayerActionType.BET,
                    amount: 50n,
                    index: 0
                },
                TexasHoldemRound.PREFLOP
            );
        });

        it("should add ALL_IN action when player uses all chips", () => {
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

        it("should handle minimum bet amount", () => {
            player.chips = 1000n;
            action.execute(player, 0, 20n); // Big blind amount

            expect(player.chips).toBe(980n);
            expect(game.addAction).toHaveBeenCalledWith(
                {
                    playerId: player.address,
                    action: PlayerActionType.BET,
                    amount: 20n,
                    index: 0
                },
                TexasHoldemRound.PREFLOP
            );
        });

        it("should handle large bet amount", () => {
            player.chips = 1000n;
            action.execute(player, 0, 500n);

            expect(player.chips).toBe(500n);
            expect(game.addAction).toHaveBeenCalledWith(
                {
                    playerId: player.address,
                    action: PlayerActionType.BET,
                    amount: 500n,
                    index: 0
                },
                TexasHoldemRound.PREFLOP
            );
        });
    });

    describe("integration scenarios", () => {
        it("should handle first bet in preflop after blinds", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
            mockBetManager.setCurrentBet(0n); // No betting action yet
            
            const range = action.verify(player);
            expect(range.minAmount).toBe(20n);
            // expect(range.maxAmount).toBe(ONE_THOUSAND_TOKENS);

            action.execute(player, 0, 40n);
            expect(player.chips).toBe(999999999999999999960n);
        });

        it("should handle first bet in flop round", () => {
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.FLOP);
            mockBetManager.setCurrentBet(0n);
            
            const range = action.verify(player);
            expect(range.minAmount).toBe(20n);

            action.execute(player, 0, 30n);
            expect(player.chips).toBe(999999999999999999970n);
        });

        it("should prevent betting when someone has already bet", () => {
            mockBetManager.setCurrentBet(50n); // Someone has bet
            
            expect(() => action.verify(player)).toThrow("Cannot bet - player must call or raise.");
        });
    });
});