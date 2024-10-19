import { createHash } from "crypto";
import { IModel } from "./interfaces";

export class Transaction implements IModel {
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

  public isValid(): boolean {
    const signature = createHash("sha256")
      .update(`${this.to}${this.from}${this.value}${this.timestamp}`)
      .digest("hex");

    return signature === this.signature;
  }

  public getId(): string {
    return createHash("sha256")
      .update(`${this.to}${this.from}${this.value}${this.timestamp}`)
      .digest("hex");
  }

  public toJson(): any {
    return {
      to: this.to,
      from: this.from,
      value: this.value,
      signature: this.signature,
      timestamp: this.timestamp,
      index: this.index,
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

  public static fromJson(json: any): Transaction {
    return new Transaction(
      json.to,
      json.from,
      json.value,
      json.signature,
      json.timestamp
    );
  }
}
