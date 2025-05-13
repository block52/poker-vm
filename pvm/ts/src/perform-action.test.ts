import { describe, it, expect, beforeEach, jest, afterEach } from "@jest/globals";
import { ZeroHash } from "ethers";
import { RPC } from "./rpc"; // Update with your actual path
import { RPCMethods, RPCRequest, PlayerActionType, NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { PerformActionCommandWithResult } from "./commands/performActionCommandWithResult";
// import { IGameStateDocument } from "./models/interfaces";

// Define types for our mocks to avoid "type is never" errors
interface IGameManagement {
    getGameState: jest.Mock;
    performAction: jest.Mock;
}

// const mockGameState: IGameStateDocument = {
//     address: "0x123456789",
//     schemaAddress: "0x987654321",
//     state: "any"
// };

// Create typed mock instances
const gameManagementMock: IGameManagement = {
    getGameState: jest.fn().mockImplementation(async () => ({})),
    performAction: jest.fn().mockImplementation(async () => ({ success: true }))
};

// // Create mock instances for dependencies
// const mockGameManagement = {
//     getGameState: jest.fn().mockResolvedValue()
//     // Add other methods as needed
// };

// const mockContractSchemaManagement = {
//     getContractSchema: jest.fn().mockResolvedValue({})
//     // Add other methods as needed
// };

// Mock dependencies
jest.mock("../src/state/index", () => ({
    getGameManagementInstance: jest.fn().mockReturnValue(gameManagementMock)
}));

// jest.mock("../src/core/contract", () => ({
//     getContractSchemaManagement: jest.fn().mockReturnValue(mockContractSchemaManagement)
// }));

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
        process.env.VALIDATOR_KEY = ZeroHash;

        // Spy on console.error
        jest.spyOn(console, "error").mockImplementation(() => {});
        jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore environment
        process.env = originalEnv;
    });

    it("should successfully process a valid PERFORM_ACTION request with PlayerActionType", async () => {
        // Arrange
        const request: RPCRequest = {
            id: "1",
            method: RPCMethods.PERFORM_ACTION,
            params: ["fromAddress", "toAddress", NonPlayerActionType.JOIN, "100", "0", 1, ""] //  // [from, to, action, amount, nonce, index, data]
        };

        // Act
        const response = await RPC.handleWriteMethod(RPCMethods.PERFORM_ACTION, request);

        // Assert
        expect(PerformActionCommandWithResult).toHaveBeenCalledWith(
            "fromAddress",
            "toAddress",
            0,
            BigInt(100),
            NonPlayerActionType.JOIN,
            123,
            process.env.VALIDATOR_KEY,
            { gameData: "some data" }
        );

        expect(response).toEqual({
            id: 1,
            result: {
                data: { txHash: "0x123456789" },
                signature: "test-signature"
            }
        });
    });

    // it("should successfully process a valid PERFORM_ACTION request with NonPlayerActionType", async () => {
    //     // Arrange
    //     const request: RPCRequest = {
    //         id: 2,
    //         method: RPCMethods.PERFORM_ACTION,
    //         params: ["fromAddress", "toAddress", NonPlayerActionType.DEAL_CARDS, "0", 456, 1, { cards: [1, 2, 3] }]
    //     };

    //     // Act
    //     const response = await RPC.handleWriteMethod(RPCMethods.PERFORM_ACTION, request);

    //     // Assert
    //     expect(PerformActionCommandWithResult).toHaveBeenCalledWith(
    //         "fromAddress",
    //         "toAddress",
    //         1,
    //         BigInt(0),
    //         NonPlayerActionType.DEAL_CARDS,
    //         456,
    //         process.env.VALIDATOR_KEY,
    //         { cards: [1, 2, 3] }
    //     );

    //     expect(response.result).toBeDefined();
    //     expect(response.error).toBeUndefined();
    // });

    // it("should handle missing VALIDATOR_KEY by using ZeroHash", async () => {
    //     // Arrange
    //     delete process.env.VALIDATOR_KEY;

    //     const request: RPCRequest = {
    //         id: 3,
    //         method: RPCMethods.PERFORM_ACTION,
    //         params: ["fromAddress", "toAddress", PlayerActionType.FOLD, "0", 789, 2, null]
    //     };

    //     // Act
    //     const response = await RPC.handleWriteMethod(RPCMethods.PERFORM_ACTION, request);

    //     // Assert
    //     expect(PerformActionCommandWithResult).toHaveBeenCalledWith("fromAddress", "toAddress", 2, BigInt(0), PlayerActionType.FOLD, 789, ZeroHash, null);

    //     expect(response.result).toBeDefined();
    // });

    // it("should handle PerformActionCommandWithResult execution errors", async () => {
    //     // Arrange
    //     const request: RPCRequest = {
    //         id: 4,
    //         method: RPCMethods.PERFORM_ACTION,
    //         params: ["fromAddress", "toAddress", PlayerActionType.CHECK, "0", 101, 0, {}]
    //     };

    //     // Mock implementation to throw error
    //     (PerformActionCommandWithResult as jest.Mock).mockImplementationOnce(() => {
    //         return {
    //             execute: jest.fn().mockRejectedValue(new Error("Command execution failed"))
    //         };
    //     });

    //     // Act
    //     const response = await RPC.handleWriteMethod(RPCMethods.PERFORM_ACTION, request);

    //     // Assert
    //     expect(makeErrorRPCResponse).toHaveBeenCalledWith(4, "Operation failed");
    //     expect(console.error).toHaveBeenCalled();
    //     expect(response.error).toBeDefined();
    // });

    // it("should handle invalid action type gracefully", async () => {
    //     // Arrange
    //     const request: RPCRequest = {
    //         id: 5,
    //         method: RPCMethods.PERFORM_ACTION,
    //         params: [
    //             "fromAddress",
    //             "toAddress",
    //             "INVALID_ACTION", // Invalid action type
    //             "50",
    //             202,
    //             0,
    //             {}
    //         ]
    //     };

    //     // Act
    //     const response = await RPC.handleWriteMethod(RPCMethods.PERFORM_ACTION, request);

    //     // Assert
    //     expect(PerformActionCommandWithResult).toHaveBeenCalledWith(
    //         "fromAddress",
    //         "toAddress",
    //         0,
    //         BigInt(50),
    //         "INVALID_ACTION",
    //         202,
    //         process.env.VALIDATOR_KEY,
    //         {}
    //     );

    //     // The test assumes the PerformActionCommandWithResult will validate action type
    //     // If validation happens in the command, not in RPC, this will pass
    //     expect(response.result).toBeDefined();
    // });

    // it("should convert amount string to BigInt correctly", async () => {
    //     // Arrange
    //     const request: RPCRequest = {
    //         id: 6,
    //         method: RPCMethods.PERFORM_ACTION,
    //         params: [
    //             "fromAddress",
    //             "toAddress",
    //             PlayerActionType.RAISE,
    //             "9007199254740991", // Max safe integer in JS
    //             303,
    //             0,
    //             {}
    //         ]
    //     };

    //     // Act
    //     const response = await RPC.handleWriteMethod(RPCMethods.PERFORM_ACTION, request);

    //     // Assert
    //     expect(PerformActionCommandWithResult).toHaveBeenCalledWith(
    //         "fromAddress",
    //         "toAddress",
    //         0,
    //         BigInt("9007199254740991"),
    //         PlayerActionType.RAISE,
    //         303,
    //         process.env.VALIDATOR_KEY,
    //         {}
    //     );

    //     expect(response.result).toBeDefined();
    // });

    // it("should handle extremely large BigInt values properly", async () => {
    //     // Arrange
    //     const request: RPCRequest = {
    //         id: 7,
    //         method: RPCMethods.PERFORM_ACTION,
    //         params: [
    //             "fromAddress",
    //             "toAddress",
    //             PlayerActionType.CALL,
    //             "123456789012345678901234567890", // Very large number
    //             404,
    //             3,
    //             { large: true }
    //         ]
    //     };

    //     // Act
    //     const response = await RPC.handleWriteMethod(RPCMethods.PERFORM_ACTION, request);

    //     // Assert
    //     expect(PerformActionCommandWithResult).toHaveBeenCalledWith(
    //         "fromAddress",
    //         "toAddress",
    //         3,
    //         BigInt("123456789012345678901234567890"),
    //         PlayerActionType.CALL,
    //         404,
    //         process.env.VALIDATOR_KEY,
    //         { large: true }
    //     );

    //     expect(response.result).toBeDefined();
    // });

    // it("should log request details for debugging", async () => {
    //     // Arrange
    //     const request: RPCRequest = {
    //         id: 8,
    //         method: RPCMethods.PERFORM_ACTION,
    //         params: ["fromAddress", "toAddress", PlayerActionType.BET, "200", 505, 4, { debug: true }]
    //     };

    //     // Act
    //     const response = await RPC.handleWriteMethod(RPCMethods.PERFORM_ACTION, request);

    //     // Assert
    //     expect(console.log).toHaveBeenCalledWith("handleWriteMethod", RPCMethods.PERFORM_ACTION, request);

    //     expect(response.result).toBeDefined();
    // });

    // // Edge cases
    // it("should handle undefined data parameter gracefully", async () => {
    //     // Arrange
    //     const request: RPCRequest = {
    //         id: 9,
    //         method: RPCMethods.PERFORM_ACTION,
    //         params: [
    //             "fromAddress",
    //             "toAddress",
    //             PlayerActionType.JOIN,
    //             "100",
    //             606,
    //             5,
    //             undefined // Undefined data
    //         ]
    //     };

    //     // Act
    //     const response = await RPC.handleWriteMethod(RPCMethods.PERFORM_ACTION, request);

    //     // Assert
    //     expect(PerformActionCommandWithResult).toHaveBeenCalledWith(
    //         "fromAddress",
    //         "toAddress",
    //         5,
    //         BigInt(100),
    //         PlayerActionType.JOIN,
    //         606,
    //         process.env.VALIDATOR_KEY,
    //         undefined
    //     );

    //     expect(response.result).toBeDefined();
    // });

    // it("should handle missing params gracefully", async () => {
    //     // Arrange
    //     const request: RPCRequest = {
    //         id: 10,
    //         method: RPCMethods.PERFORM_ACTION
    //         // Missing params
    //     };

    //     // Act
    //     const response = await RPC.handleWriteMethod(RPCMethods.PERFORM_ACTION, request);

    //     // Assert
    //     // Your implementation might handle this differently - adjust as needed
    //     expect(console.error).toHaveBeenCalled();
    //     expect(response.error).toBeDefined();
    // });
});
