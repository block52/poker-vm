import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Vault", () => {
  const fixture = async () => {
    // Contracts are deployed using the first signer/account by default
    // const [owner, otherAccount] = await hre.ethers.getSigners();

    const Vault = await hre.ethers.getContractFactory("Vault");
    const vault = await Vault.deploy();

    return { vault };
  }

  describe("Deployment", () => {
    it("Should deploy vault", async function () {
      const { vault } = await loadFixture(fixture);
    });
  });
});
