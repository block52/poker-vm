const express = require("express");
const router = express.Router();

const accounts = require("../models/account");
const contracts = require("../models/contract");
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

router.post("/rpc", (req, res) => {
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
      return res.json({ result: accounts.getAccount(params[0]) });
    case "getBalance":
      return res.json({ result: accounts.getBalance(params[0]) });
  }

  switch (method) {
    case "shuffle":

    case "transfer":

    case "join":
      return res.json({ result: holdem.addPlayer(params[0]) });
    case "deal":
      throw new Error("Not implemented");
  }

  return res.status(404).json({ error: "Method not found" });
  //   const result = rpc[method](...params);
  //   res.json({ result });
});

module.exports = router;
