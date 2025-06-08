import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("NFT", () => {
    const fixture = async () => {
        const NFT = await hre.ethers.getContractFactory("ValidatorNFT");
        const nft = await NFT.deploy();

        return { nft };
    };

    describe("Properties", () => {
        it("Should get suit and rank", async () => {
            const { nft } = await loadFixture(fixture);

            const result = await nft.getSuitAndRank(0);
            expect(result.suit).to.equal(0);
            expect(result.rank).to.equal(0);
        });
    });
});
