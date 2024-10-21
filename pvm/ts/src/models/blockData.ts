// import { ethers } from "ethers";
import { Transaction } from "./transaction";

export class BlockData {

  private readonly transactions: Transaction[];

  constructor(readonly index: number, readonly previousHash: string, readonly timestamp: number) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.transactions = [];
  }

  public sign(privateKey: string): string {
    // const wallet = new ethers.Wallet(privateKey);
    // return wallet.signMessage(this.calculateHash());

    throw new Error("Method not implemented.");
  }

  public addTransaction(transaction: Transaction): void {
    this.transactions.push(transaction);
  }
}

