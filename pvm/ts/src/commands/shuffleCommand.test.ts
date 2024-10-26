import { ShuffleCommand } from "./shuffleCommand";

describe("ShuffleCommand", () => {

  it.skip("should shuffle new deck", async () => {
    // build leopard coyote vintage just syrup whip truth accident ritual absurd seat
    const command = new ShuffleCommand("0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb");
    const response = await command.execute();
    // expect(response).toEqual("0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb");
  });
});
