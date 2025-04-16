import { ethers } from "ethers";
import { Block } from "./block";
import { Transaction } from "./transaction";

// Helper function to create test transactions
function createTestTransaction(from: string, value: bigint): Transaction {
    return new Transaction(
        from,           // from
        "test",        // to
        value,         // value
        `test-${from}-${value}`,  // unique hash for each transaction
        "test",        // signature
        Date.now(),    // timestamp
        4n,           // nonce
        1,        // index
        "test"         // data
    );
}

describe("Block Tests", () => {
    const testPrivateKey = "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb";
    const testWallet = new ethers.Wallet(testPrivateKey);

    describe("constructor", () => {
        it("should create a block with default values", () => {
            const block = new Block(1, ethers.ZeroHash, Date.now());
            expect(block.index).toBe(1);
            expect(block.previousHash).toBe(ethers.ZeroHash);
            expect(block.hash).toBe(ethers.ZeroHash);
            expect(block.merkleRoot).toBe(ethers.ZeroHash);
            expect(block.signature).toBe(ethers.ZeroHash);
            expect(block.validator).toBe(ethers.ZeroAddress);
            expect(block.transactions).toEqual([]);
        });
    });

    describe("static create", () => {
        it("should create new Block model", async () => {
            const block = await Block.create(1, ethers.ZeroHash, [], testPrivateKey);
            expect(block).toBeDefined();
            expect(block.validator).toBe(testWallet.address);
            expect(block.signature).not.toBe(ethers.ZeroHash);
        });

        it("should throw error if private key is missing", () => {
            expect(() => {
                Block.create(1, ethers.ZeroHash, [], "");
            }).toThrow("Private key is required to create a block");
        });
    });

    describe("calculateHash", () => {
        it("should calculate block hash", () => {
            const block = new Block(1, ethers.ZeroHash, Date.now());
            block.calculateHash();
            expect(block.hash).not.toBe(ethers.ZeroHash);
        });

        it("should include merkle root in hash calculation", () => {
            const block = new Block(1, ethers.ZeroHash, Date.now());
            const initialHash = block.hash;
            block.createMerkleRoot();
            block.calculateHash();
            expect(block.hash).not.toBe(initialHash);
        });
    });

    describe("createMerkleRoot", () => {
        it("should return ZeroHash for empty transactions", () => {
            const block = new Block(1, ethers.ZeroHash, Date.now());
            const root = block.createMerkleRoot();
            expect(root).toBe(ethers.ZeroHash);
        });

        it("should create merkle root for transactions", () => {
            const block = new Block(1, ethers.ZeroHash, Date.now());
            const tx = createTestTransaction("test", 100n);
            block.addTx(tx);
            const root = block.createMerkleRoot();
            expect(root).not.toBe(ethers.ZeroHash);
        });
    });

    describe("verify", () => {
        it("should return false if no signature", () => {
            const block = new Block(1, ethers.ZeroHash, Date.now());
            expect(block.verify()).toBe(false);
        });

        it("should verify signed block", async () => {
            const block = await Block.create(1, ethers.ZeroHash, [], testPrivateKey);
            expect(block.verify()).toBe(true);
        });
    });

    describe("sign", () => {
        it("should sign block with private key", async () => {
            const block = new Block(1, ethers.ZeroHash, Date.now());
            await block.sign(testPrivateKey);
            expect(block.signature).not.toBe(ethers.ZeroHash);
        });
    });

    describe("transaction management", () => {
        it("should add transaction", () => {
            const block = new Block(1, ethers.ZeroHash, Date.now());
            const tx = createTestTransaction("test", 100n);
            block.addTx(tx);
            expect(block.transactions).toHaveLength(1);
        });

        it("should not add duplicate transaction", () => {
            const block = new Block(1, ethers.ZeroHash, Date.now());
            const tx = createTestTransaction("test", 100n);
            block.addTx(tx);
            block.addTx(tx);
            expect(block.transactions).toHaveLength(1);
        });

        it("should add multiple transactions", () => {
            const block = new Block(1, ethers.ZeroHash, Date.now());
            const tx1 = createTestTransaction("test1", 100n);
            const tx2 = createTestTransaction("test2", 200n);
            block.addTxs([tx1, tx2]);
            expect(block.transactions).toHaveLength(2);
        });
    });

    describe("serialization", () => {
        it("should convert to JSON", () => {
            const block = new Block(1, ethers.ZeroHash, Date.now());
            const json = block.toJson();
            expect(json.index).toBe(1);
            expect(json.previousHash).toBe(ethers.ZeroHash);
        });

        it("should convert from JSON", () => {
            const block = new Block(1, ethers.ZeroHash, Date.now());
            const json = block.toJson();
            const newBlock = Block.fromJson(json);
            expect(newBlock.index).toBe(block.index);
            expect(newBlock.previousHash).toBe(block.previousHash);
        });

        it("should convert to document", () => {
            const block = new Block(1, ethers.ZeroHash, Date.now());
            const doc = block.toDocument();
            expect(doc.index).toBe(1);
            expect(doc.previous_block_hash).toBe(ethers.ZeroHash);
        });

        it("should convert from document", () => {
            const block = new Block(1, ethers.ZeroHash, Date.now());
            const doc = block.toDocument();
            const newBlock = Block.fromDocument(doc);
            expect(newBlock.index).toBe(block.index);
            expect(newBlock.previousHash).toBe(block.previousHash);
        });
    });
});
