import { BlockCommand } from "./blockCommand";


describe("Block Command", () => {
  it("should get genisis block", () => {
    const command = new BlockCommand(0);
    command.execute();
    // TODO: Add assertions to verify the command behavior
  });
});
