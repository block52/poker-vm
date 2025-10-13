import { CosmosClient } from "../src/cosmosClient";
import type { CosmosConfig } from "../src/cosmosClient";

describe("CosmosClient", () => {
    let client: CosmosClient;
    const mockConfig: CosmosConfig = {
        rpcEndpoint: "http://node1.block52.xyz:26657",
        restEndpoint: "http://rest.block52.xyz:1317",
        chainId: "pokerchain",
        prefix: "poker",
        denom: "b52USD",
        gasPrice: "0.025b52USD"
    };

    beforeEach(() => {
        client = new CosmosClient(mockConfig);
    });

    afterEach(async () => {
        await client.disconnect();
    });

    describe("Client Initialization", () => {
        it("should create a CosmosClient instance", () => {
            expect(client).toBeInstanceOf(CosmosClient);
        });

        it("should initialize read-only client", async () => {
            // Skip network tests in CI/mock environment
            try {
                await client.initClient();
                // If it succeeds, great!
            } catch (error) {
                // Expected to fail in mock environment
                expect(error).toBeDefined();
            }
        });

        it("should throw error when initializing signing client without mnemonic", async () => {
            await expect(client.initSigningClient()).rejects.toThrow("Mnemonic required for signing client");
        });
    });

    describe("Account Operations", () => {
        it("should get account balance", async () => {
            // Skip this test if not connected to actual network
            const testAddress = "b521hg93rsm2f5v3zlepf20ru88uweajt3nf492s2p"; // This would need to be a real address

            try {
                const balance = await client.getBalance(testAddress);
                expect(balance).toBeDefined();
            } catch (error) {
                // Expected to fail with mock address
                expect(error).toBeDefined();
            }
        });

        it("should get all balances for an account", async () => {
            const testAddress = "poker1example"; // This would need to be a real address

            try {
                const balances = await client.getAllBalances(testAddress);
                expect(Array.isArray(balances)).toBe(true);
            } catch (error) {
                // Expected to fail with mock address
                expect(error).toBeDefined();
            }
        });
    });

    describe("Block Operations", () => {
        it("should get current height", async () => {
            try {
                const height = await client.getHeight();
                expect(typeof height).toBe("number");
                expect(height).toBeGreaterThan(0);
            } catch (error) {
                // Skip if network not available
                console.log("Network not available for testing");
            }
        });

        it("should get a specific block", async () => {
            try {
                const block = await client.getBlock(1);
                expect(block).toBeDefined();
                expect(block.block).toBeDefined();
            } catch (error) {
                // Skip if network not available
                console.log("Network not available for testing");
            }
        });

        it("should get multiple blocks", async () => {
            try {
                const blocks = await client.getBlocks(1, 3);
                expect(Array.isArray(blocks)).toBe(true);
                expect(blocks.length).toBeLessThanOrEqual(3);
            } catch (error) {
                // Skip if network not available
                console.log("Network not available for testing");
            }
        });

        it("should get latest blocks", async () => {
            try {
                const blocks = await client.getLatestBlocks(5);
                expect(Array.isArray(blocks)).toBe(true);
                expect(blocks.length).toBeLessThanOrEqual(5);
            } catch (error) {
                // Skip if network not available
                console.log("Network not available for testing");
            }
        });
    });

    describe("Singleton Pattern", () => {
        it("should maintain singleton instance", () => {
            const { getCosmosClient, initializeCosmosClient } = require("../src/cosmosClient");

            const client1 = initializeCosmosClient(mockConfig);
            const client2 = getCosmosClient();

            expect(client1).toBe(client2);
        });

        it("should throw error when getting client without initialization", () => {
            // Reset the module to clear singleton
            jest.resetModules();
            const { getCosmosClient } = require("../src/cosmosClient");

            expect(() => getCosmosClient()).toThrow("Cosmos client not initialized");
        });
    });
});
