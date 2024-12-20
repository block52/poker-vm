import { Block } from "../src/models/block";
import { ethers } from "ethers";

import dotenv from "dotenv";
dotenv.config();

const createGenesisBlock = (): Block => {
    const index = 0;
    const previousHash = ethers.ZeroHash;
    const privateKey = ""
    const block = Block.create(index, previousHash, [], privateKey);

    return block;
}

const block = createGenesisBlock();
console.log(block.toJson());