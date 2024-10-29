import { TransactionDTO } from "@bitcoinbrisbane/block52";
import { createHash } from "crypto";
import { ICryptoModel, IJSONModel, ITransactionDocument } from "./interfaces";

export class Transaction implements ICryptoModel, IJSONModel {
  constructor(
    readonly to: string,
    readonly from: string | null,
    readonly value: bigint,
    readonly signature: string,
    readonly timestamp: bigint,
    readonly index?: bigint
  ) { 

    // If the index is not provided, set it to 0 or look for the last index in the blockchain

  }

  public verify(): boolean {
    // const signature = createHash("sha256")
    //   .update(`${this.to}${this.from}${this.value}${this.timestamp}`)
    //   .digest("hex");

    // return signature === this.signature;
    return (true); //this.signature === ZeroHash);
  }

  public calculateHash(): string {
    return createHash("sha256")
      .update(`${this.to}${this.from}${this.value}${this.timestamp}`)
      .digest("hex");
  }

  get hash(): string {
    return this.calculateHash();
  }

  public getId(): string {
    return this.calculateHash();
  }

  public toJson(): TransactionDTO {
    return {
      to: this.to,
      from: this.from,
      value: this.value.toString(),
      signature: this.signature,
      timestamp: this.timestamp.toString(),
      index: this.index?.toString(),
      hash: this.hash,
    };
  }

  public static create(
    to: string,
    from: string | null,
    value: bigint,
    privateKey: string
  ): Transaction {
    const timestamp = BigInt(Date.now());
    const signature = createHash("sha256")
      .update(`${to}${from}${value}${timestamp}${privateKey}`)
      .digest("hex");
    return new Transaction(to, from, value, signature, timestamp);
  }

  public static fromJson(json: TransactionDTO): Transaction {
    return new Transaction(
      json.to,
      json.from,
      BigInt(json.value),
      json.signature,
      BigInt(json.timestamp),
      json.index ? BigInt(json.index) : undefined
    );
  }

  public static fromDocument(document: ITransactionDocument): Transaction {
    return new Transaction(document.to, document.from ?? null, BigInt(document.value), document.signature, BigInt(document.timestamp), document.index ? BigInt(document.index) : undefined);
  }

  public static toDocument(transaction: Transaction): ITransactionDocument {
    return {
      to: transaction.to,
      from: transaction.from ?? undefined,
      value: transaction.value.toString(),
      signature: transaction.signature,
      timestamp: transaction.timestamp.toString(),
      index: transaction.index?.toString(),
      hash: transaction.hash,
    };
  }
}
