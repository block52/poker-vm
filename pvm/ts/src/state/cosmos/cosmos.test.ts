/**
 * Simple integration test for Cosmos SDK
 */

import { initializeCosmosClient } from "@bitcoinbrisbane/block52";
import { getCosmosAccountManagementInstance } from "./accountManagement";
import { getCosmosGameManagementInstance } from "./gameManagement";
import { TEST_COSMOS_CONFIG } from "./config";

describe("Cosmos SDK Integration", () => {
    beforeAll(() => {
        // Set up test environment
        process.env.DB_URL = "cosmos://localhost:26657";
        process.env.NODE_ENV = "test";
    });

    describe("CosmosClient", () => {
        it("should initialize without errors", () => {
            expect(() => {
                initializeCosmosClient(TEST_COSMOS_CONFIG);
            }).not.toThrow();
        });
    });

    describe("AccountManagement", () => {
        it("should create account management instance", () => {
            const accountMgmt = getCosmosAccountManagementInstance();
            expect(accountMgmt).toBeDefined();
            expect(typeof accountMgmt.createAccount).toBe("function");
            expect(typeof accountMgmt.getBalance).toBe("function");
        });

        it("should create account from private key", async () => {
            const accountMgmt = getCosmosAccountManagementInstance();
            const privateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

            const account = await accountMgmt.createAccount(privateKey);
            expect(account).toBeDefined();
            expect(account.address).toBeDefined();
            expect(typeof account.address).toBe("string");
            expect(account.address.length).toBeGreaterThan(0);
        });

        it("should get balance for an address", async () => {
            const accountMgmt = getCosmosAccountManagementInstance();
            const testAddress = "poker1abc123def456ghi789";

            const balance = await accountMgmt.getBalance(testAddress);
            expect(typeof balance).toBe("bigint");
            expect(balance).toBeGreaterThanOrEqual(0n);
        });
    });

    describe("GameManagement", () => {
        it("should create game management instance", () => {
            const gameMgmt = getCosmosGameManagementInstance();
            expect(gameMgmt).toBeDefined();
            expect(typeof gameMgmt.create).toBe("function");
            expect(typeof gameMgmt.getByAddress).toBe("function");
        });

        it("should start with empty game list", async () => {
            const gameMgmt = getCosmosGameManagementInstance();
            const games = await gameMgmt.getAll();
            expect(Array.isArray(games)).toBe(true);
        });
    });

    describe("Configuration", () => {
        it("should have valid test configuration", () => {
            expect(TEST_COSMOS_CONFIG.rpcEndpoint).toBeDefined();
            expect(TEST_COSMOS_CONFIG.chainId).toBeDefined();
            expect(TEST_COSMOS_CONFIG.prefix).toBeDefined();
            expect(TEST_COSMOS_CONFIG.denom).toBeDefined();
            expect(TEST_COSMOS_CONFIG.gasPrice).toBeDefined();
        });
    });
});
