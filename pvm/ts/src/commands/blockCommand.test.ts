import Block from "./blockCommand";

describe("Block Command", () => {
  it("should execute without errors", () => {
    const command = new Block();
    command.execute();
    // TODO: Add assertions to verify the command behavior
  });
});
