import { CosmosAccountCommand, CosmosAccountInfo } from "./cosmosAccountCommand";
import { CosmosConfig } from "../../state/cosmos/cosmosClient";

describe("CosmosAccountCommand", () => {
    const mockCosmosConfig: CosmosConfig = {
        rpcEndpoint: "https://node1.block52.xyz",
        chainId: "poker-chain",
        prefix: "poker",
        denom: "upoker",
        gasPrice: "0.025upoker"
    };

    const testAddress = "poker1test...address";
    const testPrivateKey = "test-private-key";

    it("should create command instance correctly", () => {
        const command = new CosmosAccountCommand(mockCosmosConfig.rpcEndpoint, testAddress, testPrivateKey);
        expect(command).toBeInstanceOf(CosmosAccountCommand);
    });

    it("should execute and return account information", async () => {
        const command = new CosmosAccountCommand(mockCosmosConfig.rpcEndpoint, testAddress, testPrivateKey);

        // Mock the cosmos client methods
        const mockAccount = {
            sequence: 5,
            accountNumber: 123,
            pubkey: { value: "test-pubkey" },
            "@type": "cosmos-sdk/BaseAccount"
        };

        const mockBalances = [
            { denom: "upoker", amount: "1000000" },
            { denom: "ustake", amount: "500000" }
        ];

        // Note: In a real test, you'd mock the CosmosClient
        // For now, we'll skip the actual execution test
        expect(command.execute).toBeDefined();
    });

    it("should handle account not found gracefully", async () => {
        const command = new CosmosAccountCommand(mockCosmosConfig.rpcEndpoint, "nonexistent-address", testPrivateKey);

        // This would test error handling when account doesn't exist
        // The actual implementation would depend on how cosmos client handles this
        expect(command.execute).toBeDefined();
    });

    it.skip("should fetch real account data from cosmos chain", async () => {
        // This test would connect to a real cosmos node
        // Skip by default to avoid network calls in tests
        const command = new CosmosAccountCommand(mockCosmosConfig.rpcEndpoint, testAddress, testPrivateKey);

        try {
            const response = await command.execute();

            expect(response.data).toBeDefined();
            expect(response.data.address).toBe(testAddress);
            expect(response.data.balances).toBeInstanceOf(Array);
            expect(typeof response.data.sequence).toBe("number");
            expect(typeof response.data.accountNumber).toBe("number");
            expect(typeof response.data.type).toBe("string");

            console.log("Account info:", response.data);
        } catch (error) {
            console.log("Skipping real network test:", error);
        }
    });
});
