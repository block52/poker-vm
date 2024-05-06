const fs = require("fs");
const Account = require("../models/account");

class VM {
  privateKey = "";
  isValidator = false;
  uri = "mongodb://localhost:27017/pvm";

  mempool = [];

  constructor(privateKey) {
    this.mempool = [];
    this.privateKey = privateKey;

    if (this.privateKey) {
      this.isValidator = true;
    }
  }

  async init() {
    // // Connect to the database
    // await mongoose.connect(this.uri, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    // });

    // Load the blocks
    this.loadBlocks();
  }

  getAccount(account) {
    return account.find({ account });
  }

  async getAccountNonce(account) {
    const query = { account };
    const height = await account.countDocuments(query);

    return height;
  }

  async getAccount(account) {
    const query = { account };
    const result = await Account.findOne(query);

    return result;
  }

  addTx(account, nonce, action, signature) {
    // Create a new transaction
    const timestamp = Date.now();
    const tx = new Transaction(account, nonce, action, signature, timestamp);

    // Add transaction to the blockchain
    blockchain.push(tx);

    // Return the transaction
    return tx;
  }

  getTx(tx_id) {
    // Find the transaction
    const tx = blockchain.find((tx) => tx.id === tx_id);

    // Return the transaction
    return tx;
  }

  commit() {

    // can validator write

    // Write the block to the blockchain
    const block = new Block(blockchain);
    this.writeBlock(block);

    // Clear the mempool
    this.mempool = [];

    // broadcast the block
  }

  transfer(from, to, amount) {
    // Get the nonce for the from account
    const nonce = this.getAccountNonce(from);

    // Create the action
    const action = {
      type: "transfer",
      from,
      to,
      amount,
    };

    // Sign the action
    const signature = sign_data(this.privateKey, action);

    // Add the transaction to the blockchain
    return this.addTx(from, nonce, action, signature);
  }

  writeBlock(block) {
    // Add block to the blockchain
    blockchain.push(block);

    // Return the block
    return block;
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