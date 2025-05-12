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

    const mockTransactions = [
        {
            hash: "tx1",
            verify: jest.fn().mockReturnValue(true),
            toJson: jest.fn().mockReturnValue({
                to: ethers.ZeroAddress,
                from: ethers.ZeroAddress,
                value: 1n,
                hash: "tx1",
                signature: ethers.ZeroHash,
                timestamp: 1000,
                data: "mock,1"
            })
        }
    ];

    const tx: Transaction = new Transaction(ethers.ZeroAddress, ethers.ZeroAddress, 1n, "tx1", ethers.ZeroHash, 10000, 0n, 0, "mock-data-1");

    const txs: Transaction[] = [tx];

    // Test data
    const privateKey = "0x6c35e6762b9cd8c2d4db4b9c09d1248585417831d98e58bd7338daf748e1b02d";

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mock implementations
        (getMempoolInstance as jest.Mock).mockReturnValue(mockMempool);
        // mockMempool.get.mockReturnValue(mockTransactions);
        mockMempool.get.mockResolvedValue(txs);
    });

    it.skip("should get tx from mempool", async () => {
        const command = new MempoolCommand(privateKey);
        const result = await command.execute();

        expect(result).toEqual(mockTransactions);
    });
});
