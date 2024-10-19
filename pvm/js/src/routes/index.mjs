// const express = require("express");
import express from "express";
const router = express.Router();

// const dotenv = require("dotenv");
import dotenv from "dotenv";
dotenv.config();

import { getServer } from "../server.js";

router.post("/", async (req, res) => {
  try {
    const { id } = req.body;

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

export default router;
