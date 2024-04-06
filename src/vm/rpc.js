const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

const Contract = require("./models/contract");

app.use(cors());
app.use(bodyParser.json());

app.post("/rpc", (req, res) => {
  const { method, params } = req.body;

  const data = params?.data;

  if (!data) {
    return res.status(400).json({ error: "Data is required" });
  }

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
    case "transfer":

    case "join":
      return res.json({ result: holdem.addPlayer(params[0]) });
    case "deal":
      throw new Error("Not implemented");
    default:
      return res.status(404).json({ error: "Method not found" });
  }

  //   const result = rpc[method](...params);
  //   res.json({ result });
});
