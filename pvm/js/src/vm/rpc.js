const express = require("express");
const router = express.Router();

const Account = require("../schemas/account");
const AccountState = require("./account_state");
const contracts = require("../models/contract");
const games = require("../models/game");
const transactions = require("../models/transaction");

const { Holdem } = require("./holdem");
const VM = require("./vm");

const { getServer } = require("../server");

const _validator_account =
  "795844fd4b531b9d764cfa2bf618de808fe048cdec9e030ee49df1e464bddc68";

router.post("/", async (req, res) => {
  const { method, params, id } = req.body;
  const vm = new VM(_validator_account);

  const server = getServer();
  const { response, error } = await server.processMessage(req.body);

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

  if (error) {
    return res.status(400).json({ error, id });
  }

  if (response !== null) {
    return res.status(200).json({ result: response, error: null, id });
  }

  return res.status(404).json({ error: "Method not found", id });
});

const handleWriteTransaction = async (tx) => {
  let response = null;
  let error = null;

  const { method, params, id, data, signature } = tx;

  // if (await is_nonce_valid(nonce, account)) {
  //   error = "Invalid nonce";
  //   return response, error;
  // }

  // Write methods
  switch (method) {
    case "mint":
      // add tokens to the owner
      // const signature = params[2];
      // await vm.mint(params[0], params[1]);

      const account = params[0];
      response = vm.addTx(account, nonce, data, signature, timestamp);
      break;
    case "new":
      if (vm.getAccount(params[0]).balance < 100) {
        error = "Insufficient funds";
        return response, error;
      }

      const new_game = new Game({
        owner: account,
        contract_hash: "",
        type: "holdem",
        hash: "",
      });

      await new_game.save();

      // // PVM to write and subtract a fee from the account
      // account.balance -= 100;
      // await account.save();

      // validator_account.balance += 100;
      // await validator_account.save();

      response = new_game.id;
      break;
    case "shuffle":
      break;
    case "transfer":
      await account_state.transfer(params[0], params[1], params[2]);
      const tx = "";
      return res.status(200).json({ result: tx, error: null, id: id });
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
      throw new Error("Not implemented");
    case "mine":
      // hack for PVM to mine a block
      await vm.mine();
  }
};

module.exports = router;
