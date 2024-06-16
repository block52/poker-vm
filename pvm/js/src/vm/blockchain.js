const Blocks = require("../schemas/block");
const Block = require("../models/block");

export class Blockchain {
  setValidator(validator) {
    this.validator = validator;
  }

  async addBlock(data) {
    if (!this.validator.verifyBlock(data)) {
      return false;
    }

    const block = new Block(data.index, data.previous_hash, data.hash, data.timestamp, data.validator);
    await block.save();
  }

  async verifyBlock(block) {
    const previous_block = await this.getBlock(block.index - 1);

    if (!previous_block) {
      return false;
    }

    if (previous_block.hash !== block.previous_hash) {
      return false;
    }

    if (block.hash() !== block.hash) {
      return false;
    }

    return true;
  }

  async generateBlock() {

    const timestamp = Date.now();
    const previous_block = await this.getBlock(this.height() - 1);

    const block = new Block(previous_block.index + 1, previous_block.hash, "", timestamp, this.validator.index);

    // hash the block
    const hash = block.hash();
  }

  async height() {
    return await Blocks.countDocuments();
  }

  async getBlock(index) {
    const block = await Blocks.findOne({ index });
    return block;
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

  genesisBlock() {
    const timestamp = Date.now();
    const block = new Block(0, "", "", timestamp, this.validator.index);
    block.hash = block.hash();
    return block;
  }
}

