import { ethers } from "ethers";
import { AccountCommand } from "./accountCommand";
import { getMempoolInstance } from "../core/mempool";
import { getAccountManagementInstance } from "../state/accountManagement";
import { Account, Transaction } from "../models";

// Mock both mempool and account management
jest.mock("../core/mempool");
jest.mock("../state/accountManagement");

describe("AccountCommand Tests", () => {
    const testAddress = ethers.Wallet.createRandom().address;
    const testPrivateKey = ethers.Wallet.createRandom().privateKey;

    let mockMempool: jest.Mocked<any>;
    let mockAccountManagement: jest.Mocked<any>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock account management to return a test account
        const initialAccount = new Account(testAddress, BigInt(1000), 1);
        mockAccountManagement = {
            getAccount: jest.fn().mockResolvedValue(initialAccount)
        };
        (getAccountManagementInstance as jest.Mock).mockReturnValue(mockAccountManagement);

        // Create test transactions
        const transactions = [
            new Transaction("other", testAddress, BigInt(200), "hash1", "sig1", Date.now(), 0n, 1), // incoming
            new Transaction(testAddress, "other", BigInt(300), "hash2", "sig2", Date.now(), 1n, 2), // outgoing
            new Transaction("other", testAddress, BigInt(100), "hash3", "sig3", Date.now(), 2n, 3), // incoming
            new Transaction(testAddress, "other", BigInt(400), "hash4", "sig4", Date.now(), 3n, 4) // outgoing
        ];

        // Mock mempool with better predicate handling
        mockMempool = {
            findAll: jest.fn((predicate: (tx: Transaction) => boolean) => {
                return transactions.filter(tx => {
                    try {
                        return predicate(tx);
                    } catch (error) {
                        console.error("Predicate error:", error);
                        return false;
                    }
                });
            })
        };
        (getMempoolInstance as jest.Mock).mockReturnValue(mockMempool);
    });

    it("should calculate correct balance including pending transactions", async () => {
        const command = new AccountCommand(testAddress, testPrivateKey);

        // Execute command to get final balance calculation:
        // final_balance = initial_balance + incoming_transactions - outgoing_transactions
        // Example: 1000 + 700 - 300 = 1400
        const response = await command.execute();

        // Verify response structure and final balance
        expect(response).toHaveProperty("data");
        expect(response).toHaveProperty("signature");
        expect(response.data).toBeInstanceOf(Account);
        expect(response.data.balance).toBe(BigInt(1400));
    });

    it("should handle account with no pending transactions", async () => {
        mockMempool.findAll.mockReturnValue([]);
        const command = new AccountCommand(testAddress, testPrivateKey);

        const response = await command.execute();
        expect(response.data.balance).toBe(BigInt(1000));
    });

    it("should handle account with only outgoing transactions", async () => {
        // Mock mempool to only have outgoing transactions
        // These are transactions where money is being sent FROM this account
        mockMempool.findAll.mockImplementation((predicate: (tx: Transaction) => boolean) => {
            const transactions = [
                new Transaction("other", testAddress, BigInt(200), "hash1", "sig1", Date.now(), 0n, 1), // -200 from balance
                new Transaction("other", testAddress, BigInt(100), "hash3", "sig3", Date.now(), 1n, 3) // -100 from balance
            ];
            return transactions.filter(predicate);
        });

        const command = new AccountCommand(testAddress, testPrivateKey);

        // Final balance calculation:
        // 1000 (initial) - 300 (outgoing) = 700
        const response = await command.execute();

        expect(response.data.balance).toBe(BigInt(700));
    });
});
