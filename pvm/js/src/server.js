const Transaction = require("./models/transaction");
const TxPool = require("./txpool");

class Server {
  constructor() {
    this.validator = null;
    this.blocks = [];
    this.mempool = new TxPool();
  }

  validatorLoop() {
    // listen for incoming messages
    // process messages
    // if block message, process block
  }

  processMessage(message) {
    // if transaction, process transaction
    // if block, process block

    const { method, params, id, data, signature } = message;
    const to = params[0];
    const value = params[1];
    const nonce = 0;

    const tx = new Transaction(to, data, value, "", signature, nonce);

    return this.processTransaction(tx);
  }

  processBlock() {}

  processTransaction(tx) {
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
}

let server;

const getServer = () => {
  if (!server) {
    server = new Server();
  }

  return server;
};

module.exports = { getServer, Server };
