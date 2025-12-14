import { PlayerActionType, PlayerStatus, TexasHoldemRound } from "@block52/poker-vm-sdk";
import CallAction from "./callAction";
import { Player } from "../../models/player";
import { IUpdate } from "../types";
import TexasHoldemGame from "../texasHoldem";
// Assuming you have a constants file, otherwise define TEN_TOKENS in this file
import { getDefaultGame, MockBetManager, ONE_THOUSAND_TOKENS, PLAYER_1_ADDRESS, PLAYER_2_ADDRESS } from "../testConstants";
import { BetManager } from "../managers/betManager";

// Updated test file using the mock BetManager
describe("CallAction", () => {
    let action: CallAction;
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

        // Mock the BetManager constructor to return our mock
        jest.spyOn(BetManager.prototype, 'current').mockImplementation(() => mockBetManager.current());
        jest.spyOn(BetManager.prototype, 'getTotalBetsForPlayer').mockImplementation((playerId: string) =>
            mockBetManager.getTotalBetsForPlayer(playerId)
        );
        jest.spyOn(BetManager.prototype, 'getLargestBet').mockImplementation(() => mockBetManager.getLargestBet());

        // Or alternatively, mock the entire constructor
        // jest.mocked(BetManager).mockImplementation(() => mockBetManager as any);

        action = new CallAction(game, updateMock);

        player = new Player(
            "0x980b8D8A16f5891F41871d878a479d81Da52334c",
            undefined,
            ONE_THOUSAND_TOKENS,
            undefined,
            PlayerStatus.ACTIVE
        );

        // Setup common mocks for game
        jest.spyOn(game, "currentPlayerId", "get").mockReturnValue(player.address);
        jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
        jest.spyOn(game, "getPlayerStatus").mockReturnValue(PlayerStatus.ACTIVE);
        jest.spyOn(game, "getNextPlayerToAct").mockReturnValue(player);
        jest.spyOn(game, "getActionsForRound").mockReturnValue([]);

        game.addAction = jest.fn();
    });

    afterEach(() => {
        mockBetManager.reset();
        jest.restoreAllMocks();
    });

    describe("verify", () => {
        it("should throw error if no previous action to call", () => {
            // Setup: No current bet (no one has bet yet)
            mockBetManager.setLargestBet(0n);

            expect(() => action.verify(player)).toThrow("No previous action to call.");
        });

        it("should throw error if player has already matched the current bet", () => {
            // Setup: Current bet is 50n and player has already bet 50n
            mockBetManager.setLargestBet(50n);
            mockBetManager.setPlayerBet(player.address, 50n);

            expect(() => action.verify(player)).toThrow("Player has already matched the current bet so can check instead.");
        });

        it("should return correct range when player needs to call", () => {
            // Setup: Current bet is 100n, player has bet 30n, so needs to call 70n more
            mockBetManager.setLargestBet(100n);
            mockBetManager.setPlayerBet(player.address, 30n);

            const result = action.verify(player);

            expect(result).toEqual({ minAmount: 70n, maxAmount: 70n });
        });

        it("should return correct range for new player with no previous bet", () => {
            // Setup: Current bet is 50n, player hasn't bet anything yet
            mockBetManager.setLargestBet(50n);
            mockBetManager.setPlayerBet(player.address, 0n);

            const result = action.verify(player);

            expect(result).toEqual({ minAmount: 50n, maxAmount: 50n });
        });

        it("should handle big blind scenario in preflop", () => {
            // Setup for preflop with blinds
            jest.spyOn(game, "currentRound", "get").mockReturnValue(TexasHoldemRound.PREFLOP);
            jest.spyOn(game, "getActionsForRound")
                .mockReturnValueOnce([]) // PREFLOP actions
                .mockReturnValueOnce([   // ANTE actions (blinds)
                    {
                        playerId: PLAYER_1_ADDRESS,
                        action: PlayerActionType.BET,
                        amount: 5n,
                        index: 1,
                        seat: 1,
                        timestamp: Date.now()
                    },
                    {
                        playerId: PLAYER_2_ADDRESS,
                        action: PlayerActionType.BET,
                        amount: 10n,
                        index: 2,
                        seat: 2,
                        timestamp: Date.now()
                    }
                ]);

            // Current bet is big blind (10n), player hasn't bet anything
            mockBetManager.setLargestBet(10n);
            mockBetManager.setPlayerBet(player.address, 0n);

            const result = action.verify(player);

            expect(result).toEqual({ minAmount: 10n, maxAmount: 10n });
        });
    });
});


