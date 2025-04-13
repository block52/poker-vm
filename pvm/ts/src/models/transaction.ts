import { TransactionDTO } from "@bitcoinbrisbane/block52";
import { createHash } from "crypto";
import { signData } from "../utils/crypto";
import { ICryptoModel, IJSONModel, ITransactionDocument } from "./interfaces";
import { ZeroHash } from "ethers";

export class Transaction implements ICryptoModel, IJSONModel {
    private _blockHash: string | undefined;

    constructor(
        readonly to: string,
        readonly from: string,
        readonly value: bigint,
        readonly hash: string,
        readonly signature: string,
        readonly timestamp: number,
        readonly nonce: bigint,
        readonly index?: number,
        readonly data?: string
    ) {
        // If the index is not provided, set it to 0 or look for the last index in the blockchain
    }

    // add block hash setter and getter
    public get blockHash(): string | undefined {
        return this._blockHash;
    }

    public set blockHash(hash: string | undefined) {
        this._blockHash = hash;
    }

    public getId(): string {
        return this.calculateHash();
    }

    public verify(): boolean {
        if (!this.signature) {
            return false;
        }

        if (this.signature === ZeroHash) {
            return true;
        }
        
        const hash = this.calculateHash();
        const publicKey = this.from;
        // const verified = verifyData(publicKey, hash, this.signature);
        return true;
    }

    public calculateHash(): string {
        // Include the data field in the hash calculation to ensure consistency
        // This prevents duplicate transactions with the same content but different hashes
        return createHash("sha256").update(`${this.to}${this.from}${this.value}${this.nonce}${this.data || ""}`).digest("hex");
    }

    public static async create(to: string, from: string, value: bigint, nonce: bigint, privateKey: string, data: string): Promise<Transaction> {
        const timestamp = Date.now();
        
        // Create the transaction object first
        const transaction = new Transaction(to, from, value, "", "", timestamp, nonce, undefined, data);
        
        // Use the calculateHash method to ensure consistency with other hash calculations
        const hash = transaction.calculateHash();
        
        // Sign the hash
        const signature = await signData(privateKey, hash);
        
        // Create the final transaction with the correct hash and signature
        return new Transaction(to, from, value, hash, signature, timestamp, nonce, undefined, data);
    }

    public toJson(): TransactionDTO {
        return {
            index: this.index?.toString(),
            nonce: this.nonce?.toString(),
            to: this.to,
            from: this.from,
            value: this.value.toString(),
            hash: this.hash,
            signature: this.signature,
            timestamp: this.timestamp.toString(),
            data: this.data
        };
    }

    public static fromJson(json: TransactionDTO): Transaction {
        return new Transaction(
            json.to,
            json.from,
            BigInt(json.value),
            json.hash,
            json.signature,
            Number(json.timestamp),
            json.nonce ? BigInt(json.nonce) : 0n,
            json.index ? Number(json.index) : undefined
        );
    }

    public static fromDocument(document: ITransactionDocument): Transaction {
        return new Transaction(
            document.to,
            document.from,
            BigInt(document.value),
            document.hash,
            document.signature,
            document.timestamp ? Number(document.timestamp) : 0,
            document.nonce ? BigInt(document.nonce) : 0n,
            document.index ? Number(document.index) : undefined,
            document.data
        );
    }

    public toDocument(): ITransactionDocument {
        return {
            to: this.to,
            from: this.from,
            value: this.value.toString(),
            hash: this.hash,
            signature: this.signature,
            timestamp: this.timestamp.toString(),
            index: this.index?.toString(),
            nonce: this.nonce?.toString(),
            data: this.data,
            block_hash: this.blockHash
        };
    }
}
