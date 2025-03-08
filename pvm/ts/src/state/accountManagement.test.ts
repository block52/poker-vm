import { AccountManagement } from "./accountManagement";
import { Account } from "../models/account";
import Accounts from "../schema/accounts";
import { Transaction } from "../models/transaction";
import { CONTRACT_ADDRESSES } from "../core/constants";

// Mock the MongoDB models
jest.mock("../schema/accounts", () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn()
}));

// Mock the StateManager
jest.mock("./stateManager", () => ({
    StateManager: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(true)
    }))
}));

describe("AccountManagement", () => {
    let accountManagement: AccountManagement;

    // Test data
    const mockAddress = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
    const mockPrivateKey = "private-key";
    const mockBalance = "1000";

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        accountManagement = new AccountManagement();
    });

    describe("createAccount", () => {
        it("should create a new account if it does not exist", async () => {
            // Arrange
            const mockAccount = {
                address: mockAddress,
                balance: mockBalance,
                toDocument: jest.fn().mockReturnValue({ address: mockAddress, balance: mockBalance })
            };
            jest.spyOn(Account, "create").mockReturnValue(mockAccount as any);
            (Accounts.findOne as jest.Mock).mockResolvedValueOnce(null);

            // Act
            await accountManagement.createAccount(mockPrivateKey);

            // Assert
            expect(Accounts.create).toHaveBeenCalledWith({
                address: mockAddress,
                balance: mockBalance
            });
        });

        it("should return existing account if it already exists", async () => {
            // Arrange
            const mockAccountDoc = {
                address: mockAddress,
                balance: mockBalance
            };
            (Accounts.findOne as jest.Mock).mockResolvedValueOnce(mockAccountDoc);
            jest.spyOn(Account, "fromDocument").mockReturnValue(new Account(mockAddress, BigInt(mockBalance)));

            // Act
            const result = await accountManagement.createAccount(mockPrivateKey);

            // Assert
            expect(result.address).toBe(mockAddress);
            expect(result.balance).toBe(BigInt(mockBalance));
            expect(Accounts.create).not.toHaveBeenCalled();
        });
    });

    describe("getAccount", () => {
        it("should return existing account", async () => {
            // Arrange
            const mockAccountDoc = {
                address: mockAddress,
                balance: mockBalance
            };
            (Accounts.findOne as jest.Mock).mockResolvedValueOnce(mockAccountDoc);
            jest.spyOn(Account, "fromDocument").mockReturnValue(new Account(mockAddress, BigInt(mockBalance)));

            // Act
            const result = await accountManagement.getAccount(mockAddress);

            // Assert
            expect(result.address).toBe(mockAddress);
            expect(result.balance).toBe(BigInt(mockBalance));
        });

        it("should return new account with zero balance if not found", async () => {
            // Arrange
            (Accounts.findOne as jest.Mock).mockResolvedValueOnce(null);

            // Act
            const result = await accountManagement.getAccount(mockAddress);

            // Assert
            expect(result.address).toBe(mockAddress);
            expect(result.balance).toBe(0n);
        });
    });

    describe("incrementBalance", () => {
        it("should throw error for negative amount", async () => {
            // Act & Assert
            await expect(accountManagement.incrementBalance(mockAddress, -1n)).rejects.toThrow("Balance must be positive");
        });

        it("should create new account with balance if not exists", async () => {
            // Arrange
            (Accounts.findOne as jest.Mock).mockResolvedValueOnce(null);
            const amount = 100n;

            // Act
            await accountManagement.incrementBalance(mockAddress, amount);

            // Assert
            expect(Accounts.create).toHaveBeenCalledWith({
                address: mockAddress,
                balance: amount.toString()
            });
        });

        it("should increment existing account balance", async () => {
            // Arrange
            const existingBalance = "500";
            const incrementAmount = 100n;
            (Accounts.findOne as jest.Mock).mockResolvedValueOnce({
                address: mockAddress,
                balance: existingBalance
            });

            // Act
            await accountManagement.incrementBalance(mockAddress, incrementAmount);

            // Assert
            expect(Accounts.updateOne).toHaveBeenCalledWith(
                { address: mockAddress },
                { $inc: { balance: (BigInt(existingBalance) + incrementAmount).toString() } }
            );
        });

        it("should skip DB operations for bridge address", async () => {
            // Act
            await accountManagement.incrementBalance(CONTRACT_ADDRESSES.bridgeAddress, 100n);

            // Assert
            expect(Accounts.findOne).not.toHaveBeenCalled();
            expect(Accounts.updateOne).not.toHaveBeenCalled();
        });
    });

    describe("decrementBalance", () => {
        it("should throw error for negative amount", async () => {
            // Act & Assert
            await expect(accountManagement.decrementBalance(mockAddress, -1n)).rejects.toThrow("Balance must be positive");
        });

        it("should decrement balance correctly", async () => {
            // Arrange
            const amount = 100n;

            // Act
            await accountManagement.decrementBalance(mockAddress, amount);

            // Assert
            expect(Accounts.updateOne).toHaveBeenCalledWith({ address: mockAddress }, { $inc: { balance: (-amount).toString() } });
        });
    });

    describe("applyTransaction", () => {
        it("should apply transaction correctly", async () => {
            // Arrange
            const mockTx = {
                from: "sender-address",
                to: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                value: 100n
            } as Transaction;

            // Act
            await accountManagement.applyTransaction(mockTx);

            // Assert
            expect(Accounts.updateOne).toHaveBeenCalledTimes(2); // Once for sender, once for receiver
        });

        it("should handle transaction without sender", async () => {
            // Arrange
            const mockTx = {
                to: "0x980b8D8A16f5891F41871d878a479d81Da52334c",
                value: 100n
            } as Transaction;

            // Act
            await accountManagement.applyTransaction(mockTx);

            // Assert
            expect(Accounts.updateOne).toHaveBeenCalledTimes(1); // Only for receiver
        });

        it("should handle transaction without receiver", async () => {
            // Arrange
            const mockTx = {
                from: "sender-address",
                value: 100n
            } as Transaction;

            // Act
            await accountManagement.applyTransaction(mockTx);

            // Assert
            expect(Accounts.updateOne).toHaveBeenCalledTimes(1); // Only for sender
        });
    });

    describe("applyTransactions", () => {
        it("should apply multiple transactions", async () => {
            // Arrange
            const mockTxs = [
                { from: "sender1", to: "receiver1", value: 100n },
                { from: "sender2", to: "receiver2", value: 200n }
            ] as Transaction[];

            // Act
            await accountManagement.applyTransactions(mockTxs);

            // Assert
            expect(Accounts.updateOne).toHaveBeenCalledTimes(4); // Two updates per transaction
        });
    });

    describe("getAccountManagementInstance", () => {
        it("should return singleton instance", () => {
            // Arrange
            const { getAccountManagementInstance } = require("./accountManagement");

            // Act
            const instance1 = getAccountManagementInstance();
            const instance2 = getAccountManagementInstance();

            // Assert
            expect(instance1).toBe(instance2);
        });
    });
});
