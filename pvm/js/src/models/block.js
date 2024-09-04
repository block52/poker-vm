class Block {
  constructor(index, previous_hash, timestamp, validator) {
    this.index = index;
    this.previous_hash = previous_hash;
    this.timestamp = timestamp;
    this.validator = validator;
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

  sign(private_key) {
    const sign = crypto.createSign("SHA256");
    sign.update(this.hash());
    sign.end();
    this.signature = sign.sign(private_key, "hex");
  }

  verify() {
    if (!this.signature) {
      return false;
    }

    return true;
  }

  hash() {
    this.hash = this.calculateHash();
  }

  merkle_root() {
    // calculate the merkle root of the transactions
    this.merkle_root = this.calculateMerkleRoot();
  }

  calculateHash() {
    const blockData = {
      index: this.index,
      previous_hash: this.previous_hash,
      timestamp: this.timestamp,
      validator: this.validator,
      transactions: this.transactions,
      merkle_root: this.merkle_root,
    };

    const json = JSON.stringify(blockData);
    return crypto.createHash("SHA256").update(json).digest("hex");
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

  hash() {
    this.merkle_root = this.calculateMerkleRoot();
    return this.calculateHash();
  }
}

module.exports = Block;
