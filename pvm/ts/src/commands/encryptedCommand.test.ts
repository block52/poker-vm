import { EncryptCommand } from "./encryptCommand";

describe("EncryptedCommand", () => {
  it.only("should encrypt data with static iv", async () => {
    // build leopard coyote vintage just syrup whip truth accident ritual absurd seat
    const iv = "17164074518ccb49876b175b";
    const cards = "AD-TS";
    const sharedSecret = "0x040156db046507c793c69e3016dd425ab5e799ecc508b06c97246127254ea049857937b87e6fd56f576bd5043d54f7c5740e4c6e12fb40d76060c3a8e5e3f5b078";
    const command = new EncryptCommand(cards, sharedSecret, "0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb", iv);
    const response = await command.execute();
    // expect(response).toEqual("0x8bf5d2b410baf602fbb1ca59ab16b1772ca0f143950e12a2d4a2ead44ab845fb");

    console.log(response);

    expect(response.data.iv).toEqual("17164074518ccb49876b175b");
    expect(response.data.data).toEqual("96381c4676");
  });
});
