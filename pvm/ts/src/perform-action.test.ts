import { describe, it, expect, beforeEach, jest, afterEach } from "@jest/globals";
import { ethers, ZeroHash } from "ethers";
import { RPC } from "./rpc"; // Update with your actual path
import { RPCMethods, RPCRequest, NonPlayerActionType, PlayerActionType } from "@bitcoinbrisbane/block52";
import { PerformActionCommandWithResult } from "./commands/performActionCommandWithResult";
import { baseGameConfig, ONE_HUNDRED_TOKENS, ONE_THOUSAND_TOKENS, ONE_TOKEN, TWO_TOKENS } from "./engine/testConstants";
import { getMempoolInstance, Mempool } from "./core/mempool";

const PLAYER = "0x1234567890123456789012345678901234567890";

// Mock the getGameManagementInstance function using a factory function
const mockGameState = jest.fn().mockImplementation(async () => ({}));
const mockGame = jest.fn().mockImplementation(async () => ({
    state: baseGameConfig
}));
const mockPerformAction = jest.fn().mockImplementation(async () => ({ success: true }));

const mockSchema = jest.fn().mockImplementation(async () => ({
    address: "0xa78eba9eda216154d263679e1cc615c7271679efa3",
    category: "cash",
    name: "mock",
    schema: "",
    hash: ethers.ZeroHash
}));

const mockGameOptions = jest.fn().mockImplementation(async () => ({
    minBuyIn: ONE_HUNDRED_TOKENS,
    maxBuyIn: ONE_THOUSAND_TOKENS,
    minPlayers: 2,
    maxPlayers: 9,
    smallBlind: ONE_TOKEN,
    bigBlind: TWO_TOKENS
}));

jest.mock("./state/index", () => ({
    getGameManagementInstance: () => ({
        getGameState: mockGameState,
        performAction: mockPerformAction,
        getByAddress: mockGame
    }),
    getContractSchemaManagementInstance: () => ({
        getByAddress: mockSchema,
        getGameOptions: mockGameOptions
    })
}));

jest.mock("./core/mempool", () => ({
    getMempoolInstance: () => ({
        findAll: jest.fn().mockReturnValue([]),
        add: jest.fn(),
        remove: jest.fn()
    })
}));

jest.mock("../src/types/response", () => {
    return {
        makeErrorRPCResponse: jest.fn((id, message) => ({
            id,
            error: message
        }))
    };
});

describe("RPC Class - PERFORM_ACTION Method", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Set up environment
        process.env = { ...originalEnv };
        process.env.VALIDATOR_KEY = "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb";

        // Spy on console.error
        jest.spyOn(console, "error").mockImplementation(() => {});
        jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore environment
        process.env = originalEnv;
    });

    it.skip("should successfully process a valid PERFORM_ACTION request with PlayerActionType", async () => {
        // Arrange
        const request: RPCRequest = {
            id: "1",
            method: RPCMethods.PERFORM_ACTION,
            params: [PLAYER, "0xa78eba9eda216154d263679e1cc615c7271679efa3", NonPlayerActionType.JOIN, ONE_HUNDRED_TOKENS.toString(), "0", 0, ""] //  // [from, to, action, amount, nonce, index, data]
        };

        // Act
        const response = await RPC.handleWriteMethod(RPCMethods.PERFORM_ACTION, request);

        // Assert
        expect(response).toBeDefined();
        expect(response).toHaveProperty("id", "1");

        // Check if the mempool add method was called
        // const mempool = getMempoolInstance();
        // expect(mempool.add).toHaveBeenCalledTimes(1);
    });

    it("should successfully sit out after joining", async () => {
        // Arrange
        const request: RPCRequest = {
            id: "1",
            method: RPCMethods.PERFORM_ACTION,
            params: [PLAYER, "0xa78eba9eda216154d263679e1cc615c7271679efa3", NonPlayerActionType.JOIN, ONE_HUNDRED_TOKENS.toString(), "0", 0, ""] //  // [from, to, action, amount, nonce, index, data]
        };

        // Act
        const response = await RPC.handleWriteMethod(RPCMethods.PERFORM_ACTION, request);

        // Assert
        expect(response).toBeDefined();
        expect(response).toHaveProperty("id", "1");

        const request2: RPCRequest = {
            id: "1",
            method: RPCMethods.PERFORM_ACTION,
            params: [PLAYER, "0xa78eba9eda216154d263679e1cc615c7271679efa3", PlayerActionType.SIT_OUT, "0", "0", 1, ""] //  // [from, to, action, amount, nonce, index, data]
        };

        const response2 = await RPC.handleWriteMethod(RPCMethods.PERFORM_ACTION, request2);
        console.log(response2);

        // Assert
        expect(response2).toBeDefined();
        //   expect(response).toHaveProperty("id", "1");

        // Check if the mempool add method was called
        // const mempool = getMempoolInstance();
        // expect(mempool.add).toHaveBeenCalledTimes(1);
    });
});
