import { TransactionDTO } from "@bitcoinbrisbane/block52";
import { createHash } from "crypto";
import { signData } from "../utils/crypto";
import { ICryptoModel, IJSONModel, ITransactionDocument } from "./interfaces";

export class Transaction implements ICryptoModel, IJSONModel {
    private _blockHash: string | undefined;

    constructor(
        readonly to: string,
        readonly from: string,
        readonly value: bigint,
        readonly hash: string,
        readonly signature: string,
        readonly timestamp: number,
        readonly index?: number,
        readonly nonce?: bigint,
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
        // const hash = this.calculateHash();
        // return hash === this.hash;

        // return signature === this.signature;
        // return true; //this.signature === ZeroHash);

        return true;
    }

    public calculateHash(): string {
        return createHash("sha256").update(`${this.to}${this.from}${this.value}${this.nonce}`).digest("hex");
    }

    // get hash(): string {
    //     return this.calculateHash();
    // }

    public static async create(to: string, from: string, value: bigint, nonce: bigint, privateKey: string, data: string): Promise<Transaction> {
        const timestamp = Date.now();
        const _data = `${to}${from}${value}${nonce}${data}`;
        const signature = await signData(privateKey, _data);

        const hash = createHash("sha256").update(_data).digest("hex");

        return new Transaction(to, from, value, hash, signature, timestamp, undefined, nonce, data);
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
            document.index ? Number(document.index) : undefined,
            document.nonce ? BigInt(document.nonce) : undefined,
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
