import { GameManagement, getGameManagementInstance } from "./gameManagement";
import GameState from "../schema/gameState";
import contractSchemas from "../schema/contractSchemas";
import { getMempoolInstance } from "../core/mempool";
import { ethers } from "ethers";

// Mock dependencies
jest.mock("../schema/gameState");
jest.mock("../schema/contractSchemas");
jest.mock("../core/mempool");
jest.mock("ethers", () => ({
    ZeroAddress: "0x0000000000000000000000000000000000000000",
    ZeroHash: "0x0000000000000000000000000000000000000000000000000000000000000000"
}));

describe("GameManagement", () => {
    let gameManagement: GameManagement;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        // Reset the singleton instance
        jest.spyOn(global, "process", "get").mockImplementation(() => ({
            ...process,
            env: { ...process.env, DB_URL: "mongodb://testdb:27017/test" }
        }));
        gameManagement = new GameManagement();
    });

    describe("get", () => {
        it("should return default state for zero address", async () => {
            const result = await gameManagement.get(ethers.ZeroAddress);

            expect(result).toEqual({
                type: "cash",
                address: ethers.ZeroAddress,
                smallBlind: "10000000000000000000",
                bigBlind: "30000000000000000000",
                dealer: 0,
                players: [],
                communityCards: [],
                pots: ["0"],
                nextToAct: 0,
                round: "preflop",
                winners: [],
                signature: ethers.ZeroHash
            });
        });

        it("should return existing game state from database", async () => {
            const mockState = {
                address: "0x1234567890123456789012345678901234567890",
                state: {
                    type: "cash",
                    address: "0x1234567890123456789012345678901234567890",
                    players: []
                }
            };

            (GameState.findOne as jest.Mock).mockResolvedValue(mockState);

            const result = await gameManagement.get("0x1234567890123456789012345678901234567890");

            expect(result).toEqual(mockState.state);
            expect(GameState.findOne).toHaveBeenCalledWith({ address: "0x1234567890123456789012345678901234567890" });
        });

        it("should create new game state from schema", async () => {
            const mockSchema = {
                address: "0x2234567890123456789012345678901234567890",
                schema: "arg0,cash,2,6,1000000,2000000"
            };

            (GameState.findOne as jest.Mock).mockResolvedValue(null);
            (contractSchemas.findOne as jest.Mock).mockResolvedValue(mockSchema);

            const result = await gameManagement.get("0x456");

            expect(result).toEqual({
                type: "cash",
                address: "0x2234567890123456789012345678901234567890",
                minBuyIn: 0n,
                maxBuyIn: 0n,
                minPlayers: "2",
                maxPlayers: "6",
                smallBlind: "1000000",
                bigBlind: "2000000",
                dealer: 0,
                players: [],
                communityCards: [],
                pots: ["0"],
                nextToAct: 0,
                round: "preflop",
                winners: [],
                signature: ethers.ZeroHash
            });
        });

        it("should throw error if game not found", async () => {
            (GameState.findOne as jest.Mock).mockResolvedValue(null);
            (contractSchemas.findOne as jest.Mock).mockResolvedValue(null);

            await expect(gameManagement.get("0x789")).rejects.toThrow("Game not found");
        });
    });

    describe("save", () => {
        it("should update existing game state", async () => {
            const mockSave = jest.fn();
            const mockExistingState = {
                address: "0x1234567890123456789012345678901234567890",
                state: {},
                save: mockSave
            };

            (GameState.findOne as jest.Mock).mockResolvedValue(mockExistingState);

            const mockGameState = {
                address: "0x1234567890123456789012345678901234567890",
                toJson: () => ({ address: "0x1234567890123456789012345678901234567890", state: { updated: true } })
            };

            await gameManagement.save(mockGameState);

            expect(mockSave).toHaveBeenCalled();
            expect(mockExistingState.state).toEqual({ updated: true });
        });

        it("should create new game state if not exists", async () => {
            const mockSave = jest.fn();
            (GameState.findOne as jest.Mock).mockResolvedValue(null);
            (GameState as any).mockImplementation(() => ({
                save: mockSave
            }));

            const mockGameState = {
                address: "0x1234567890123456789012345678901234567890",
                toJson: () => ({ address: "0x1234567890123456789012345678901234567890", state: { new: true } })
            };

            await gameManagement.save(mockGameState);

            expect(mockSave).toHaveBeenCalled();
            expect(GameState).toHaveBeenCalledWith({ address: "0x1234567890123456789012345678901234567890", state: { new: true } });
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

            const jsonData = {
                address: "0x1234567890123456789012345678901234567890",
                someData: "test"
            };

            await gameManagement.saveFromJSON(jsonData);

            expect(mockSave).toHaveBeenCalled();
            expect(mockExistingState.state).toEqual(jsonData);
        });

        it("should create new game state from JSON if not exists", async () => {
            const mockSave = jest.fn();
            (GameState.findOne as jest.Mock).mockResolvedValue(null);
            (GameState as any).mockImplementation(() => ({
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
            const instance1 = getGameManagementInstance();
            const instance2 = getGameManagementInstance();

            expect(instance1).toBe(instance2);
        });
    });
});
