const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post("/rpc", (req, res) => {
  const { method, params } = req.body;

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
