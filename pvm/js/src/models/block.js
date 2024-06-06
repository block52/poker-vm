class Block {
  constructor(index, previous_hash, hash, timestamp, validator) {
    this.index = index;
    this.previous_hash = previous_hash;
    this.hash = hash;
    this.timestamp = timestamp;
    this.validator = validator;
  }

  addTx(tx) {
    this.transactions.push(tx);
  }

  sign(private_key) {
    this.signature = "signature";
  }

  hash() {
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return "hash";
  }
}

module.exports = Block;
