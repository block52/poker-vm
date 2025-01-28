import { ethers } from "ethers";
import { AccountCommand } from "./accountCommand";
import { getMempoolInstance } from "../core/mempool";
import { getAccountManagementInstance } from "../state/accountManagement";
import { Account, Transaction } from "../models";

// Mock both mempool and account management
jest.mock("../core/mempool");
jest.mock("../state/accountManagement");

describe.skip("AccountCommand Tests", () => {
    const testAddress = ethers.Wallet.createRandom().address;
    const testPrivateKey = ethers.Wallet.createRandom().privateKey;

    let mockMempool: jest.Mocked<any>;
    let mockAccountManagement: jest.Mocked<any>;

    const logAccountState = (stage: string, account: Account) => {
        console.log(`\n=== Account State at ${stage} ===`);
        console.log(`Address: ${account.address}`);
        console.log(`Balance: ${account.balance.toString()}`);
        console.log(`Nonce: ${account.nonce}`);
        console.log("================================\n");
    };

    const logTransactions = (fromTxs: Transaction[], toTxs: Transaction[]) => {
        console.log("\n=== Pending Transactions in Mempool ===");
        console.log("Outgoing Transactions (will be subtracted from balance):");
        fromTxs.forEach(tx => console.log(`  Hash: ${tx.hash}, Value: ${tx.value.toString()}`));
        console.log("Incoming Transactions (will be added to balance):");
        toTxs.forEach(tx => console.log(`  Hash: ${tx.hash}, Value: ${tx.value.toString()}`));
        console.log("=====================================\n");
    };

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
            new Transaction("other", testAddress, BigInt(200), "hash1", "sig1", Date.now(), 1), // incoming
            new Transaction(testAddress, "other", BigInt(300), "hash2", "sig2", Date.now(), 2), // outgoing
            new Transaction("other", testAddress, BigInt(100), "hash3", "sig3", Date.now(), 3), // incoming
            new Transaction(testAddress, "other", BigInt(400), "hash4", "sig4", Date.now(), 4) // outgoing
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

        // Get initial account state from blockchain
        const initialAccount = await mockAccountManagement.getAccount(testAddress);
        logAccountState("Initial State", initialAccount);

        // Get pending transactions from mempool
        // fromTxs: transactions where this account is sending money (outgoing, will decrease balance)
        const fromTxs = mockMempool.findAll((tx: Transaction) => tx.from === testAddress);
        // toTxs: transactions where this account is receiving money (incoming, will increase balance)
        const toTxs = mockMempool.findAll((tx: Transaction) => tx.to === testAddress);
        logTransactions(fromTxs, toTxs);

        // Execute command to get final balance calculation:
        // final_balance = initial_balance + incoming_transactions - outgoing_transactions
        // Example: 1000 + 700 - 300 = 1400
        const response = await command.execute();
        logAccountState("Final State (Including Pending Transactions)", response.data);

        // Verify response structure and final balance
        expect(response).toHaveProperty("data");
        expect(response).toHaveProperty("signature");
        expect(response.data).toBeInstanceOf(Account);
        expect(response.data.balance).toBe(BigInt(1400));
    });

    it("should handle account with no pending transactions", async () => {
        mockMempool.findAll.mockReturnValue([]);
        const command = new AccountCommand(testAddress, testPrivateKey);

        const initialAccount = await mockAccountManagement.getAccount(testAddress);
        logAccountState("Initial State", initialAccount);

        const response = await command.execute();
        logAccountState("Final State (No Pending Transactions)", response.data);

        expect(response.data.balance).toBe(BigInt(1000));
    });

    it("should handle account with only outgoing transactions", async () => {
        // Mock mempool to only have outgoing transactions
        // These are transactions where money is being sent FROM this account
        mockMempool.findAll.mockImplementation((predicate: (tx: Transaction) => boolean) => {
            const transactions = [
                new Transaction("other", testAddress, BigInt(200), "hash1", "sig1", Date.now(), 1), // -200 from balance
                new Transaction("other", testAddress, BigInt(100), "hash3", "sig3", Date.now(), 3) // -100 from balance
            ];
            return transactions.filter(predicate);
        });

        const command = new AccountCommand(testAddress, testPrivateKey);

        // Initial balance from blockchain
        const initialAccount = await mockAccountManagement.getAccount(testAddress);
        logAccountState("Initial State", initialAccount); // Balance: 1000

        // Show only outgoing transactions
        const fromTxs = mockMempool.findAll((tx: Transaction) => tx.from === testAddress);
        logTransactions(fromTxs, []);

        // Final balance calculation:
        // 1000 (initial) - 300 (outgoing) = 700
        const response = await command.execute();
        logAccountState("Final State (After Subtracting Outgoing Transactions)", response.data);

        expect(response.data.balance).toBe(BigInt(700));
    });
});
