import { createHash } from "crypto";
import { ethers } from "ethers";
import { Transaction } from "./transaction";
import { IBlockDocument, IJSONModel } from "./interfaces";
import { BlockDTO } from "@bitcoinbrisbane/block52";

export class Block implements IJSONModel {
    public transactions: Transaction[];
    public version = 1;
    public hash: string;
    public merkleRoot: string;
    public signature: string;
    public validator: string;
    public transactionCount: number;

    constructor(
        readonly index: number,
        readonly previousHash: string,
        readonly timestamp: number,
        validator?: string,
        hash?: string,
        merkleRoot?: string,
        signature?: string,
        transactions?: Transaction[]
    ) {
        this.index = index;
        this.previousHash = previousHash;
        this.hash = hash || ethers.ZeroHash;
        this.merkleRoot = merkleRoot || ethers.ZeroHash;
        this.signature = signature || ethers.ZeroHash;
        this.timestamp = timestamp;
        this.validator = validator || ethers.ZeroAddress;
        this.transactions = transactions || [];
        this.transactionCount = this.transactions.length;
    }

    public static create(index: number, previousHash: string, transactions: Transaction[], privateKey: string): Block {
        if (!privateKey) {
            throw new Error("Private key is required to create a block");
        }

        const timestamp = index > 0 ? Date.now() : 0;
        const wallet = new ethers.Wallet(privateKey);
        const validator = wallet.address;

        const block = new Block(index, previousHash, timestamp, validator, undefined, undefined, undefined, transactions);

        block.calculateHash();
        block.sign(privateKey);

        return block;
    }

    public calculateHash(): void {
        this.createMerkleRoot();

        const blockData = {
            index: this.index,
            previousHash: this.previousHash,
            timestamp: this.timestamp,
            validator: this.validator,
            transactions: [], // this.transactions.map(tx => tx.toJson()),
            merkleRoot: this.merkleRoot
        };

        const json = JSON.stringify(blockData);

        this.hash = createHash("SHA256").update(json).digest("hex");
    }

    public createMerkleRoot(): string {
        if (this.transactions.length === 0) {
            return ethers.ZeroHash;
        }

        // Convert transactions to an array of transaction hashes
        let transactionHashes = this.transactions.map(tx => createHash("SHA256").update(tx.toString()).digest("hex"));

        // Recursively compute the Merkle Root
        while (transactionHashes.length > 1) {
            // If the number of hashes is odd, duplicate the last one
            if (transactionHashes.length % 2 !== 0) {
                transactionHashes.push(transactionHashes[transactionHashes.length - 1]);
            }

            // Hash each pair of nodes together
            const newLevel: string[] = [];
            for (let i = 0; i < transactionHashes.length; i += 2) {
                const hashPair = transactionHashes[i] + transactionHashes[i + 1];
                const newHash = createHash("SHA256").update(hashPair).digest("hex");
                newLevel.push(newHash);
            }

            // Move up to the next level of the tree
            transactionHashes = newLevel;
        }

        // The final remaining hash is the Merkle Root
        this.merkleRoot = transactionHashes[0];
        return transactionHashes[0];
    }

    public verify(): boolean {
        if (!this.signature || this.signature === ethers.ZeroHash) {
            return false;
        }

        this.calculateHash();
        return true;
    }

    public async sign(privateKey: string): Promise<void> {
        const wallet = new ethers.Wallet(privateKey);
        this.calculateHash();
        this.signature = await wallet.signMessage(this.hash);
    }

    public addTx(tx: Transaction) {
        // check if the tx has been added previously
        if (this.transactions.find(t => t.hash === tx.hash)) {
            return;
        }

        if (!tx.verify()) {
            throw new Error("Invalid transaction");
        }

        this.transactions.push(tx);
    }

    public addTxs(txs: Transaction[]) {
        for (const tx of txs) {
            this.addTx(tx);
        }
    }

    public toJson(): BlockDTO {

        // TODO: roll back to this
        const transactions = this.transactions.map(tx => tx.toJson());

        return {
            index: this.index,
            hash: this.hash,
            previousHash: this.previousHash,
            merkleRoot: this.merkleRoot,
            signature: this.signature,
            timestamp: this.timestamp,
            validator: this.validator,
            version: this.version.toString(),
            transactions: transactions,
            transactionCount: this.transactions.length
        };
    }

    public static fromJson(json: BlockDTO): Block {
        const block = new Block(Number(json.index), json.previousHash, Number(json.timestamp), json.validator, json.hash, json.merkleRoot, json.signature);

        for (const tx of json.transactions) {
            block.addTx(Transaction.fromJson(tx));
        }

        return block;
    }

    public static fromDocument(document: IBlockDocument): Block {
        const block = new Block(
            document.index,
            document.previous_block_hash,
            document.timestamp,
            document.validator,
            document.hash,
            document.merkle_root,
            document.signature
        );

        // Store the transaction hashes
        if (document.transactions) {
            block.transactions = document.transactions.map(txHash => {
                // Create a minimal Transaction object with just the hash
                return new Transaction(
                    '', // to
                    '', // from
                    BigInt(0), // value
                    txHash, // hash
                    '', // signature
                    0, // timestamp
                );
            });
        }

        // Set the transaction count from the document
        block.transactionCount = document.tx_count || 0;

        return block;
    }

    public toDocument(): IBlockDocument {
        return {
            index: this.index,
            version: this.version,
            hash: this.hash,
            merkle_root: this.merkleRoot,
            previous_block_hash: this.previousHash,
            timestamp: this.timestamp,
            validator: this.validator,
            signature: this.signature,
            tx_count: this.transactions.length,
            transactions: this.transactions.map(tx => tx.hash)  // Store just the transaction hashes
        };
    }
}
