const Transaction = require("./models/transaction");
const TxPool = require("./txpool");
const AccountState = require("./vm/account_state");
const Block = require("./models/block");

class Server {
  constructor() {
    this.validator = null;
    this.mempool = new TxPool();
    this.account_state = new AccountState();
  }

  async processMessage(message) {
    // if transaction, process transaction
    // if block, process block

    const { method, params, id, data, signature } = message;
    const to = params[0];
    const value = params[1];
    const nonce = 0;

    const tx = new Transaction(to, data, value, "", signature, nonce);

    return await this.processTransaction(tx);
  }

  async createNewBlock() {
    const header = "";

    const txs = this.mempool.getTransactions();
    const block = new Block(header, txs);

    await block.save();
  }

  processBlock() {}

  async processTransaction(tx) {
    if (tx.method === "get_balance") {
      const balance = await this.account_state.getBalance(tx.to);
      return { response: balance };
    }

    // write transactions
    if (this.mempool.contains(tx)) {
      return { error: "Transaction already in mempool" };
    }

    if (tx.verify()) {
      this.mempool.add(tx);
      return { response: "Transaction added to mempool" };
    }

    return { error: "Transaction failed verification" };
  }

  bootstrapNetwork() {

  }

  genesisBlock() {
    // load the genesis block with the initial state
  }

  async validatorLoop() {
    while (true) {
      const ticker = new Date().getTime();
      console.log(`Starting validator loop ${ticker} ...`);

      const block = this.createNewBlock();
      this.processBlock(block);

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
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
