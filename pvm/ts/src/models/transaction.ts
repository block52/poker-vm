import { createHash } from "crypto";
import { ICryptoModel } from "./interfaces";
import { TransactionDTO } from "../types/chain";

export class Transaction implements ICryptoModel {
  constructor(
    readonly to: string,
    readonly from: string,
    readonly value: number,
    readonly signature: string,
    readonly timestamp: number,
    readonly index?: number
  ) { 

    // If the index is not provided, set it to 0 or look for the last index in the blockchain

  }

  public verify(): boolean {
    // const signature = createHash("sha256")
    //   .update(`${this.to}${this.from}${this.value}${this.timestamp}`)
    //   .digest("hex");

    // return signature === this.signature;

    throw new Error("Method not implemented.");
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
      value: this.value,
      signature: this.signature,
      timestamp: this.timestamp,
      index: this.index,
      hash: this.hash,
    };
  }

  public static create(
    to: string,
    from: string,
    value: number,
    privateKey: string
  ): Transaction {
    const timestamp = Date.now();
    const signature = createHash("sha256")
      .update(`${to}${from}${value}${timestamp}${privateKey}`)
      .digest("hex");
    return new Transaction(to, from, value, signature, timestamp);
  }

  public static fromJson(json: TransactionDTO): Transaction {
    return new Transaction(
      json.to,
      json.from,
      json.value,
      json.signature,
      json.timestamp,
      json.index
    );
  }
}
