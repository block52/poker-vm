import { ethers } from "ethers";
import { Transaction } from "../models";
import { getMempoolInstance, Mempool } from "./mempool";

import { getTransactionInstance } from "../state/transactionManagement";

// Mock external dependencies
jest.mock("../state/transactionManagement");

describe("Should get new mempool", () => {
    // Mock instances
    let mockTransactionManagement: jest.Mocked<any>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mock transaction management
        mockTransactionManagement = {
            getTransactionByData: jest.fn()
        };
        (getTransactionInstance as jest.Mock).mockReturnValue(mockTransactionManagement);
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

        const tx: Transaction = new Transaction(ethers.ZeroAddress, ethers.ZeroAddress, 1n, "tx1", ethers.ZeroHash, 10000, 0, undefined, "mock-data-1");

        await mempool.add(tx);
        expect(mempool.get().length).toBe(1);

        // todo: should throw when trying to add more than 1 transaction
    });

    it("should not allow duplicate transactions in mempool", async () => {
        const mempool = new Mempool(10);

        const tx: Transaction = new Transaction(ethers.ZeroAddress, ethers.ZeroAddress, 1n, "tx1", ethers.ZeroHash, 10000, 0, undefined, "mock-data-1");

        await mempool.add(tx);
        await mempool.add(tx);
        expect(mempool.get().length).toBe(1);
    });

    it.skip("should find transaction in mempool", async () => {
        // todo: need to mock .exists on the transaction management
        const mempool = new Mempool(10);

        const tx: Transaction = new Transaction(ethers.ZeroAddress, ethers.ZeroAddress, 1n, "tx1", ethers.ZeroHash, 10000, 0, undefined, "mock-data-1");

        await mempool.add(tx);
        const foundTx = mempool.find((tx) => tx.hash === "tx1");
        expect(foundTx).toBeDefined();
    });

    it("should clear mempool", async () => {
        const mempool = new Mempool(10);

        const tx: Transaction = new Transaction(ethers.ZeroAddress, ethers.ZeroAddress, 1n, "tx1", ethers.ZeroHash, 10000, 0, undefined, "mock-data-1");

        await mempool.add(tx);
        await mempool.clear();
        expect(mempool.get().length).toBe(0);
    });
});
