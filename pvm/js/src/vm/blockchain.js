const Blocks = require("../schemas/block");

class Blockchain {
  setValidator(validator) {
    this.validator = validator;
  }

  async addBlock(block) {
    const block = new Block({
      index: data.index,
      version: data.version,
      hash: data.hash,
      previous_block_hash: data.previous_block_hash,
      timestamp: data.timestamp,
      validator: data.validator,
      txs: data.transactions,
      signature,
    });

    await block.save();
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

  async handleTransaction(tx) {
    // if (!this.validator.verify_tx(tx)) {
    //   return false;
    // }

    // this.mempool.push(tx);
    if (tx.value > 0) {
      return this.handleNativeTransfer(tx);
    }

    return false;
  }

  async handleNativeTransfer(tx) {
    const { from, to, amount } = tx;

    const account_state = new AccountState();
    const result = await account_state.transfer(from, to, amount);
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
