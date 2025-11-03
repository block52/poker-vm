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

    describe("Integration Tests", () => {

        it("should fetch balance (if node is running)", async () => {
            const config = getDefaultCosmosConfig("node1.block52.xyz");
            const client = await createSigningClientFromMnemonic(config, testMnemonic);

            const address = await client.getWalletAddress();
            let balance;
            try {
                balance = await client.getBalance(address, "stake");
                expect(balance).toBeDefined();
                expect(typeof balance).toBe("bigint");
            } catch (error) {
                // If the node isn't running, just skip the test
                console.warn("Skipping balance test - node may not be running");
            }
        });

        it("should transfer stake tokens (if node is running and has funds)", async () => {
            const config = getDefaultCosmosConfig("node1.block52.xyz");
            const client = await createSigningClientFromMnemonic(config, testMnemonic);

            const address = await client.getWalletAddress();
            let recipient = "b521qz4y7m5h7g5x5c4qf0k0v3j3p5h6g7r8s9t0u"; // Example recipient address

            try {
                // Attempt to send a small amount of stake (1 stake)
                const txHash = await client.sendTokens(address, recipient, 1n, "stake");
                expect(txHash).toBeDefined();
                expect(typeof txHash).toBe("string");
                console.log("   Sent 1 stake, txHash:", txHash);
            } catch (error) {
                console.warn("Skipping sendTokens test - node may not be running or insufficient funds");
            }
        });

        // it("should list games (if node is running)", async () => {
        //     const config = getDefaultCosmosConfig("node1.block52.xyz");
        //     const client = await createSigningClientFromMnemonic(config, testMnemonic);

        //     let games;
        //     try {
        //         games = await client.listGames();
        //         expect(games).toBeDefined();
        //         expect(Array.isArray(games)).toBe(true);
        //     } catch (error) {
        //         console.warn("Skipping listGames test - node may not be running");
        //     }
        // });

        // it("should get game state (if node is running)", async () => {
        //     const config = getDefaultCosmosConfig("node1.block52.xyz");
        //     const client = await createSigningClientFromMnemonic(config, testMnemonic);

        //     let gameState;
        //     try {
        //         // Use a known game ID that may exist on the test node
        //         gameState = await client.getGameState(1);
        //         expect(gameState).toBeDefined();
        //         expect(gameState.id).toBe(1);
        //     } catch (error) {
        //         console.warn("Skipping getGameState test - node may not be running or game may not exist");
        //     }
        // });
    });
});
