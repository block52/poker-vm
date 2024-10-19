import { createHash } from "crypto";
import { ethers } from "ethers";
import { Transaction } from "./transaction";

export class Block {

  private readonly transactions: Transaction[];

  constructor(readonly index: number, readonly previousHash: string, readonly timestamp: number, readonly validator: string) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.validator = validator;
    this.transactions = [];
  }

  public static create(index: number, previousHash: string, timestamp: number, privateKey: string): Block {
    const wallet = new ethers.Wallet(privateKey);
    const validator = wallet.address;
    return new Block(index, previousHash, timestamp, validator);
  }

  public calculateHash(): string {
    const merkleRoot = this.createMerkleRoot();

    const blockData = {
      index: this.index,
      previousHash: this.previousHash,
      timestamp: this.timestamp,
      validator: this.validator,
      transactions: [], // this.transactions,
      // merkleRoot: this.merkleRoot,
    };

    const json = JSON.stringify(blockData);

    const hash = createHash("SHA256").update(json).digest("hex");
    return hash;
  }

  public createMerkleRoot(): string {
    return "";
  }

  public verify(): boolean {
    // if (!this.signature) {
    //   return false;
    // }
    // return true;
    return false;
  }

  addTx(tx: Transaction) {
    // check if the tx has been added previously
    if (this.transactions.includes(tx)) {
      return;
    }

    if (!tx.verify()) {
      throw new Error("Invalid transaction");
    }

    this.transactions.push(tx);
  }

  addTxs(txs: Transaction[]) {
    for (const tx of txs) {
      this.addTx(tx);
    }
  }
}

