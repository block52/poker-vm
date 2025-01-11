import { ethers } from "ethers";
import { Transaction } from "./transaction";
import { TransactionList } from "./transactionList";

describe.skip("Transaction List Tests", () => {
    it("should create new Transaction List model", () => {
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
        const txList = new TransactionList([tx]);
        expect(txList).toBeDefined();
    });
});
