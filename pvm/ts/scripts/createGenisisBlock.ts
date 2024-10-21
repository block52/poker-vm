import { Block } from "../src/models/block";
import { ethers } from "ethers";

import dotenv from "dotenv";
dotenv.config();

const createGenesisBlock = (): Block => {
    const index = 0;
    const previousHash = ethers.ZeroHash;
    const timestamp = 0;
    const privateKey = process.env.GENESIS_PRIVATE_KEY || "";
    const block = Block.create(index, previousHash, timestamp, privateKey);

    return block;
}

const block = createGenesisBlock();
console.log(block.toJson());