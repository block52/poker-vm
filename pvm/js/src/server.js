const Transaction = require("./models/transaction");
const TxPool = require("./models/txpool");

export class Server {
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

    ProcessMessage() {
        
    }

    processBlock() {
    }

    processTransaction(tx) {

        if (this.mempool.contains(tx)) {
            return;
        }

        if (tx.verify()) {
            this.mempool.add(tx);
        }
    }

    bootstrapNetwork() {
    }
}