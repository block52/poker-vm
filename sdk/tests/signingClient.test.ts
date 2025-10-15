import { SigningCosmosClient, createSigningClientFromMnemonic } from "../src/signingClient";
import { getDefaultCosmosConfig } from "../src/cosmosClient";
import { createWalletFromMnemonic } from "../src/walletUtils";

describe("SigningCosmosClient", () => {
    const testMnemonic =
        "vanish legend pelican blush control spike useful usage into any remove wear flee short october naive swear wall spy cup sort avoid agent credit";
    const expectedAddress = "b521hg93rsm2f5v3zlepf20ru88uweajt3nf492s2p";

    describe("Client Creation", () => {
        it("should create a signing client from mnemonic", async () => {
            const config = getDefaultCosmosConfig("localhost");
            const client = await createSigningClientFromMnemonic(config, testMnemonic);

            expect(client).toBeDefined();
            expect(client).toBeInstanceOf(SigningCosmosClient);
        });

        it("should get wallet address", async () => {
            const config = getDefaultCosmosConfig("localhost");
            const client = await createSigningClientFromMnemonic(config, testMnemonic);

            const address = await client.getWalletAddress();
            expect(address).toBe(expectedAddress);
        });

        it("should have a wallet attached", async () => {
            const config = getDefaultCosmosConfig("localhost");
            const client = await createSigningClientFromMnemonic(config, testMnemonic);

            const wallet = client.getWallet();
            expect(wallet).toBeDefined();
        });
    });

    describe("Wallet Management", () => {
        it("should allow setting a new wallet", async () => {
            const config = getDefaultCosmosConfig("localhost");
            const client = await createSigningClientFromMnemonic(config, testMnemonic);

            // Create a new wallet
            const newWalletInfo = await createWalletFromMnemonic(
                "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
                "b52"
            );

            // Set the new wallet
            client.setWallet(newWalletInfo.wallet);

            // Verify the wallet was changed
            const newAddress = await client.getWalletAddress();
            expect(newAddress).not.toBe(expectedAddress);
            expect(newAddress).toBe("b5219rl4cm2hmr8afy4kldpxz3fka4jguq0avffg09");
        });
    });

    describe("Read-only Methods", () => {
        it("should inherit getBalance from CosmosClient", async () => {
            const config = getDefaultCosmosConfig("localhost");
            const client = await createSigningClientFromMnemonic(config, testMnemonic);

            // This should work as it's inherited from CosmosClient
            expect(client.getBalance).toBeDefined();
            expect(typeof client.getBalance).toBe("function");
        });

        it("should inherit listGames from CosmosClient", async () => {
            const config = getDefaultCosmosConfig("localhost");
            const client = await createSigningClientFromMnemonic(config, testMnemonic);

            expect(client.listGames).toBeDefined();
            expect(typeof client.listGames).toBe("function");
        });

        it("should inherit getGameState from CosmosClient", async () => {
            const config = getDefaultCosmosConfig("localhost");
            const client = await createSigningClientFromMnemonic(config, testMnemonic);

            expect(client.getGameState).toBeDefined();
            expect(typeof client.getGameState).toBe("function");
        });
    });

    describe("Transaction Methods", () => {
        it("should have createGame method", async () => {
            const config = getDefaultCosmosConfig("localhost");
            const client = await createSigningClientFromMnemonic(config, testMnemonic);

            expect(client.createGame).toBeDefined();
            expect(typeof client.createGame).toBe("function");
        });

        it("should have joinGame method", async () => {
            const config = getDefaultCosmosConfig("localhost");
            const client = await createSigningClientFromMnemonic(config, testMnemonic);

            expect(client.joinGame).toBeDefined();
            expect(typeof client.joinGame).toBe("function");
        });

        it("should have performAction method", async () => {
            const config = getDefaultCosmosConfig("localhost");
            const client = await createSigningClientFromMnemonic(config, testMnemonic);

            expect(client.performAction).toBeDefined();
            expect(typeof client.performAction).toBe("function");
        });

        it("should have sendTokens method", async () => {
            const config = getDefaultCosmosConfig("localhost");
            const client = await createSigningClientFromMnemonic(config, testMnemonic);

            expect(client.sendTokens).toBeDefined();
            expect(typeof client.sendTokens).toBe("function");
        });

        it("should have sendB52USDC method", async () => {
            const config = getDefaultCosmosConfig("localhost");
            const client = await createSigningClientFromMnemonic(config, testMnemonic);

            expect(client.sendB52USDC).toBeDefined();
            expect(typeof client.sendB52USDC).toBe("function");
        });
    });

    describe("Disconnect", () => {
        it("should disconnect successfully", async () => {
            const config = getDefaultCosmosConfig("localhost");
            const client = await createSigningClientFromMnemonic(config, testMnemonic);

            await expect(client.disconnect()).resolves.not.toThrow();
        });
    });

    describe("Configuration", () => {
        it("should use custom gas price", async () => {
            const config = {
                ...getDefaultCosmosConfig("localhost"),
                gasPrice: "0.05b52usdc"
            };
            const client = await createSigningClientFromMnemonic(config, testMnemonic);

            expect(client).toBeDefined();
        });

        it("should work with different prefixes", async () => {
            const config = {
                ...getDefaultCosmosConfig("localhost"),
                prefix: "cosmos"
            };

            // Use a different mnemonic derivation for cosmos prefix
            const walletInfo = await createWalletFromMnemonic(testMnemonic, "cosmos");
            const client = await createSigningClientFromMnemonic(config, testMnemonic);

            const address = await client.getWalletAddress();
            expect(address).toMatch(/^cosmos1/);
        });
    });
});
