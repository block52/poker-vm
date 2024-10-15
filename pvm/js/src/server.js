import { randomBytes } from "crypto";
import TxPool from "./vm/txpool.mjs";

import Block from "./models/block.mjs";
import Contract from "./models/contract.mjs";
import Transaction from "./models/transaction.mjs";

import AccountState from "./vm/state_management/account_state.mjs";
import Blockchain from "./vm/state_management/blockchain";

import { findOne } from "./schemas/transaction";
import { recover_public_key } from "./crypto_utils";
import { Wallet, JsonRpcProvider } from "ethers";
import { config } from "dotenv";

config();

class Server {
  constructor(private_key) {
    this.mempool = new TxPool();
    this.account_state = new AccountState();
    this.version = 1;
    this.private_key = private_key;

    // get public key from private key
    const wallet = new Wallet(this.private_key);
    this.validator = wallet.address;
  }

  async processMessage(message) {
    try {
      // if transaction, process transaction
      // if block, process block

      let { method, params, id, data, signature, nonce } = message;

      if (!method) {
        throw new Error("Method is required");
      }

      console.log(`Processing message: ${method}`);

      if (method === "get_version") {
        return this.version;
      }

      if (method === "get_height") {
        return this.validator;
      }

      if (method === "get_balance") {
        const balance = await this.account_state.getBalance(params[0]);
        return balance;
      }

      if (method === "get_tx") {
        const tx = await this.mempool.getTransaction(params[0]);
        return tx;
      }

      if (method === "get_account") {
        return await this.getAccount(params[0]);
      }

      if (method === "get_block") {
        const blockchain = new Blockchain();
        const block = await blockchain.getBlock(params[0]);
        return block;
      }

      if (method === "get_mempool") {
        const txs = await this.getMempool();

        // TODO: RESHAPE

        return txs;
      }

      if (method === "get_random") {
        const buffer = await randomBytes(32);
        return buffer.toString("hex");
      }

      if (method === "mine") {
        if (!this.private_key) {
          throw new Error("Not a validator");
        }

        console.log("Mining block ...");

        const blockchain = new Blockchain();
        const txs = this.mempool.getTransactions();
        console.log(`Mempool size: ${txs.length}`);

        const block = await blockchain.newBlock(txs);

        if (!block) {
          throw new Error("Failed to create block");
        }

        // sign the block
        await block.sign(this.private_key);

        // add the block to the chain
        await blockchain.addBlock();

        // clear the mempool
        this.mempool.clear();

        // notify all the other nodes via web sockets

        return block?.hash;
      }

      if (method === "mint") {
        if (params.length < 2) {
          throw new Error("Invalid parameters for mint");
        }

        // Do a regex check for the data, must be a hex string of 64 characters
        const signatureRegex = /^[0-9a-fA-F]{64}$/;

        if (!signatureRegex.test(signature) && signature !== "TEST") {
          throw new Error("Valid signature id is required");
        }

        const dataRegex = /^[0-9a-fA-F]{32}$/;

        if (!dataRegex.test(data) && signature !== "TEST") {
          throw new Error("Valid Mainnet tx id is required");
        }

        if (signature !== "TEST") {
          // Verify the tx event id has not been used before
          const found = await findOne({
            data: data,
          });

          if (found) {
            throw new Error("Transaction already exists");
          }

          // Check the event is on chain
          const provider = new JsonRpcProvider(process.env.RPC_URL);
          const txReceipt = await provider.waitForTransaction(params[0], 1);

          if (!txReceipt) {
            throw new Error("Transaction not found");
          }
        }

        // Get signature
        const to = params[0];
        const value = params[1];
        const from = recover_public_key(signature, data); // TODO: should be this validator's public key
        const sender = recover_public_key(signature, data);

        const tx = new Transaction(to, data, value, "", signature, nonce);
        return await this.mint(tx);
      }

      // GAME LOGIC
      if (
        method === "fold" ||
        method === "call" ||
        method === "raise" ||
        method === "check" ||
        method === "bet"
      ) {
        // Get game state
        const contract_address = params[0];
        const contract = await Contracts.findOne({
          address: contract_address,
        });

        if (!contract) {
          throw new Error("Contract not found");
        }

        contract.processAction({ method, params });
      }

      // use recover public key to get the public key
      const from = data;

      if (!nonce) {
        nonce = await this.account_state.nonce(from);
      } else {
        // check if the nonce is valid
        const account = await this.account_state.getAccount(from);
        if (account.nonce !== parseInt(nonce)) {
          throw new Error("Invalid nonce");
        }
      }

      if (method === "deploy" || method === "deploy_contract") {
        const object = {
          type: "poker",
          variant: "texas_holdem",
        };

        const _data = JSON.stringify(object);
        const sender = recover_public_key(signature);
        const tx = new Transaction(from, _data, 0, sender, signature, nonce);

        return await this.processTransaction(tx);
      }

      if (method === "send_transaction") {
        const to = params[0];
        const value = params[1];
        const sender = recover_public_key(signature);

        const tx = new Transaction(to, data, value, sender, signature, nonce);
        return await this.processTransaction(tx);
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

  // if someone sends us a block, we need to process it and add to the chain
  processBlock(block) {
    // check if the block is valid
    // if valid, add to the chain
    // if invalid, discard
  }

  async mint(tx) {
    // write transactions
    if (this.mempool.contains(tx)) {
      throw new Error(`Transaction ${tx.hash} already in mempool`);
    }

    // mint new coins
    if (tx.verify()) {
      this.mempool.add(tx);
      return tx.hash;
    }

    throw new Error("Transaction is invalid");
  }

  async processTransaction(tx) {
    // write transactions
    if (this.mempool.contains(tx)) {
      throw new Error(`Transaction ${tx.hash} already in mempool`);
    }

    if (!tx.verify()) {
      throw new Error("Transaction is invalid");
    }

    this.mempool.add(tx);
    return tx.hash;
  }

  async bootstrapNetwork() {
    // connect to other validators

    await axios.get();

    // get the latest block
    // get the latest state

    // verify the block

    console.log("Bootstrapping network ...");
  }

  async validatorLoop() {
    // while (true) {
    const ticker = new Date().getTime();
    console.log(`Starting validator loop at ${ticker} ...`);

    const block = await this.createNewBlock();
    this.processBlock(block);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    // }
  }
}

let server;

const getServer = (private_key) => {
  if (!server) {
    server = new Server(private_key);
  }

  return server;
};

export default { getServer, Server };
