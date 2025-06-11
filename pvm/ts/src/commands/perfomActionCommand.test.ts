import { NonPlayerActionType, PlayerActionType, TransactionResponse } from "@bitcoinbrisbane/block52";
import { PerformActionCommand } from "./performActionCommand";
import { getMempoolInstance } from "../core/mempool";
import { Transaction } from "../models";
import { getGameManagementInstance } from "../state/index";
import TexasHoldemGame from "../engine/texasHoldem";
import { signResult } from "./abstractSignedCommand";
import { toOrderedTransaction } from "../utils/parsers";

// Mock all external dependencies
jest.mock("../core/mempool");
jest.mock("../state/index");
jest.mock("../engine/texasHoldem");
jest.mock("./abstractSignedCommand");
jest.mock("../utils/parsers");
jest.mock("../models");

describe("PerformActionCommand", () => {
    let command: PerformActionCommand;
    let mockGameManagement: any;
    let mockMempool: any;
    let mockGame: any;
    let mockTransaction: any;

    const mockFrom = "0x1234567890123456789012345678901234567890";
    const mockTo = "0x0987654321098765432109876543210987654321";
    const mockIndex = 1;
    const mockAmount = 1000000n;
    const mockNonce = 42;
    const mockPrivateKey = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock gameManagement
        mockGameManagement = {
            getByAddress: jest.fn(),
            getGameOptions: jest.fn()
        };
        (getGameManagementInstance as jest.Mock).mockReturnValue(mockGameManagement);

        // Mock mempool
        mockMempool = {
            findAll: jest.fn(),
            add: jest.fn()
        };
        (getMempoolInstance as jest.Mock).mockReturnValue(mockMempool);

        // Mock game
        mockGame = {
            performAction: jest.fn()
        };
        (TexasHoldemGame.fromJson as jest.Mock).mockReturnValue(mockGame);

        // Mock transaction
        mockTransaction = {
            nonce: BigInt(mockNonce),
            to: mockTo,
            from: mockFrom,
            value: mockAmount,
            hash: "0xhash123",
            signature: "0xsig123",
            timestamp: BigInt(Date.now()),
            data: "actionType=bet&index=1"
        };
        (Transaction.create as jest.Mock).mockResolvedValue(mockTransaction);

        // Mock signResult
        (signResult as jest.Mock).mockReturnValue({
            result: {} as TransactionResponse,
            signature: "0xsignature"
        });

        // Mock toOrderedTransaction
        (toOrderedTransaction as jest.Mock).mockImplementation((tx) => ({
            ...tx,
            type: PlayerActionType.BET,
            index: 1,
            value: 1000n,
            data: "test"
        }));
    });

    describe("constructor", () => {
        it("should initialize with correct parameters", () => {
            command = new PerformActionCommand(
                mockFrom,
                mockTo,
                mockIndex,
                mockAmount,
                PlayerActionType.BET,
                mockNonce,
                mockPrivateKey
            );

            expect(getGameManagementInstance).toHaveBeenCalled();
            expect(getMempoolInstance).toHaveBeenCalled();
        });

        it("should handle optional data parameter", () => {
            const mockData = "seat=3";
            command = new PerformActionCommand(
                mockFrom,
                mockTo,
                mockIndex,
                mockAmount,
                NonPlayerActionType.JOIN,
                mockNonce,
                mockPrivateKey,
                mockData
            );

            expect(command).toBeDefined();
        });
    });

    describe("execute", () => {
        beforeEach(() => {
            // Setup default successful mocks
            mockGameManagement.getByAddress.mockResolvedValue({
                address: mockTo,
                state: { players: [] }
            });
            mockGameManagement.getGameOptions.mockResolvedValue({
                minBuyIn: 100000n,
                maxBuyIn: 10000000n
            });
            mockMempool.findAll.mockReturnValue([]);
        });

        describe("BET action", () => {
            beforeEach(() => {
                command = new PerformActionCommand(
                    mockFrom,
                    mockTo,
                    mockIndex,
                    mockAmount,
                    PlayerActionType.BET,
                    mockNonce,
                    mockPrivateKey
                );
            });

            it("should execute BET action successfully", async () => {
                const result = await command.execute();

                expect(mockGameManagement.getByAddress).toHaveBeenCalledWith(mockTo);
                expect(TexasHoldemGame.fromJson).toHaveBeenCalled();
                expect(mockGame.performAction).toHaveBeenCalledWith(
                    mockFrom,
                    PlayerActionType.BET,
                    mockIndex,
                    mockAmount,
                    undefined
                );
                expect(Transaction.create).toHaveBeenCalledWith(
                    mockTo,
                    mockFrom,
                    0n, // Poker actions use 0 transaction value
                    BigInt(mockNonce),
                    mockPrivateKey,
                    expect.stringContaining("actionType=bet")
                );
                expect(mockMempool.add).toHaveBeenCalledWith(mockTransaction);
                expect(signResult).toHaveBeenCalled();
                expect(result).toBeDefined();
            });

            it("should include inGameAmount in data for BET action", async () => {
                await command.execute();

                expect(Transaction.create).toHaveBeenCalledWith(
                    mockTo,
                    mockFrom,
                    0n,
                    BigInt(mockNonce),
                    mockPrivateKey,
                    expect.stringContaining(`inGameAmount=${mockAmount}`)
                );
            });
        });

        describe("JOIN action", () => {
            beforeEach(() => {
                command = new PerformActionCommand(
                    mockFrom,
                    mockTo,
                    mockIndex,
                    mockAmount,
                    NonPlayerActionType.JOIN,
                    mockNonce,
                    mockPrivateKey,
                    "3" // seat number
                );
            });

            it("should execute JOIN action successfully", async () => {
                const result = await command.execute();

                expect(mockGame.performAction).toHaveBeenCalledWith(
                    mockFrom,
                    NonPlayerActionType.JOIN,
                    mockIndex,
                    mockAmount,
                    "3"
                );
                expect(Transaction.create).toHaveBeenCalledWith(
                    mockTo,
                    mockFrom,
                    mockAmount, // JOIN uses full amount as transaction value
                    BigInt(mockNonce),
                    mockPrivateKey,
                    expect.stringContaining("seat=3")
                );
                expect(result).toBeDefined();

                // assert that the account 
            });

            it("should include seat in data for JOIN action", async () => {
                await command.execute();

                expect(Transaction.create).toHaveBeenCalledWith(
                    mockTo,
                    mockFrom,
                    mockAmount,
                    BigInt(mockNonce),
                    mockPrivateKey,
                    expect.stringContaining("seat=3")
                );
            });
        });

        describe("LEAVE action", () => {
            beforeEach(() => {
                command = new PerformActionCommand(
                    mockFrom,
                    mockTo,
                    mockIndex,
                    mockAmount,
                    NonPlayerActionType.LEAVE,
                    mockNonce,
                    mockPrivateKey
                );
            });

            it("should execute LEAVE action successfully", async () => {
                const result = await command.execute();

                expect(mockGame.performAction).toHaveBeenCalledWith(
                    mockFrom,
                    NonPlayerActionType.LEAVE,
                    mockIndex,
                    mockAmount,
                    undefined
                );
                expect(Transaction.create).toHaveBeenCalledWith(
                    mockFrom, // LEAVE reverses to/from
                    mockTo,
                    mockAmount,
                    BigInt(mockNonce + 1), // LEAVE increments nonce
                    mockPrivateKey,
                    expect.stringContaining("actionType=leave")
                );
                expect(result).toBeDefined();
            });
        });

        describe("CALL action", () => {
            beforeEach(() => {
                command = new PerformActionCommand(
                    mockFrom,
                    mockTo,
                    mockIndex,
                    mockAmount,
                    PlayerActionType.CALL,
                    mockNonce,
                    mockPrivateKey
                );
            });

            it("should execute CALL action successfully", async () => {
                await command.execute();

                expect(Transaction.create).toHaveBeenCalledWith(
                    mockTo,
                    mockFrom,
                    0n, // CALL uses 0 transaction value
                    BigInt(mockNonce),
                    mockPrivateKey,
                    expect.stringContaining("inGameAmount")
                );
            });
        });

        describe("RAISE action", () => {
            beforeEach(() => {
                command = new PerformActionCommand(
                    mockFrom,
                    mockTo,
                    mockIndex,
                    mockAmount,
                    PlayerActionType.RAISE,
                    mockNonce,
                    mockPrivateKey
                );
            });

            it("should execute RAISE action successfully", async () => {
                await command.execute();

                expect(Transaction.create).toHaveBeenCalledWith(
                    mockTo,
                    mockFrom,
                    0n, // RAISE uses 0 transaction value
                    BigInt(mockNonce),
                    mockPrivateKey,
                    expect.stringContaining("inGameAmount")
                );
            });
        });

        describe("FOLD action", () => {
            beforeEach(() => {
                command = new PerformActionCommand(
                    mockFrom,
                    mockTo,
                    mockIndex,
                    0n, // FOLD typically has 0 amount
                    PlayerActionType.FOLD,
                    mockNonce,
                    mockPrivateKey
                );
            });

            it("should execute FOLD action successfully", async () => {
                await command.execute();

                expect(mockGame.performAction).toHaveBeenCalledWith(
                    mockFrom,
                    PlayerActionType.FOLD,
                    mockIndex,
                    0n,
                    undefined
                );
                expect(Transaction.create).toHaveBeenCalledWith(
                    mockTo,
                    mockFrom,
                    0n, // FOLD uses 0 transaction value
                    BigInt(mockNonce),
                    mockPrivateKey,
                    expect.stringContaining("actionType=fold")
                );
            });

            it("should not include inGameAmount for FOLD action", async () => {
                await command.execute();

                const callArgs = (Transaction.create as jest.Mock).mock.calls[0];
                const dataParam = callArgs[5];
                expect(dataParam).not.toContain("inGameAmount");
            });
        });

        describe("mempool transaction processing", () => {
            beforeEach(() => {
                command = new PerformActionCommand(
                    mockFrom,
                    mockTo,
                    mockIndex,
                    mockAmount,
                    PlayerActionType.BET,
                    mockNonce,
                    mockPrivateKey
                );
            });

            it("should process mempool transactions in order", async () => {
                const mockMempoolTx1 = { to: mockTo, data: "action1", index: 2 };
                const mockMempoolTx2 = { to: mockTo, data: "action2", index: 1 };
                
                mockMempool.findAll.mockReturnValue([mockMempoolTx1, mockMempoolTx2]);
                
                (toOrderedTransaction as jest.Mock)
                    .mockReturnValueOnce({ ...mockMempoolTx1, type: PlayerActionType.CALL, index: 2, value: 100n, data: "call" })
                    .mockReturnValueOnce({ ...mockMempoolTx2, type: PlayerActionType.CHECK, index: 1, value: 0n, data: "check" });

                await command.execute();

                // Should process in index order (1, then 2)
                expect(mockGame.performAction).toHaveBeenCalledTimes(3); // 2 mempool + 1 current
                expect(mockGame.performAction).toHaveBeenNthCalledWith(1, undefined, PlayerActionType.CHECK, 1, 0n, "check");
                expect(mockGame.performAction).toHaveBeenNthCalledWith(2, undefined, PlayerActionType.CALL, 2, 100n, "call");
            });

            it("should continue processing if mempool transaction fails", async () => {
                const mockMempoolTx = { to: mockTo, data: "action1" };
                mockMempool.findAll.mockReturnValue([mockMempoolTx]);
                
                (toOrderedTransaction as jest.Mock).mockReturnValue({
                    type: PlayerActionType.BET,
                    index: 1,
                    value: 100n,
                    data: "bet",
                    from: "badPlayer"
                });

                // Make the first performAction call throw an error
                mockGame.performAction
                    .mockImplementationOnce(() => { throw new Error("Invalid player"); })
                    .mockImplementationOnce(() => {}); // Second call succeeds

                await command.execute();

                // Should still call performAction for the current command
                expect(mockGame.performAction).toHaveBeenCalledTimes(2);
            });
        });

        describe("error cases", () => {
            it("should throw error if not a game transaction", async () => {
                mockGameManagement.getByAddress.mockResolvedValue(null);
                
                command = new PerformActionCommand(
                    mockFrom,
                    mockTo,
                    mockIndex,
                    mockAmount,
                    PlayerActionType.BET,
                    mockNonce,
                    mockPrivateKey
                );

                await expect(command.execute()).rejects.toThrow("Not a game transaction");
            });

            it("should throw error if game state not found", async () => {
                mockGameManagement.getByAddress.mockResolvedValue(null);
                
                command = new PerformActionCommand(
                    mockFrom,
                    mockTo,
                    mockIndex,
                    mockAmount,
                    PlayerActionType.BET,
                    mockNonce,
                    mockPrivateKey
                );

                await expect(command.execute()).rejects.toThrow("Not a game transaction");
            });

            it("should throw error for unsupported action type", async () => {
                // This test would require creating an invalid action type, which might not be possible
                // due to TypeScript typing, but we can test the error path if needed
                command = new PerformActionCommand(
                    mockFrom,
                    mockTo,
                    mockIndex,
                    mockAmount,
                    "INVALID_ACTION" as any,
                    mockNonce,
                    mockPrivateKey
                );

                // Mock the game to not handle LEAVE action path
                await expect(command.execute()).rejects.toThrow("Unsupported action type");
            });
        });

        describe("data parameter handling", () => {
            it("should handle NEW_HAND action with seed", async () => {
                command = new PerformActionCommand(
                    mockFrom,
                    mockTo,
                    mockIndex,
                    mockAmount,
                    NonPlayerActionType.NEW_HAND,
                    mockNonce,
                    mockPrivateKey,
                    "randomSeed123"
                );

                await command.execute();

                expect(Transaction.create).toHaveBeenCalledWith(
                    mockTo,
                    mockFrom,
                    0n,
                    BigInt(mockNonce),
                    mockPrivateKey,
                    expect.stringContaining("seed=randomSeed123")
                );
            });

            it("should handle TOPUP action with correct transaction value", async () => {
                command = new PerformActionCommand(
                    mockFrom,
                    mockTo,
                    mockIndex,
                    mockAmount,
                    NonPlayerActionType.TOPUP,
                    mockNonce,
                    mockPrivateKey
                );

                await command.execute();

                expect(Transaction.create).toHaveBeenCalledWith(
                    mockTo,
                    mockFrom,
                    mockAmount, // TOPUP uses full amount as transaction value
                    BigInt(mockNonce),
                    mockPrivateKey,
                    expect.stringContaining("actionType=topup")
                );
            });
        });
    });

    describe("data formatting", () => {
        it("should create proper URLSearchParams format", async () => {
            command = new PerformActionCommand(
                mockFrom,
                mockTo,
                mockIndex,
                mockAmount,
                PlayerActionType.BET,
                mockNonce,
                mockPrivateKey
            );

            mockGameManagement.getByAddress.mockResolvedValue({
                address: mockTo,
                state: { players: [] }
            });
            mockGameManagement.getGameOptions.mockResolvedValue({});
            mockMempool.findAll.mockReturnValue([]);

            await command.execute();

            const callArgs = (Transaction.create as jest.Mock).mock.calls[0];
            const dataParam = callArgs[5];
            
            expect(dataParam).toContain("actionType=bet");
            expect(dataParam).toContain(`index=${mockIndex}`);
            expect(dataParam).toContain(`inGameAmount=${mockAmount}`);
        });
    });
});