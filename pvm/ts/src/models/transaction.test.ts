import { ethers } from "ethers";
import { Transaction } from "./transaction";

describe("Transaction Tests", () => {
    it.only("should create new Transaction model", async () => {
        // build leopard coyote vintage just syrup whip truth accident ritual absurd seat
        const actual = await Transaction.create(
            "to",
            "from",
            BigInt(100),
            BigInt(1),
            "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb",
            "data"
        );
        expect(actual).toBeDefined();

        const hash = actual.calculateHash();
        expect(hash).toBeDefined();
        expect(hash).toEqual("58990a597533a2026a1a901058c4db0a2aae6c7e499c8e5730c14db397c08cf8");
    });

    it("should create transaction properties", async () => {
        // build leopard coyote vintage just syrup whip truth accident ritual absurd seat
        const actual = await Transaction.create(
            "to",
            "from",
            BigInt(100),
            BigInt(1),
            "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb",
            "data"
        );
        expect(actual).toBeDefined();

        const hash = actual.calculateHash();
        expect(hash).toBeDefined();

        const id = actual.getId();
        expect(id).toBeDefined();
    });

    it("should verify transaction", async () => {
        // build leopard coyote vintage just syrup whip truth accident ritual absurd seat
        const tx = new Transaction(
            "to",
            "from",
            BigInt(100),
            ethers.ZeroHash,
            "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb",
            1000,
            1,
            undefined,
            "data"
        );

        const result = tx.verify();
        expect(result).toBeTruthy();
    });
});
