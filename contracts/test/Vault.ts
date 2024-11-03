import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Vault", () => {
    const fixture = async () => {
        // Contracts are deployed using the first signer/account by default
        // const [owner, otherAccount] = await hre.ethers.getSigners();

        const Token = await hre.ethers.getContractFactory("MockToken");
        const token = await Token.deploy("MockToken", "MTK");
        const tokenAddress = await token.getAddress();

        const Vault = await hre.ethers.getContractFactory("Vault");
        const vault = await Vault.deploy(tokenAddress, 1, ethers.parseEther("10"));

        return { vault };
    };

    describe("Deployment", () => {
        it("Should deploy vault", async function () {
            const { vault } = await loadFixture(fixture);
        });
    });
});
