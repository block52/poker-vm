import { Transaction } from "./transaction";

describe("Transaction Tests", () => {

  it.only("should create new Transaction model", async () => {
    // build leopard coyote vintage just syrup whip truth accident ritual absurd seat
    const actual = await Transaction.create("to", "from", BigInt(100), BigInt(1), "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb", "data");
    expect(actual).toBeDefined();
  });

  it.only("should create transaction properties", async () => {
    // build leopard coyote vintage just syrup whip truth accident ritual absurd seat
    const actual = await Transaction.create("to", "from", BigInt(100), BigInt(1), "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb", "data");
    expect(actual).toBeDefined();

    const hash = actual.calculateHash();
    expect(hash).toBeDefined();

    const id = actual.getId();
    expect(id).toBeDefined();
  });
});
