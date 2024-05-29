const Transaction = require("./models/transaction");
const TxPool = require("./txpool");
const AccountState = require("./vm/account_state");

class Server {
  constructor() {
    this.validator = null;
    this.blocks = [];
    this.mempool = new TxPool();
    this.account_state = new AccountState();
  }

  validatorLoop() {
    // listen for incoming messages
    // process messages
    // if block message, process block
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
  }

  processBlock() {}

  async processTransaction(tx) {

    if (tx.method !== "get_balance") {
      const balance = await this.account_state.getBalance(tx.to);
      return { response: balance };
    }

    if (this.mempool.contains(tx)) {
      return { error: "Transaction already in mempool" };
    }

    if (tx.verify()) {
      this.mempool.add(tx);
      return { response: "Transaction added to mempool" };
    }

    return { error: "Transaction failed verification" };
  }

  bootstrapNetwork() {}

  genisisBlock() {}

  async validatorLoop() {
    const ticker = new Date().getTime();
    console.log(`Starting validator loop ${ticker} ...`);


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
