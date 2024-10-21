import { BlockCommand } from "./blockCommand";

describe("Block Command", () => {
  it("should get genesis block", () => {
    const command = new BlockCommand(BigInt(0));
    command.execute();
    // TODO: Add assertions to verify the command behavior
  });
});
