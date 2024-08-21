const express = require("express");
const router = express.Router();

const Account = require("./schemas/account");
const AccountState = require("./vm/account_state");
const contracts = require("./models/contract");
const games = require("./models/game");
const transactions = require("./models/transaction");

const dotenv = require("dotenv");
dotenv.config();

const { Holdem } = require("./vm/holdem");
const VM = require("./vm/vm");

const { getServer } = require("./server");

const _validator_key = process.env.VALIDATOR_KEY;

router.post("/", async (req, res) => {

  let response = {
    result: null,
    error: null,
    id: null,
  };

  try {
    const { method, params, id } = req.body;
    response.id = id;
    
    const vm = new VM(_validator_key);
    const server = getServer();

    response.id = id;
    response.result = await server.processMessage(req.body);

    // switch (method) {
    //   // readonly methods
    //   case "get_account":
    //     const account = vm.getAccount(params[0]);
    //     return res.json({ result: account });
    //   case "get_tx":
    //     const tx = vm.getTx(params[0]);
    //     return res.json({ result: tx });
    //   // case "getBalance":
    //   //   const account = accounts.find(params[0]);
    //   //   return res.json({ result: accounts.getBalance(params[0]) });
    // }

    // let response,
    //   error = await handleWriteTransaction(req.body);


    if (response.result !== null) {
      return res.status(200).json(response);
    }

    response.error = "Method not found";
    return res.status(400).json(response);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
