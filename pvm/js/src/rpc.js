const express = require("express");
const router = express.Router();

const dotenv = require("dotenv");
dotenv.config();

const { getServer } = require("./server");

router.post("/", async (req, res) => {
  try {
    const { method, params, id } = req.body;

    let response = {
      result: null,
      error: null,
      id,
    };

    const server = getServer(process.env.VALIDATOR_KEY);

    response.result = await server.processMessage(req.body);

    if (response.result !== null) {
      return res.status(200).json(response);
    }

    response.error = "error processing request";
    return res.status(400).json(response);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
