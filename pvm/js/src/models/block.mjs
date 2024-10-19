const ethers = require("ethers");
const crypto = require("crypto");

class Block {
  constructor(index, previous_hash, timestamp, validator) {
    this.index = index;
    this.hash = null;
    this.previous_hash = previous_hash;
    this.merkle_root = null;
    this.timestamp = timestamp;
    this.validator = validator;
    this.transactions = [];
    this.version = 1;
    this.signature = null;
  }

  addTx(tx) {
    // check if the tx has been added previously
    if (this.transactions.includes(tx)) {
      return;
    }

    // check the signature of the tx?

    this.transactions.push(tx);
  }

  addTxs(txs) {
    for (const tx of txs) {
      this.addTx(tx);
    }
  }

  async sign(private_key) {
    const wallet = new ethers.Wallet(private_key);
    this.validator = wallet.address;
    const hash = this.calculateHash();
    this.signature = await wallet.signMessage(hash);

    return this.signature;
  }

  verify() {
    if (!this.signature) {
      return false;
    }

    return true;
  }

  calculateHash() {
    this.merkle_root = this.calculateMerkleRoot();

    const blockData = {
      index: this.index,
      previous_hash: this.previous_hash,
      timestamp: this.timestamp,
      validator: this.validator,
      transactions: [], // this.transactions,
      merkle_root: this.merkle_root,
    };

    const data = JSON.stringify(blockData);

    this.hash = crypto.createHash("SHA256").update(data).digest("hex");
    return this.hash;
  }

  calculateMerkleRoot() {
    if (this.transactions.length === 0) {
      return null;
    }

    let currentLevel = this.transactions.map((tx) => this.hashTransaction(tx));

    while (currentLevel.length > 1) {
      currentLevel = this.createNextMerkleLevel(currentLevel);
    }

    return currentLevel[0]; // The Merkle root
  }

  hashTransaction(transaction) {
    return crypto.createHash("sha256").update(transaction).digest("hex");
  }

  createNextMerkleLevel(nodes) {
    let nextLevel = [];

    for (let i = 0; i < nodes.length; i += 2) {
      if (i + 1 < nodes.length) {
        nextLevel.push(this.hashTransaction(nodes[i] + nodes[i + 1]));
      } else {
        nextLevel.push(this.hashTransaction(nodes[i] + nodes[i]));
      }
    }

    return nextLevel;
  }
}

// module.exports = Block;
export default Block;
