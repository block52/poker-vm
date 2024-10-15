const Blocks = require("../../schemas/block");
const AccountState = require("./account_state");
const Transaction = require("../../schemas/transaction");
const Block = require("../../models/block");

const ethers = require("ethers");

class Blockchain {
  setValidator(validator) {
    this.validator = validator;
  }

  // Allows blocks to be added to the blockchain.  These may come from other nodes.
  async addBlock() {
    if (!this.verifyBlock(this.block)) {
      return false;
    }

    // Create a block entity
    const block = new Blocks({
      index: this.block.index,
      version: 1,
      hash: this.block.hash,
      merkle_root: this.block.merkle_root,
      previous_block_hash: this.block.previous_hash,
      timestamp: this.block.timestamp,
      validator: this.block.validator,
      signature: this.block.signature,
      txs: this.block.transactions,
      tx_count: this.block.transactions.length,
    });

    await block.save();

    const account_state = new AccountState();

    for (let i = 0; i < this.block.transactions.length; i++) {
      const tx = this.block.transactions[i];
      const transaction = new Transaction({
        account: tx.from,
        nonce: tx.nonce,
        amount: tx.amount,
        data: tx.data,
        hash: tx.hash,
        block_hash: this.block.hash,
        signature: tx.signature,
        timestamp: tx.timestamp,
      });

      await account_state.handleNativeTransfer(tx);
      await transaction.save();
    }

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

  // Create a new block to be mined / signed by the validator
  async newBlock(txs) {
    const timestamp = Date.now();
    const height = await this.height();
    const index = Number(height) === 0 ? 0 : height;

    let previous_block = null;
    if (index > 0) {
      previous_block = await this.getBlock(index);
    }

    if (index === 0) {
      previous_block = this.genesisBlock();
    }

    if (!previous_block) {
      return undefined;
    }

    this.block = new Block(
      previous_block.index + 1,
      previous_block.hash,
      timestamp,
      undefined // validator
    );

    if (txs) {
      this.block.transactions.push(txs);
      // this.block.transactions = txs;
    }

    return this.block;
  }

  async processBlock(block) {
    if (!this.verifyBlock(block)) {
      return false;
    }

    const txs = block.txs;
    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i];
      await this.handleTransaction(tx);
    }
  }

  async height() {
    return await Blocks.countDocuments();
  }

  async getBlock(id) {
    const isNumber = /^\d+$/.test(id);

    if (isNumber) {
      if (parseInt(id) === 0) {
        return this.genesisBlock();
      }

      const block = await Blocks.findOne({ index: parseInt(id) });
      return block;
    }

    if (id === "latest" || id === undefined) {
      const block = await Blocks.findOne().sort({ index: -1 });
      return block;
    }

    const block = await Blocks.findOne({ id });
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
