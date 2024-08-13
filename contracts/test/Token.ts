import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("Vault", () => {
 
  async function fixture() {

    // Contracts are deployed using the first signer/account by default
    // const [owner, otherAccount] = await hre.ethers.getSigners();

    const Token = await hre.ethers.getContractFactory("Token");
    const token = await Token.deploy();

    return { token };
  }

  describe("Deployment", () => {
    it("Should set the name and symbol", async function () {
      const { token } = await loadFixture(fixture);

      expect(await token.name()).to.equal("TEX");
    });
  });
});
