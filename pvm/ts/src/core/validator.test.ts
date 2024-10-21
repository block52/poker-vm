import { Validator } from "./validator";
// import { expect } from "chai";

describe("Should get sepolia validator", () => {
  it("should get validator from sepolia", () => {
    const validator = new Validator("https://eth-sepolia.g.alchemy.com/v2/hA5NTyPHWE-WrgaZCSEaAkSYwYN1-jgi");
    const result = validator.isValidator("0x36c347E374Bf272AdD3B0FDfA5821795eBC0Fc9d");
    // expect(result).to.be.true;
  });
});

