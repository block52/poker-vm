export class Block {
  constructor(index, previous_hash, hash, timestamp, validator_index) {
    this.index = index;
    this.previous_hash = previous_hash;
    this.hash = hash;
    this.timestamp = timestamp;
    this.validator_index = validator_index;
  }

  addTx(tx) {
    this.transactions.push(tx);
  }
}
