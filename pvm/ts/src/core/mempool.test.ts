import { ethers } from "ethers";
import { Transaction } from "../models";
import { getMempoolInstance, Mempool } from "./mempool";
import { getTransactionInstance } from "../state/transactionManagement";
import Blocks from "../schema/blocks";

// Mock external dependencies
jest.mock("../state/transactionManagement");
jest.mock("../schema/blocks");

describe("Should get new mempool", () => {
    // Mock instances
    let mockTransactionManagement: jest.Mocked<any>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mock transaction management with exists method
        mockTransactionManagement = {
            getTransactionByData: jest.fn(),
            exists: jest.fn().mockResolvedValue(false) // Mock the exists method to return false by default
        };

        (getTransactionInstance as jest.Mock).mockReturnValue(mockTransactionManagement);

        // Mock Blocks.findOne to return a valid block
        (Blocks.findOne as jest.Mock).mockReturnValue({
            sort: jest.fn().mockReturnValue({ index: 1 })
        });

        // Mock Transaction verify method
        jest.spyOn(Transaction.prototype, "verify").mockReturnValue(true);
    });

    it("should get new mempool", () => {
        const mempool = new Mempool();
        expect(mempool).toBeInstanceOf(Mempool);
    });

    it("should get mempool instance", () => {
        const mempool = getMempoolInstance();
        expect(mempool).toBeDefined();
    });

    it("should only allow one transaction in mempool", async () => {
        const mempool = new Mempool(1);
        const tx1: Transaction = new Transaction(ethers.ZeroAddress, ethers.ZeroAddress, 1n, "tx1", ethers.ZeroHash, 10000, 0n, undefined, "mock-data-1");

        const tx2: Transaction = new Transaction(ethers.ZeroAddress, ethers.ZeroAddress, 2n, "tx2", ethers.ZeroHash, 10000, 0n, undefined, "mock-data-2");

        await mempool.add(tx1);
        await mempool.add(tx2);

        expect(mempool.get().length).toBe(1);
    });

    it("should not allow duplicate transactions in mempool", async () => {
        const mempool = new Mempool(10);
        const tx: Transaction = new Transaction(ethers.ZeroAddress, ethers.ZeroAddress, 1n, "tx1", ethers.ZeroHash, 10000, 0n, undefined, "mock-data-1");

        await mempool.add(tx);
        await mempool.add(tx);

        expect(mempool.get().length).toBe(1);
    });

    it("should find transaction in mempool", async () => {
        const mempool = new Mempool(10);
        const tx: Transaction = new Transaction(ethers.ZeroAddress, ethers.ZeroAddress, 1n, "tx1", ethers.ZeroHash, 10000, 0n, undefined, "mock-data-1");

        await mempool.add(tx);

        const foundTx = mempool.find(tx => tx.hash === "tx1");
        expect(foundTx).toBeDefined();
    });

    it("should clear mempool", async () => {
        const mempool = new Mempool(10);
        const tx: Transaction = new Transaction(ethers.ZeroAddress, ethers.ZeroAddress, 1n, "tx1", ethers.ZeroHash, 10000, 0n, undefined, "mock-data-1");

        await mempool.add(tx);
        mempool.clear();

        expect(mempool.get().length).toBe(0);
    });

    it("should not add transaction if it already exists in blockchain", async () => {
        // Mock exists to return true for this test
        mockTransactionManagement.exists.mockResolvedValueOnce(true);

        const mempool = new Mempool(10);
        const tx: Transaction = new Transaction(ethers.ZeroAddress, ethers.ZeroAddress, 1n, "tx1", ethers.ZeroHash, 10000, 0n, undefined, "mock-data-1");

        await mempool.add(tx);

        expect(mempool.get().length).toBe(0);
        expect(mockTransactionManagement.exists).toHaveBeenCalledWith("tx1");
    });

    it("should purge transactions that exist in blockchain", async () => {
        const mempool = new Mempool(10);
        const tx1: Transaction = new Transaction(ethers.ZeroAddress, ethers.ZeroAddress, 1n, "tx1", ethers.ZeroHash, 10000, 0n, undefined, "mock-data-1");

        const tx2: Transaction = new Transaction(ethers.ZeroAddress, ethers.ZeroAddress, 2n, "tx2", ethers.ZeroHash, 10000, 0n, undefined, "mock-data-2");

        await mempool.add(tx1);
        await mempool.add(tx2);

        // Mock tx1 now exists in blockchain
        mockTransactionManagement.exists
            .mockResolvedValueOnce(true) // For tx1
            .mockResolvedValueOnce(false); // For tx2

        await mempool.purge();

        expect(mempool.get().length).toBe(1);
        expect(mempool.getTransaction("tx1")).toBeUndefined();
        expect(mempool.getTransaction("tx2")).toBeDefined();
    });
});
