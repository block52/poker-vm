import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe.skip("Token", () => {
    const fixture = async () => {
        const Token = await hre.ethers.getContractFactory("Token");
        const token = await Token.deploy();

        return { token };
    };

    describe("Deployment", () => {
        it("Should set the name and symbol", async function () {
            const { token } = await loadFixture(fixture);

            expect(await token.name()).to.equal("Block52");
        });
    });
});
