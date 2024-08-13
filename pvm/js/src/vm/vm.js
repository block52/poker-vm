const fs = require("fs");
const { createECDH, createHash } = require("node:crypto");
const ethers = require("ethers");

const Account = require("../schemas/account");
const Block = require("../schemas/block");
const Transaction = require("../models/transaction");

const { sign_data, verify_signature } = require("../crypto_utils");

class VM {
  private_key = "";
  public_key = "";
  isValidator = false;
  validator_index = 0;
  uri = "mongodb://localhost:27017/pvm";

  mempool = [];

  constructor(private_key = "") {
    this.mempool = [];
    this.private_key = private_key;

    if (this.private_key) {
      this.public_key = new ethers.Wallet(this.private_key);
      this.isValidator = true;

      // todo: call the mainnet to get the validator index from the smart contract
      this.validator_index = 1;
    }

    // Initialize the VM
    this.init();
  }

  async init() {
    // // Connect to the database
    // await mongoose.connect(this.uri, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    // });
    // Load the blocks
    // this.loadBlocks();
  }

  async checkNonce(account, nonce) {
    const query = { address: account, nonce };
    const result = await Transaction.findOne(query);

    return result;
  };

  async mint(address, amount) {
    const query = { address };
    const recipient = await Account.findOne(query);

    if (!recipient) {
      const new_account = new Account({
        address,
        balance: amount,
      });

      await new_account.save();
      return;
    }

    recipient.balance += amount;
    await recipient.save();
  }

  addTx(account, nonce, data, signature, timestamp) {
    // Create a new transaction
    if (timestamp > Date.now()) {
      console.log("Invalid timestamp");
      return false;
    }

    if (!verify_signature(account, signature, data)) {
      console.log("Invalid signature");
      return false;
    }

    const tx = {
      account,
      nonce,
      data,
      signature,
      timestamp,
    };

    const hash = sha256(JSON.stringify(tx));
    tx.id = hash;

    // Check to see if its in the mempool already

    // // Add transaction to the blockchain
    this.mempool.push(tx);

    // Return the transaction
    return tx.id;
  }

  getTx(tx_id) {
    const tx = this.mempool.find((tx) => tx.id === tx_id);
    return tx;
  }

  async commit() {
    if (!this.isValidator) {
      console.log("Only validators can commit");
      return false;
    }

    const previous_block = await Block.findOne({}).sort({ index: -1 });
    if (previous_block.validator_index + 1 !== this.validator_index) {
      console.log("Invalid validator index");
      return false;
    }

    const data = {
      index: previous_block.index + 1,
      version: 1,
      previous_block_hash: previous_block.hash,
      timestamp: Date.now(),
      transactions: this.mempool,
      validator: this.public_key,
    };

    const hash = sha256(JSON.stringify(data));
    data.hash = hash;

    const signature = sign_data(this.private_key, data);

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

    // Write the block to the blockchain
    // const block = new Block(blockchain);
    // this.writeBlock(block);
    // // Clear the mempool
    this.mempool = [];
    // broadcast the block
  }


  async verify_tx(tx) {
    // Check the signature
    if (!verify_signature(tx.account, tx.signature, tx.data)) {
      console.log("Invalid signature");
      return false;
    }

    // Check the nonce
    const result = await this.checkNonce(tx.account, tx.nonce);
    if (result) {
      console.log("Invalid nonce");
      return false;
    }

    return true;
  }

  async mine() {

    // order transactions

    // create block

  }

  // add a block to the db / chain
  async writeBlock(block) {
    // Do some checks
    const index = block.index;
    const hash = block.hash;
    const previous_hash = block.previous_hash;

    // Return the block
    return block;
  }

  addBlock(block) {
    // Add block to the blockchain
    blockchain.push(block);

    // Return the block
    return true;
  }

  loadBlocks() {
    const directoryPath = path.join(__dirname, "blocks");
    // Load blocks from the blockchain
    fs.readdir(directoryPath, (err, files) => {
      files.forEach((file) => {
        // Do whatever you want to do with the file
        console.log(file);
      });
    });
  }
}

module.exports = VM;
