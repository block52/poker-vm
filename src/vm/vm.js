const fs = require("fs");

const account = require("./account");

class VM {
  blocks = [];

  async getAccountNonce(account) {
    const query = { account };
    const height = await account.countDocuments(query);

    return height;
  }

  addTx(nonce, action, signature) {
    // Create a new transaction
    const tx = new Transaction(nonce, action, signature);

    // Add transaction to the blockchain
    blockchain.push(tx);

    // Return the transaction
    return tx;
  }

  addBlock(block) {
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
