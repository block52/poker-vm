const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");

const ethers = require("ethers");
const { HDNodeWallet, Mnemonic } = require("ethers");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

dotenv.config();

// use json
router.use(express.json());

const seed = process.env.SEED;

router.get("/:id", (req, res) => {
    const i = Number(req.params.id);
    const mnemonic = Mnemonic.fromPhrase(seed);

    // Create HD Node from mnemonic
    const hdNode = HDNodeWallet.fromMnemonic(mnemonic);
    const wallet = hdNode.derivePath(`m/44'/60'/0'/0/${i}`);

    const response = {
        id: req.params.id,
        address: wallet.address,
        privateKey: wallet.privateKey,
        path: `m/44'/60'/0'/0/${i}`,
        balance: ethers.parseEther("1.0")
    };

    res.send(response);
    return;
});

router.get("/:address", (req, res) => {
    const response = {
        address: address,
        privateKey: wallet.privateKey,
        balance: ethers.parseEther("1.0")
    };

    res.send(response);
});

router.post("/authenticate", (req, res) => {
    const passwordHash = bcrypt.hashSync(req.body.password, 10);

    // create a JWT
    const token = jwt.sign({ email: req.body.email }, process.env.SECRET);

    res.send(token);
});

// /**
//  * @swagger
//  * /account/{id}:
//  */
// app.get("/account/:id", (req, res) => {
//     const response = {
//         id: req.params.id,
//         balance: ethers.parseEther("1.0")
//     };
//     res.send(response);
// });
