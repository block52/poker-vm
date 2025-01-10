import { ethers } from "ethers";
import { getMempoolInstance } from "../core/mempool";
import { Transaction } from "../models";
import { MineCommand } from "./mineCommand";

describe("MineCommand", () => {

  it.only("should mine a tx from mempool", async () => {

    const mempool = getMempoolInstance();

    const tx = new Transaction("0xC84737526E425D7549eF20998Fa992f88EAC2484", "0x859329813d8e500F4f6Be0fc934E53AC16670fa0", 100n, ethers.ZeroHash, ethers.ZeroHash, 0n, undefined, 0n, "data");
    await mempool.add(tx);
  
    const command = new MineCommand("0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb");
    const response = await command.execute();
  });
});
