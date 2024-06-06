const Blocks = require("../schemas/block");
const Block = require("../models/block");

export class Blockchain {
  setValidator(validator) {
    this.validator = validator;
  }

  async addBlock(data) {


    await block.save();
  }

  async generateBlock() {

    const timestamp = Date.now();

    const previous_block = await this.getBlock(this.height() - 1);

    const block = new Block(previous_block.index + 1, previous_block.hash, "", timestamp, this.validator.index);

    // hash the block
    const hash = block.hash();
  }

  height() {
    return this.blocks.length;
  }

  async getBlock(block_number) {
    const block = await Blocks.findOne({ block_number });
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
}

