import { Validator } from "./validator";
// import { expect } from "chai";

describe.skip("Should get basse validator", () => {
    it("should get validator from Base", async () => {
        const validator = new Validator("https://base-mainnet.infura.io/v3/45104be888e14fe48999e39b2668a2e5");
        const result = await validator.isValidator("0x513d31f0aA9380C5A0F16A996850B9538f74F936");
        expect(result).toBe(true);
  });
});

