import { ethers } from "ethers";
import { Block } from "./block";

describe.skip("Block Tests", () => {

  it("should create new Block model", async () => {
    // build leopard coyote vintage just syrup whip truth accident ritual absurd seat
    const actual = await Block.create(1, ethers.ZeroHash, [], "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb");
    expect(actual).toBeDefined();
  });

  it("should get block hash", async () => {
    // build leopard coyote vintage just syrup whip truth accident ritual absurd seat
    const block = await Block.create(1, ethers.ZeroHash, [], "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb");
    block.calculateHash();
    expect(block.hash).toBeDefined();
  });
});
