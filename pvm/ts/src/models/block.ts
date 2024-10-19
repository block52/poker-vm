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
    // this.merkleRoot = this.calculateMerkleRoot();

    const blockData = {
      index: this.index,
      previousHash: this.previousHash,
      timestamp: this.timestamp,
      validator: this.validator,
      transactions: [], // this.transactions,
      // merkleRoot: this.merkleRoot,
    };

    const json = JSON.stringify(blockData);

    // this.hash = crypto.createHash("SHA256").update(json).digest("hex");
    // return this.hash;
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

  // async sign(private_key) {
  //   const wallet = new ethers.Wallet(private_key);
  //   this.validator = wallet.address;
  //   this.signature = await wallet.signMessage(this.calculateHash());

  //   return this.signature;
  // }

  // verify() {
  //   if (!this.signature) {
  //     return false;
  //   }

  //   return true;
  // }

  // calculateHash() {
  //   this.merkle_root = this.calculateMerkleRoot();

  //   const blockData = {
  //     index: this.index,
  //     previous_hash: this.previous_hash,
  //     timestamp: this.timestamp,
  //     validator: this.validator,
  //     transactions: [], // this.transactions,
  //     merkle_root: this.merkle_root,
  //   };

  //   const json = JSON.stringify(blockData);

  //   this.hash = crypto.createHash("SHA256").update(json).digest("hex");
  //   return this.hash;
  // }

  // calculateMerkleRoot() {
  //   if (this.transactions.length === 0) {
  //     return null;
  //   }

  //   let currentLevel = this.transactions.map((tx) => this.hashTransaction(tx));

  //   while (currentLevel.length > 1) {
  //     currentLevel = this.createNextMerkleLevel(currentLevel);
  //   }

  //   return currentLevel[0]; // The Merkle root
  // }

  // hashTransaction(transaction) {
  //   return crypto.createHash("sha256").update(transaction).digest("hex");
  // }

  // createNextMerkleLevel(nodes) {
  //   let nextLevel = [];

  //   for (let i = 0; i < nodes.length; i += 2) {
  //     if (i + 1 < nodes.length) {
  //       nextLevel.push(this.hashTransaction(nodes[i] + nodes[i + 1]));
  //     } else {
  //       nextLevel.push(this.hashTransaction(nodes[i] + nodes[i]));
  //     }
  //   }

  //   return nextLevel;
  // }
}

