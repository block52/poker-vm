import { GetCosmosBlocksCommand } from "../commands/getCosmosBlocksCommand";

describe("GetCosmosBlocksCommand", () => {
    const mockPrivateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const mockRpcUrl = "http://localhost:26657";

    it("should create command with correct parameters", () => {
        const command = new GetCosmosBlocksCommand(mockRpcUrl, mockPrivateKey, 5);
        expect(command).toBeDefined();
    });

    it("should create command with start height", () => {
        const command = new GetCosmosBlocksCommand(mockRpcUrl, mockPrivateKey, 10, 100);
        expect(command).toBeDefined();
    });

    // Note: Integration tests would require a running Cosmos node
    // For now, we just test the command instantiation
    it.skip("should fetch cosmos blocks", async () => {
        const command = new GetCosmosBlocksCommand(mockRpcUrl, mockPrivateKey, 5);

        try {
            const result = await command.execute();
            expect(result.data).toBeInstanceOf(Array);
            expect(result.signature).toBeDefined();
        } catch (error) {
            // Expected to fail without a running cosmos node
            console.log("Expected failure without cosmos node:", error);
        }
    });
});