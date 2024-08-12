const Transaction = require("./models/transaction");
const TxPool = require("./txpool");
const AccountState = require("./vm/account_state");
const Block = require("./models/block");
const Blocks = require("./schemas/block");

class Server {
  constructor() {
    this.validator = ""; // validator public key
    this.mempool = new TxPool();
    this.account_state = new AccountState();
    this.version = 1;
    this.private_key =
      "795844fd4b531b9d764cfa2bf618de808fe048cdec9e030ee49df1e464bddc68";
  }

  async processMessage(message) {
    try {
      // if transaction, process transaction
      // if block, process block

      let { method, params, id, data, signature, nonce } = message;

      if (method === "get_balance") {
        const balance = await this.account_state.getBalance(params[0]);
        return balance;
      }

      if (method === "get_tx") {
        return await this.getTx(params[0]);
      }

      if (method === "get_account") {
        return await this.getAccount(params[0]);
      }

      if (method === "get_block") {
        return await this.getBlock(params[0]);
      }

      if (method === "get_blocks") {
        return await this.getBlocks();
      }

      if (method === "get_mempool") {
        const txs = await this.getMempool();
        return txs;
      }

      const from = data;
      const to = params[0];
      const value = params[1];

      if (!nonce) {
        nonce = await this.account_state.nonce(from);
      } else {
        // check if the nonce is valid
        const account = await this.account_state.getAccount(from);
        if (account.nonce !== parseInt(nonce)) {
          throw new Error("Invalid nonce");
        }
      }

      if (method === "send_transaction" || method == "mint") {
        const tx = new Transaction(to, data, value, "", signature, nonce);
        return await this.processTransaction(tx);
      }

      if (method === "create_block") {
        return await this.createNewBlock();
      }

      return null;
    } catch (e) {
      throw new Error(e);
    }
  }

  async getMempool() {
    const txs = this.mempool.getTransactions();
    return txs;
  }

  async createNewBlock() {
    const header = "";
    const txs = this.mempool.getTransactions();

    // get the last block
    const lastBlock = await Blocks.findOne().sort({ index: -1 });
    const index = lastBlock.index + 1;
    const timestamp = new Date().getTime();

    const block = new Block(index, lastBlock.hash, timestamp, this.validator);
    block.addTxs(txs);

    // sign the block
    block.sign(this.private_key);

    // clear the mempool
    this.mempool.clear();

    // save the block to the database
    const blockToAdd = new Blocks({
      index,
      version: this.version,
      hash: block.hash,
      merkle_root: "",
      previous_block_hash: lastBlock.previous_block_hash,
      timestamp,
      validator: block.validator,
      signature: block.signature,
      txs: txs,
    });

    await blockToAdd.save();
    return block;
  }

  // if someone sends us a block, we need to process it and add to the chain
  processBlock(block) {
    // check if the block is valid
    // if valid, add to the chain
    // if invalid, discard
  }

  async processTransaction(tx) {
    // write transactions
    if (this.mempool.contains(tx)) {
      throw new Error("Transaction already in mempool");
    }

    if (tx.verify()) {
      this.mempool.add(tx);
      return tx.hash;
    }

    throw new Error("Transaction is invalid");
  }

  bootstrapNetwork() {
    // connect to other validators
    // get the latest block
    // get the latest state

    console.log("Bootstrapping network ...");
  }

  genesisBlock() {
    // load the genesis block with the initial state
  }

  async validatorLoop() {
    // while (true) {
    const ticker = new Date().getTime();
    console.log(`Starting validator loop at ${ticker} ...`);

    const block = this.createNewBlock();
    this.processBlock(block);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    // }
  }
}

let server;

const getServer = () => {
  if (!server) {
    server = new Server();
  }

  return server;
};

module.exports = { getServer, Server };
