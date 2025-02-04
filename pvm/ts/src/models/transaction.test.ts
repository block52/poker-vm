import { ethers } from "ethers";
import { Transaction } from "./transaction";

describe("Transaction Tests", () => {
    const testPrivateKey = "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb";
    const testWallet = new ethers.Wallet(testPrivateKey);

    describe("constructor", () => {
        it("should create transaction with all properties", () => {
            const tx = new Transaction(
                "to",
                "from",
                BigInt(100),
                ethers.ZeroHash,
                "signature",
                Date.now(),
                1,
                BigInt(1),
                "data"
            );

            expect(tx.to).toBe("to");
            expect(tx.from).toBe("from");
            expect(tx.value).toBe(BigInt(100));
            expect(tx.hash).toBe(ethers.ZeroHash);
            expect(tx.signature).toBe("signature");
            expect(tx.index).toBe(1);
            expect(tx.nonce).toBe(BigInt(1));
            expect(tx.data).toBe("data");
        });
    });

    describe("static create", () => {
        it("should create new Transaction model", async () => {
            const tx = await Transaction.create(
                "to",
                "from",
                BigInt(100),
                BigInt(1),
                testPrivateKey,
                "data"
            );
            
            expect(tx).toBeDefined();
            expect(tx.signature).toBeDefined();
            expect(tx.hash).toBeDefined();
            expect(tx.timestamp).toBeDefined();
        });

        it("should calculate correct hash", async () => {
            const tx = await Transaction.create(
                "to",
                "from",
                BigInt(100),
                BigInt(1),
                testPrivateKey,
                "data"
            );
            
            const hash = tx.calculateHash();
            expect(hash).toBe("58990a597533a2026a1a901058c4db0a2aae6c7e499c8e5730c14db397c08cf8");
        });
    });

    describe("blockHash", () => {
        it("should set and get blockHash", () => {
            const tx = new Transaction(
                "to",
                "from",
                BigInt(100),
                ethers.ZeroHash,
                "signature",
                Date.now()
            );

            const testHash = "0x123";
            tx.blockHash = testHash;
            expect(tx.blockHash).toBe(testHash);
        });
    });

    describe("getId", () => {
        it("should return calculated hash", () => {
            const tx = new Transaction(
                "to",
                "from",
                BigInt(100),
                ethers.ZeroHash,
                "signature",
                Date.now(),
                1,
                BigInt(1)
            );

            expect(tx.getId()).toBe(tx.calculateHash());
        });
    });

    describe("verify", () => {
        it("should verify valid transaction", async () => {
            const tx = await Transaction.create(
                "to",
                "from",
                BigInt(100),
                BigInt(1),
                testPrivateKey,
                "data"
            );
            expect(tx.verify()).toBeTruthy();
        });
    });

    describe("serialization", () => {
        it("should convert to and from JSON", async () => {
            const originalTx = await Transaction.create(
                "to",
                "from",
                BigInt(100),
                BigInt(1),
                testPrivateKey,
                "data"
            );

            const json = originalTx.toJson();
            const newTx = Transaction.fromJson(json);

            expect(newTx.to).toBe(originalTx.to);
            expect(newTx.from).toBe(originalTx.from);
            expect(newTx.value).toBe(originalTx.value);
            expect(newTx.hash).toBe(originalTx.hash);
            expect(newTx.signature).toBe(originalTx.signature);
        });

        it("should convert to and from Document", async () => {
            const originalTx = await Transaction.create(
                "to",
                "from",
                BigInt(100),
                BigInt(1),
                testPrivateKey,
                "data"
            );

            const doc = originalTx.toDocument();
            const newTx = Transaction.fromDocument(doc);

            expect(newTx.to).toBe(originalTx.to);
            expect(newTx.from).toBe(originalTx.from);
            expect(newTx.value).toBe(originalTx.value);
            expect(newTx.hash).toBe(originalTx.hash);
            expect(newTx.signature).toBe(originalTx.signature);
            expect(newTx.data).toBe(originalTx.data);
        });
    });

    describe("calculateHash", () => {
        it("should generate consistent hash for same data", () => {
            const tx1 = new Transaction(
                "to",
                "from",
                BigInt(100),
                ethers.ZeroHash,
                "signature",
                Date.now(),
                1,
                BigInt(1)
            );

            const tx2 = new Transaction(
                "to",
                "from",
                BigInt(100),
                ethers.ZeroHash,
                "signature",
                Date.now(),
                1,
                BigInt(1)
            );

            expect(tx1.calculateHash()).toBe(tx2.calculateHash());
        });

        it("should generate different hash for different data", () => {
            const tx1 = new Transaction(
                "to1",
                "from",
                BigInt(100),
                ethers.ZeroHash,
                "signature",
                Date.now(),
                1,
                BigInt(1)
            );

            const tx2 = new Transaction(
                "to2",
                "from",
                BigInt(100),
                ethers.ZeroHash,
                "signature",
                Date.now(),
                1,
                BigInt(1)
            );

            expect(tx1.calculateHash()).not.toBe(tx2.calculateHash());
        });
    });
});
