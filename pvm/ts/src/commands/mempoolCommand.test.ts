import { MempoolCommand } from "./mempoolCommand";
import { getMempoolInstance } from "../core/mempool";
import { ethers } from "ethers";
import { Transaction } from "../models";

// Mock all dependencies
jest.mock("../core/mempool", () => ({
    getMempoolInstance: jest.fn()
}));

describe("MempoolCommand", () => {
    // Mock instances
    const mockMempool = {
        get: jest.fn(),
        clear: jest.fn()
    };

    const expected = {
        data: {
            transactions: [
                {
                    data: "mock-data-1",
                    from: "0x0000000000000000000000000000000000000000",
                    hash: "tx1",
                    index: 0,
                    nonce: 0n,
                    signature: "0x0000000000000000000000000000000000000000000000000000000000000000",
                    timestamp: 10000,
                    to: "0x0000000000000000000000000000000000000000",
                    value: 1n
                }
            ]
        },
        signature: "0x4916a9668334ec62fd5119f0ff27c51cb34be78315a83adc32ac3899cd8bb5ca3fcf7826a1cf6f525c2eeb0013e0b1b37ecc3f67850d6783714df2931d12d53e1b"
    };

    const tx: Transaction = new Transaction(ethers.ZeroAddress, ethers.ZeroAddress, 1n, "tx1", ethers.ZeroHash, 10000, 0n, 0, "mock-data-1");
    const txs: Transaction[] = [tx];

    // Test data
    const privateKey = "0x6c35e6762b9cd8c2d4db4b9c09d1248585417831d98e58bd7338daf748e1b02d";

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mock implementations
        (getMempoolInstance as jest.Mock).mockReturnValue(mockMempool);
        mockMempool.get.mockResolvedValue(txs);
    });

    it("should get tx from mempool", async () => {
        const command = new MempoolCommand(privateKey);
        const result = await command.execute();

        expect(result).toEqual(expected);
    });
});
