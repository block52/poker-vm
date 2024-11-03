import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Bridge", () => {
  const fixture = async () => {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const Token = await hre.ethers.getContractFactory("MockToken");
    const token = await Token.deploy("MockToken", "MTK");
    const tokenAddress = await token.getAddress();

    const Vault = await hre.ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(tokenAddress, 1, ethers.parseEther("10"));
    const vaultAddress = await vault.getAddress();

    const Bridge = await hre.ethers.getContractFactory("Bridge");
    const bridge = await Bridge.deploy(tokenAddress, vaultAddress, 1);

    return { bridge, owner, otherAccount };
  }

  describe("Deployment", () => {
    it("Should deploy bridge", async function () {
      const { bridge } = await loadFixture(fixture);

      const name = await bridge.name();
      expect(name).to.equal("MockToken Bridge");
    });
  });
});
