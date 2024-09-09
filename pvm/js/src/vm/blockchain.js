const Blocks = require("../schemas/block");
const Block = require("../models/block");

const ethers = require("ethers");

class Blockchain {
  setValidator(validator) {
    this.validator = validator;
  }

  async addBlock(data) {
    if (!this.verifyBlock(data)) {
      return false;
    }

    // Create a block entity
    const block = new Blocks({
      index: data.index,
      version: 1,
      hash: data.hash,
      merkle_root: data.merkle_root,
      previous_block_hash: data.previous_hash,
      timestamp: data.timestamp,
      validator: data.validator,
      signature: data.signature,
      txs: data.transactions,
    });

    await block.save();

    return block.hash;
  }

  // move to validator?
  async verifyBlock(block) {
    let previous_block = null;
    if (block.index > 1) {
      previous_block = await this.getBlock(block.index - 1);
    }

    if (block.index <= 1) {
      previous_block = this.genesisBlock();
    }

    if (!previous_block) {
      return false;
    }

    if (previous_block.hash !== block.previous_hash) {
      return false;
    }

    // if (block.hash() !== block.hash) {
    //   return false;
    // }

    return true;
  }

  async newBlock() {
    const timestamp = Date.now();
    const height = await this.height();
    const index = Number(height) === 0 ? 0 : height - 1;

    let previous_block = null;
    if (index > 0) {
      previous_block = await this.getBlock(index);
    }

    if (index === 0) {
      previous_block = this.genesisBlock();
    }

    const block = new Block(
      previous_block.index + 1,
      previous_block.hash,
      timestamp,
      undefined // validator
    );

    return block;
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
    const block = new Block(
      0,
      ethers.ZeroAddress,
      timestamp,
      ethers.ZeroAddress
    );
    block.calculateHash();
    return block;
  }
}

module.exports = Blockchain;
