import { MineCommand } from "./mineCommand";
import { getMempoolInstance } from "../core/mempool";
import { getBlockchainInstance } from "../state/blockchainManagement";
import { getTransactionInstance } from "../state/transactionManagement";
import { Block, Transaction } from "../models";
import { ethers, Signature } from "ethers";

// Mock all dependencies
jest.mock("../core/mempool", () => ({
    getMempoolInstance: jest.fn()
}));

jest.mock("../state/blockchainManagement", () => ({
    getBlockchainInstance: jest.fn()
}));

jest.mock("../state/transactionManagement", () => ({
    getTransactionInstance: jest.fn()
}));

describe("MineCommand", () => {
    // Mock instances
    const mockMempool = {
        get: jest.fn(),
        clear: jest.fn()
    };

    const mockBlockchain = {
        getLastBlock: jest.fn(),
        addBlock: jest.fn()
    };

    const mockTransactionManagement = {
        exists: jest.fn()
    };

    // Test data
    const privateKey = "0x6c35e6762b9cd8c2d4db4b9c09d1248585417831d98e58bd7338daf748e1b02d";
    const lastBlock = {
        index: 1,
        hash: ethers.ZeroHash,
        transactions: [],
        timestamp: Date.now(),
        nonce: 0,
        difficulty: 1
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
                data: "mock-data-1"
            })
        },
        {
            hash: "tx2",
            verify: jest.fn().mockReturnValue(false),
            toJson: jest.fn().mockReturnValue({
                to: ethers.ZeroAddress,
                from: ethers.ZeroAddress,
                value: 1n,
                hash: "tx1",
                signature: ethers.ZeroHash,
                timestamp: 1000,
                data: "mock-data-1"
            })
        },
        {
            hash: "tx3",
            verify: jest.fn().mockReturnValue(true),
            toJson: jest.fn().mockReturnValue({
                to: ethers.ZeroAddress,
                from: ethers.ZeroAddress,
                value: 1n,
                hash: "tx1",
                signature: ethers.ZeroHash,
                timestamp: 1000,
                data: "mock-data-1"
            })
        }
    ] as unknown as Transaction[];

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mock implementations
        (getMempoolInstance as jest.Mock).mockReturnValue(mockMempool);
        (getBlockchainInstance as jest.Mock).mockReturnValue(mockBlockchain);
        (getTransactionInstance as jest.Mock).mockReturnValue(mockTransactionManagement);

        mockMempool.get.mockReturnValue(mockTransactions);
        mockBlockchain.getLastBlock.mockResolvedValue(lastBlock);
        mockTransactionManagement.exists.mockResolvedValue(false);
    });

    describe("execute", () => {
        it("should successfully mine a new block with valid transactions", async () => {
            // Arrange
            const command = new MineCommand(privateKey);

            // Act
            const result = await command.execute();

            // Assert
            expect(result.data).toBeInstanceOf(Block);
            expect(result.data?.index).toBe(lastBlock.index + 1);
            expect(result.data?.previousHash).toBe(lastBlock.hash);

            // Verify mempool interactions
            expect(mockMempool.get).toHaveBeenCalled();
            expect(mockMempool.clear).toHaveBeenCalled();

            // Verify blockchain interactions
            expect(mockBlockchain.getLastBlock).toHaveBeenCalled();
            expect(mockBlockchain.addBlock).toHaveBeenCalled();

            // Verify transaction validation
            expect(mockTransactions[0].verify).toHaveBeenCalled();
            expect(mockTransactions[1].verify).toHaveBeenCalled();
            expect(mockTransactions[2].verify).toHaveBeenCalled();
        });

        it("should filter out invalid transactions", async () => {
            // Arrange
            const command = new MineCommand(privateKey);

            // Act
            const result = await command.execute();

            // Assert
            const validTransactionCount = mockTransactions.filter(tx => tx.verify()).length;
            expect(result.data?.transactions.length).toBe(validTransactionCount);
        });

        it("should filter out existing transactions", async () => {
            // Arrange
            mockTransactionManagement.exists.mockResolvedValueOnce(true);
            const command = new MineCommand(privateKey);

            // Act
            const result = await command.execute();

            // Assert
            expect(mockTransactionManagement.exists).toHaveBeenCalled();
            expect(result.data?.transactions.length).toBeLessThan(mockTransactions.filter(tx => tx.verify()).length);
        });

        it("should handle empty mempool", async () => {
            // Arrange
            mockMempool.get.mockReturnValue([]);
            const command = new MineCommand(privateKey);

            // Act
            const result = await command.execute();

            // Assert
            expect(result.data?.transactions).toHaveLength(0);
            expect(mockMempool.clear).toHaveBeenCalled();
        });

        it("should sign the response with the private key", async () => {
            // Arrange
            const command = new MineCommand(privateKey);

            // Act
            const result = await command.execute();

            // Assert
            expect(result.signature).toBeDefined();
            // expect(result.publicKey).toBeDefined();
        });
    });
});
