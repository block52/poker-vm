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
    this.signature = "signature";
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

  calculateHash() {
    return "hash";
  }
}

module.exports = Block;
