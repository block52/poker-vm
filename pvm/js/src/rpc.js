const express = require("express");
const router = express.Router();

const Account = require("./schemas/account");
const AccountState = require("./vm/account_state");
const contracts = require("./models/contract");
const games = require("./schemas/game");
const transactions = require("./models/transaction");

const dotenv = require("dotenv");
dotenv.config();

const { Holdem } = require("./vm/holdem");
const VM = require("./vm/vm");

const { getServer } = require("./server");

const _validator_key = process.env.VALIDATOR_KEY;

router.post("/", async (req, res) => {

  try {
    const { method, params, id } = req.body;

    let response = {
      result: null,
      error: null,
      id,
    };
    
    const vm = new VM(_validator_key);
    const server = getServer();

    response.result = await server.processMessage(req.body);

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
