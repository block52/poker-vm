const fs = require("fs");
const account = require("./account");

class VM {
  privateKey = "";
  isValidator = false;

  mempool = [];

  constructor(privateKey) {
    this.mempool = [];
    this.privateKey = privateKey;

    if (this.privateKey) {
      this.isValidator = true;
    }

    // set account 0 to the total supply
  }

  async getAccountNonce(account) {
    const query = { account };
    const height = await account.countDocuments(query);

    return height;
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
