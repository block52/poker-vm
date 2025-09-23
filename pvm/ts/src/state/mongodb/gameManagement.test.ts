import { GameManagement, getGameManagementInstance } from "./gameManagement";
import GameState from "../../schema/gameState";
import { ethers } from "ethers";

// Mock dependencies
jest.mock("../../schema/gameState");
jest.mock("../../core/mempool");

describe("GameManagement", () => {
    let gameManagement: GameManagement;
    const originalEnv = process.env;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Mock environment variables
        process.env = {
            ...originalEnv,
            DB_URL: "mongodb://testdb:27017/test"
        };

        // Reset the singleton instance by accessing the module's internal state
        // We need to clear the singleton instance for testing
        jest.resetModules();

        gameManagement = new GameManagement("mongodb://testdb:27017/test");
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    describe("getByAddress", () => {
        it("should return null when game state is not found", async () => {
            (GameState.findOne as jest.Mock).mockResolvedValue(null);

            const result = await gameManagement.getByAddress("0x1234567890123456789012345678901234567890");

            expect(result).toBeNull();
            expect(GameState.findOne).toHaveBeenCalledWith({ address: "0x1234567890123456789012345678901234567890" });
        });

        it("should return existing game state from database", async () => {
            const mockState = {
                address: "0x1234567890123456789012345678901234567890",
                gameOptions: {
                    minBuyIn: "1000000000000000000",
                    maxBuyIn: "10000000000000000000",
                    maxPlayers: 6,
                    minPlayers: 2,
                    smallBlind: "10000000000000000000",
                    bigBlind: "20000000000000000000",
                    timeout: 30000
                },
                state: {
                    type: "cash",
                    address: "0x1234567890123456789012345678901234567890",
                    players: []
                }
            };

            (GameState.findOne as jest.Mock).mockResolvedValue(mockState);

            const result = await gameManagement.getByAddress("0x1234567890123456789012345678901234567890");

            expect(result).toEqual({
                address: mockState.address,
                gameOptions: mockState.gameOptions,
                state: mockState.state
            });
            expect(GameState.findOne).toHaveBeenCalledWith({ address: "0x1234567890123456789012345678901234567890" });
        });
    });

    describe("saveFromJSON", () => {
        it("should update existing game state from JSON", async () => {
            const mockSave = jest.fn();
            const mockExistingState = {
                address: "0x1234567890123456789012345678901234567890",
                state: {},
                save: mockSave
            };

            (GameState.findOne as jest.Mock).mockResolvedValue(mockExistingState);

            // Mock the GameState constructor that creates the temporary game object
            const mockGameStateConstructor = jest.fn().mockImplementation((data) => ({
                address: data.address,
                state: data.state
            }));
            (GameState as any).mockImplementation(mockGameStateConstructor);

            const jsonData = {
                address: "0x1234567890123456789012345678901234567890",
                someData: "test"
            };

            await gameManagement.saveFromJSON(jsonData);

            expect(mockSave).toHaveBeenCalled();
            // The implementation creates a new GameState with { address, state: json } 
            // then sets existingGameState.state = game.state
            expect(mockExistingState.state).toEqual(jsonData);
        });

        it("should create new game state from JSON if not exists", async () => {
            const mockSave = jest.fn();
            (GameState.findOne as jest.Mock).mockResolvedValue(null);
            (GameState as any).mockImplementation(() => ({
                address: "0x1234567890123456789012345678901234567890",
                save: mockSave
            }));

            const jsonData = {
                address: "0x1234567890123456789012345678901234567890",
                someData: "test"
            };

            await gameManagement.saveFromJSON(jsonData);

            expect(mockSave).toHaveBeenCalled();
            expect(GameState).toHaveBeenCalledWith({
                address: "0x1234567890123456789012345678901234567890",
                state: jsonData
            });
        });
    });

    describe("getGameManagementInstance", () => {
        it("should return singleton instance", () => {
            // Import fresh instances after resetting modules
            const { getGameManagementInstance, GameManagement: ImportedGameManagement } = require("./gameManagement");

            const instance1 = getGameManagementInstance();
            const instance2 = getGameManagementInstance();

            expect(instance1).toBe(instance2);
            expect(instance1).toBeInstanceOf(ImportedGameManagement);
        });

        it("should throw error when DB_URL is not set", () => {
            // Remove DB_URL from environment
            delete process.env.DB_URL;

            // Import fresh instance after resetting modules
            jest.resetModules();
            const { getGameManagementInstance } = require("./gameManagement");

            expect(() => getGameManagementInstance()).toThrow("No database connection string provided. Please set the DB_URL environment variable.");
        });
    });
});
