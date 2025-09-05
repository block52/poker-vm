import { describe } from "node:test";
import { NodeRpcClient } from "./client";

describe("Client", () => {
    // Add your tests here

    it("should sign message", async () => {
        const client = new NodeRpcClient("http://localhost:3000", "bddcaaa07e480212f93bbcd4eedd3a63a08f5a1cd8d0897bebbcf02a40eea633");

        const message = "Hello, world!";
        // const signature = await client.signMessage(message);
        // expect(signature).toBeDefined();
    });
});