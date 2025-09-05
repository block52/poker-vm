import { NodeRpcClient } from "./client";

describe("Client", () => {
    it("should sign message", async () => {
        const client = new NodeRpcClient("http://localhost:3000", "bddcaaa07e480212f93bbcd4eedd3a63a08f5a1cd8d0897bebbcf02a40eea633");
        expect(client).toBeDefined();

        const args = ["arg1", "arg2"];
        const result = await client.getSignature(1, args);
        console.log(result);
        expect(result).toBeDefined();
    });
});