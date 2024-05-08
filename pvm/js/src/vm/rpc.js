const express = require("express");
const router = express.Router();

const Account = require("../models/account");
const contracts = require("../models/contract");
const games = require("../models/game");
const transactions = require("../models/transaction");

const { Holdem } = require("./holdem");
const VM = require("./vm.js");

const _validator_account = "795844fd4b531b9d764cfa2bf618de808fe048cdec9e030ee49df1e464bddc68";

router.post("/", async (req, res) => {

  const { method, params } = req.body;
  const vm = new VM(_validator_account);

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
    case "get_account":
      const account = vm.getAccount(params[0]);
      return res.json({ result: account });
    case "get_tx":
      const tx = vm.getTx(params[0]);
      return res.json({ result: tx });
    // case "getBalance":
    //   const account = accounts.find(params[0]);
    //   return res.json({ result: accounts.getBalance(params[0]) });
  }

  // const account = await accounts.find(params[0]);
  // const validator_account = await accounts.find(_validator_account);

  // Write methods
  switch (method) {
    case "mint":
      // add tokens to the owner
      // const signature = params[2];
      await vm.mint(params[0], params[1]);
      break;
    case "new":
      if (account.balance < 100) {
        return res.status(400).json({ error: "Insufficient funds" });
      }

      const new_game = new Game({
        owner: account,
        contract_hash: "",
        type: "holdem",
        hash: "",
      });

      await new_game.save();

      // PVM to write and subtract a fee from the account
      account.balance -= 100;
      await account.save();

      validator_account.balance += 100;
      await validator_account.save();

      return res.json({ result: game.id });

    case "shuffle":

    case "transfer":
      await vm.transfer(params[0], params[1], params[2]);
    case "join":
      const address = params[1];
      const amount = params[2];

      const result = await game.findOne(
        { address: address },
        { sort: { index: -1 } }
      );

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
