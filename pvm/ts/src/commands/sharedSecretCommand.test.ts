import { SharedSecretCommand } from "./sharedSecretCommand";

describe.skip("SharedSecretCommand", () => {
  it("should create new shared secret with the validator", async () => {
    // build leopard coyote vintage just syrup whip truth accident ritual absurd seat
    const bob = "0x97f7f0D8792a4BedD830F65B533846437F5f3c32"; // m/44'/60'/0'/0/1
    const bob_public_key = "0x02128b323e95ece10537a100dfb0d09b4833ea9f6373e34da4e249386407c8fe1a";
    const command = new SharedSecretCommand(bob_public_key, "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb");
    const response = await command.execute();
    // expect(response).toEqual("0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb");

    console.log(response);
  });
});
