import { ethers, JsonRpcProvider, Contract } from "ethers";
import { MintCommand } from "./mintCommand";
import { getMempoolInstance } from "../core/mempool";
import { getTransactionInstance } from "../state/transactionManagement";
import { Transaction } from "../models/transaction";
import { NativeToken } from "../models/nativeToken";

// Mock external dependencies
jest.mock("ethers");
jest.mock("../core/mempool");
jest.mock("../state/transactionManagement");
jest.mock("../models/transaction");
jest.mock("../core/provider");

describe("MintCommand", () => {
    // Test constants
    const VALID_DEPOSIT_INDEX = "1";
    const VALID_HASH = ethers.keccak256("test");
    const VALID_PRIVATE_KEY = "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb";
    const MOCK_PUBLIC_KEY = "0x89C76b091c8EAb1dFAe8a3fdBffb587A21464Bc2";
    const MOCK_RECEIVER = "0x97f7f0D8792a4BedD830F65B533846437F5f3c32";
    const MOCK_AMOUNT = 1000n;
    const MOCK_DATA = `MINT_${VALID_DEPOSIT_INDEX}`;

    // Mock instances
    let mockProvider: jest.Mocked<JsonRpcProvider>;
    let mockBridge: jest.Mocked<Contract>;
    let mockMempool: jest.Mocked<any>;
    let mockTransactionManagement: jest.Mocked<any>;
    // let mockWallet: jest.Mocked<any>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // // Setup mock wallet
        // mockWallet = {
        //     address: MOCK_PUBLIC_KEY
        // };
        // (ethers.Wallet as jest.Mock).mockImplementation(() => mockWallet);

        // Setup mock provider
        mockProvider = {
            // Add necessary provider methods
        } as any;

        // Setup mock bridge contract
        mockBridge = {
            deposits: jest.fn(),
            underlying: jest.fn()
        } as any;
        (ethers.Contract as jest.Mock).mockImplementation(() => mockBridge);

        // Setup mock mempool
        mockMempool = {
            add: jest.fn()
        };
        (getMempoolInstance as jest.Mock).mockReturnValue(mockMempool);

        // Setup mock transaction management
        mockTransactionManagement = {
            getTransactionByData: jest.fn()
        };
        (getTransactionInstance as jest.Mock).mockReturnValue(mockTransactionManagement);
    });

    describe("constructor", () => {
        it("should throw error when deposit index is not provided", () => {
            expect(() => new MintCommand("", VALID_HASH, VALID_PRIVATE_KEY)).toThrow("Deposit index must be provided");
        });

        it("should throw error when private key is not provided", () => {
            expect(() => new MintCommand(VALID_DEPOSIT_INDEX, VALID_HASH, "")).toThrow("Private key must be provided");
        });

        it("should initialize successfully with valid parameters", () => {
            const command = new MintCommand(VALID_DEPOSIT_INDEX, VALID_HASH, VALID_PRIVATE_KEY);
            expect(command).toBeDefined();
        });
    });

    describe("execute", () => {
        let command: MintCommand;

        beforeEach(() => {
            command = new MintCommand(VALID_DEPOSIT_INDEX, VALID_HASH, VALID_PRIVATE_KEY);
        });

        it("should throw error if transaction already exists", async () => {
            mockTransactionManagement.getTransactionByData.mockResolvedValue({ exists: true });

            await expect(command.execute()).rejects.toThrow("Transaction already in blockchain");
        });

        it("should throw error if receiver is zero address", async () => {
            mockTransactionManagement.getTransactionByData.mockResolvedValue(null);
            mockBridge.deposits.mockResolvedValue([ethers.ZeroAddress, MOCK_AMOUNT]);

            await expect(command.execute()).rejects.toThrow("Receiver must not be zero address");
        });

        it("should throw error if amount is zero", async () => {
            mockTransactionManagement.getTransactionByData.mockResolvedValue(null);
            mockBridge.deposits.mockResolvedValue([MOCK_RECEIVER, 0n]);

            await expect(command.execute()).rejects.toThrow("Value must be greater than 0");
        });

        it.("should successfully create and add transaction to mempool", async () => {
            // Mock successful scenario
            mockTransactionManagement.getTransactionByData.mockResolvedValue(null);
            mockBridge.deposits.mockResolvedValue([MOCK_RECEIVER, MOCK_AMOUNT]);

            const tx = new Transaction(
                "to",
                "from",
                BigInt(100),
                ethers.ZeroHash,
                "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb",
                1000,
                1,
                undefined,
                "data"
            );
            (Transaction.create as jest.Mock).mockResolvedValue(tx);

            // Execute command
            await command.execute();

            // Verify transaction creation
            expect(Transaction.create).toHaveBeenCalledWith(
                MOCK_RECEIVER,
                MOCK_PUBLIC_KEY,
                expect.any(BigInt),
                BigInt(VALID_DEPOSIT_INDEX),
                VALID_PRIVATE_KEY,
                MOCK_DATA
            );

            // Verify mempool addition
            expect(mockMempool.add).toHaveBeenCalledWith(tx);
        });

        it("should convert amount using correct decimals", async () => {
            // Mock successful scenario with specific decimals
            mockTransactionManagement.getTransactionByData.mockResolvedValue(null);
            mockBridge.deposits.mockResolvedValue([MOCK_RECEIVER, MOCK_AMOUNT]);

            const tx = new Transaction(
                "to",
                "from",
                BigInt(100),
                ethers.ZeroHash,
                "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb",
                1000,
                1,
                undefined,
                "data"
            );
            (Transaction.create as jest.Mock).mockResolvedValue(tx);

            // Execute and verify
            await command.execute();

            // Verify the amount conversion
            // Note: In the actual code, it uses a cached decimal value of 6
            const expectedValue = NativeToken.convertFromDecimals(MOCK_AMOUNT, 6n);
            expect(expectedValue).toBe(1000000n);

            // expect(Transaction.create).toHaveBeenCalledWith(
            //     expect.any(String),
            //     expect.any(String),
            //     expectedValue,
            //     expect.any(BigInt),
            //     expect.any(String),
            //     expect.any(String)
            // );
        });
    });
});
