import { AccountManagement, getMongoAccountManagementInstance } from "./accountManagement";
import { Account } from "../../models/account";
import Accounts from "../../schema/accounts";
import { Transaction } from "../../models/transaction";
import { CONTRACT_ADDRESSES } from "../../core/constants";

// Mock the MongoDB models
jest.mock("../../schema/accounts", () => ({
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

describe.skip("AccountManagement", () => {
    let accountManagement: AccountManagement;

    // Test data
    const mockAddress = "0x980b8D8A16f5891F41871d878a479d81Da52334c";
    const mockPrivateKey = "private-key";
    const mockBalance = "1000";

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Create a new instance for each test
        accountManagement = new AccountManagement("");
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
            const mockAccount = new Account(mockAddress, BigInt(mockBalance));

            (Accounts.findOne as jest.Mock)
                .mockResolvedValueOnce(mockAccountDoc) // First call in _getAccount
                .mockResolvedValueOnce(mockAccountDoc); // Second call in getAccount

            jest.spyOn(Account, "create").mockReturnValue({
                address: mockAddress,
                balance: BigInt(mockBalance),
                toDocument: jest.fn()
            } as any);

            jest.spyOn(Account, "fromDocument").mockReturnValue(mockAccount);

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
            await expect(accountManagement.incrementBalance(mockAddress, -1n))
                .rejects.toThrow("Balance must be positive");
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
                balance: amount.toString(),
                nonce: 0
            });
        });

        it("should increment existing account balance", async () => {
            // Arrange
            const existingBalance = "500";
            const incrementAmount = 100n;
            const newBalance = BigInt(existingBalance) + incrementAmount;

            (Accounts.findOne as jest.Mock).mockResolvedValueOnce({
                address: mockAddress,
                balance: existingBalance
            });

            // Act
            await accountManagement.incrementBalance(mockAddress, incrementAmount);

            // Assert
            expect(Accounts.updateOne).toHaveBeenCalledWith(
                { address: mockAddress },
                { $set: { balance: newBalance.toString() } }
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
            await expect(accountManagement.decrementBalance(mockAddress, -1n))
                .rejects.toThrow("Balance must be positive");
        });

        it("should throw error if account not found", async () => {
            // Arrange
            (Accounts.findOne as jest.Mock).mockResolvedValueOnce(null);

            // Act & Assert
            await expect(accountManagement.decrementBalance(mockAddress, 100n))
                .rejects.toThrow("Account not found");
        });

        it("should throw error if insufficient funds", async () => {
            // Arrange
            const balance = "50";
            const amount = 100n;

            (Accounts.findOne as jest.Mock).mockResolvedValueOnce({
                address: mockAddress,
                balance: balance
            });

            // Act & Assert
            await expect(accountManagement.decrementBalance(mockAddress, amount))
                .rejects.toThrow("Insufficient funds");
        });

        it("should decrement balance correctly", async () => {
            // Arrange
            const balance = "500";
            const amount = 100n;
            const newBalance = BigInt(balance) - amount;

            (Accounts.findOne as jest.Mock).mockResolvedValueOnce({
                address: mockAddress,
                balance: balance
            });

            // Act
            await accountManagement.decrementBalance(mockAddress, amount);

            // Assert
            expect(Accounts.updateOne).toHaveBeenCalledWith(
                { address: mockAddress },
                { $set: { balance: newBalance.toString() } }
            );
        });

        it("should skip operations for bridge address", async () => {
            // Act
            await accountManagement.decrementBalance(CONTRACT_ADDRESSES.bridgeAddress, 100n);

            // Assert
            expect(Accounts.findOne).not.toHaveBeenCalled();
            expect(Accounts.updateOne).not.toHaveBeenCalled();
        });
    });

    describe("applyTransaction", () => {
        it("should apply transaction correctly", async () => {
            // Arrange
            const mockTx = {
                from: "sender-address",
                to: "receiver-address",
                value: 100n
            } as Transaction;

            // Mock the methods to prevent actual calls
            jest.spyOn(accountManagement, 'decrementBalance').mockImplementation(async () => { });
            jest.spyOn(accountManagement, 'incrementBalance').mockImplementation(async () => { });

            // Act
            await accountManagement.applyTransaction(mockTx);

            // Assert
            expect(accountManagement.decrementBalance).toHaveBeenCalledWith(mockTx.from, mockTx.value);
            expect(accountManagement.incrementBalance).toHaveBeenCalledWith(mockTx.to, mockTx.value);
        });

        it("should handle transaction without sender", async () => {
            // Arrange
            const mockTx = {
                to: "receiver-address",
                value: 100n
            } as Transaction;

            // Mock the methods to prevent actual calls
            jest.spyOn(accountManagement, 'decrementBalance').mockImplementation(async () => { });
            jest.spyOn(accountManagement, 'incrementBalance').mockImplementation(async () => { });

            // Act
            await accountManagement.applyTransaction(mockTx);

            // Assert
            expect(accountManagement.decrementBalance).not.toHaveBeenCalled();
            expect(accountManagement.incrementBalance).toHaveBeenCalledWith(mockTx.to, mockTx.value);
        });

        it("should handle transaction without receiver", async () => {
            // Arrange
            const mockTx = {
                from: "sender-address",
                value: 100n
            } as Transaction;

            // Mock the methods to prevent actual calls
            jest.spyOn(accountManagement, 'decrementBalance').mockImplementation(async () => { });
            jest.spyOn(accountManagement, 'incrementBalance').mockImplementation(async () => { });

            // Act
            await accountManagement.applyTransaction(mockTx);

            // Assert
            expect(accountManagement.decrementBalance).toHaveBeenCalledWith(mockTx.from, mockTx.value);
            expect(accountManagement.incrementBalance).not.toHaveBeenCalled();
        });
    });

    describe("applyTransactions", () => {
        it("should apply multiple transactions", async () => {
            // Arrange
            const mockTxs = [
                { from: "sender1", to: "receiver1", value: 100n },
                { from: "sender2", to: "receiver2", value: 200n }
            ] as Transaction[];

            // Mock applyTransaction to prevent actual calls
            jest.spyOn(accountManagement, 'applyTransaction').mockImplementation(async () => { });

            // Act
            await accountManagement.applyTransactions(mockTxs);

            // Assert
            expect(accountManagement.applyTransaction).toHaveBeenCalledTimes(2);
            expect(accountManagement.applyTransaction).toHaveBeenCalledWith(mockTxs[0]);
            expect(accountManagement.applyTransaction).toHaveBeenCalledWith(mockTxs[1]);
        });
    });

    describe("getAccountManagementInstance", () => {
        it("should return singleton instance", () => {
            // Arrange & Act
            const instance1 = getMongoAccountManagementInstance();
            const instance2 = getMongoAccountManagementInstance();

            // Assert
            expect(instance1).toBe(instance2);
        });
    });
});