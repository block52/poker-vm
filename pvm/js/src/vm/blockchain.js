const Blocks = require("../models/block");

class Blockchain {
  setValidator(validator) {
    this.validator = validator;
  }

  addBlock(block) {
    this.blocks.push(block);
  }

  height() {
    return this.blocks.length;
  }

  async getBlock(block_number) {
    return this.blocks[block_number];
  }

  async getBlockByHash(hash) {
    const block = await Blocks.findOne({ hash });
    return block;
  }
}

class Block {
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

module.exports = Blockchain;
