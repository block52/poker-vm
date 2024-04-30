const express = require("express");
const router = express.Router();

const accounts = require("../models/account");
const contracts = require("../models/contract");
const games = require("../models/game");
const transactions = require("../models/transaction");

const { Holdem } = require("./holdem");

// const { verify_signature } = require("crypto_utils");
// const { verify_signature, sign_data } = require("../vm/crypto_utils");

const verify_signature = (public_key, signature, data) => {
  const key = ec.keyFromPublic(public_key, "hex");
  return key.verify(data, signature);
};

const sign_data = (private_key, data) => {
  const key = ec.keyFromPrivate(private_key, "hex");
  return key.sign(data).toDER("hex");
};

const _validator_account = "0x";

router.post("/rpc", async (req, res) => {
  const { method, params } = req.body;

  // const data = params?.data;

  // if (!data) {
  //   return res.status(400).json({ error: "Data is required" });
  // }

  // const account = params?.account;
  // const signature = params?.signature;

  // if (!verify_signature(account, signature, data)) {
  //   return res.status(401).json({ error: "Invalid signature" });
  // }

  //   switch (method) {
  //     case "add":
  //       return res.json({ result: params[0] + params[1] });
  //     case "sub":
  //       return res.json({ result: params[0] - params[1] });
  //     case "mul":
  //       return res.json({ result: params[0] * params[1] });
  //     case "div":
  //       return res.json({ result: params[0] / params[1] });
  //     default:
  //       return res.status(404).json({ error: "Method not found" });
  //   }

  switch (method) {
    // readonly methods
    case "getAccount":
      const account = accounts.find(params[0]);
      return res.json({ result: account });
    case "tx":
      break;
    // case "getBalance":
    //   const account = accounts.find(params[0]);
    //   return res.json({ result: accounts.getBalance(params[0]) });
  }

  const account = await accounts.find(params[0]);
  const validator_account = await accounts.find(_validator_account);

  // Write methods
  switch (method) {
    case "new":
      if (account.balance < 100) {
        return res.status(400).json({ error: "Insufficient funds" });
      }

      const game = new Game({
        owner: account,
        contract_hash: "",
        type: "holdem",
        hash: "",
      });

      await game.save();

      // PVM to write and subtract a fee from the account
      account.balance -= 100;
      await account.save();

      validator_account.balance += 100;
      await validator_account.save();

      return res.json({ result: game.id });

    case "shuffle":

    case "transfer":

    case "join":
      const address = params[1];
      const amount = params[2];
      const index = params[3];
      // const game = await games.find(params[0]);

      break;
    case "deal":
      throw new Error("Not implemented");
    case "action":
      break;
  }

  return res.status(404).json({ error: "Method not found" });
  //   const result = rpc[method](...params);
  //   res.json({ result });
});

module.exports = router;
