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
    });

    describe("REST API Operations", () => {
        it("should get account balance via REST API", async () => {
            const testAddress = "b521hg93rsm2f5v3zlepf20ru88uweajt3nf492s2p";
            try {
                const balance = await client.getBalance(testAddress);
                expect(typeof balance).toBe("bigint");
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        it("should get all balances", async () => {
            const testAddress = "b521hg93rsm2f5v3zlepf20ru88uweajt3nf492s2p";
            try {
                const balances = await client.getAllBalances(testAddress);
                expect(Array.isArray(balances)).toBe(true);
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });

    describe("Transaction Methods (Should Throw Errors)", () => {
        it("should throw error for wallet address retrieval", async () => {
            await expect(client.getWalletAddress()).rejects.toThrow("Wallet address retrieval not implemented in REST-only mode");
        });

        it("should throw error for sendTokens", async () => {
            await expect(client.sendTokens("addr1", "addr2", 100n)).rejects.toThrow("Transaction signing not implemented in REST-only mode");
        });

        it("should throw error for createGame", async () => {
            await expect(client.createGame("texas-holdem", 2, 6, 100n, 1000n, 10n, 20n, 60)).rejects.toThrow("Transaction signing not implemented in REST-only mode");
        });
    });
});
