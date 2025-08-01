import { expect } from "chai";
import { ethers } from "hardhat";
import { ValidatorNFT } from "../typechain-types";

describe("ValidatorNFT and ValidatorSale Integration", function () {
    let validatorNFT: ValidatorNFT;
    let owner: any;
    let treasury: any;
    let saleContract: any;
    let buyer1: any;
    let buyer2: any;

    beforeEach(async function () {
        [owner, treasury, saleContract, buyer1, buyer2] = await ethers.getSigners();

        // Deploy ValidatorNFT
        const ValidatorNFTFactory = await ethers.getContractFactory("ValidatorNFT");
        validatorNFT = await ValidatorNFTFactory.deploy("Poker Validators", "PVAL");
        await validatorNFT.waitForDeployment();

        // Grant MINTER_ROLE to sale contract (simulating ValidatorSale)
        const MINTER_ROLE = await validatorNFT.MINTER_ROLE();
        await validatorNFT.grantRole(MINTER_ROLE, saleContract.address);
    });

    describe("Integration Flow", function () {
        it("should demonstrate complete purchase and activation flow", async function () {
            // Step 1: Sale contract mints NFT to buyer (simulating ValidatorSale.buy())
            await validatorNFT.connect(saleContract).mintAndTransfer(buyer1.address, 0);
            
            // Verify NFT ownership
            expect(await validatorNFT.ownerOf(0)).to.equal(buyer1.address);
            expect(await validatorNFT.getCardMnemonic(0)).to.equal("AC"); // Ace of Clubs
            
            // Step 2: NFT is disabled by default
            expect(await validatorNFT.cardDisabled(0)).to.be.true;
            expect(await validatorNFT.isValidator(buyer1.address)).to.be.false;
            
            // Step 3: Buyer enables their NFT
            await validatorNFT.connect(buyer1).toggleEnable(0);
            
            // Verify validator status
            expect(await validatorNFT.cardDisabled(0)).to.be.false;
            expect(await validatorNFT.isValidator(buyer1.address)).to.be.true;
        });

        it("should handle multiple validators", async function () {
            // Mint different cards to different buyers
            await validatorNFT.connect(saleContract).mintAndTransfer(buyer1.address, 0);  // Ace of Clubs
            await validatorNFT.connect(saleContract).mintAndTransfer(buyer2.address, 51); // King of Spades
            
            // Both are disabled initially
            expect(await validatorNFT.isValidator(buyer1.address)).to.be.false;
            expect(await validatorNFT.isValidator(buyer2.address)).to.be.false;
            
            // Only buyer1 enables their NFT
            await validatorNFT.connect(buyer1).toggleEnable(0);
            
            // Check validator statuses
            expect(await validatorNFT.isValidator(buyer1.address)).to.be.true;
            expect(await validatorNFT.isValidator(buyer2.address)).to.be.false;
            
            // Total supply should be 2
            expect(await validatorNFT.totalSupply()).to.equal(2);
            expect(await validatorNFT.validatorCount()).to.equal(2);
        });

        it("should prevent unauthorized minting", async function () {
            // Non-sale contract cannot mint
            await expect(validatorNFT.connect(buyer1).mintAndTransfer(buyer1.address, 0))
                .to.be.reverted;
            
            // Owner can still use regular mint function
            await validatorNFT.connect(owner).mint(buyer1.address, 0);
            expect(await validatorNFT.ownerOf(0)).to.equal(buyer1.address);
        });

        it("should enforce proper access control for toggling", async function () {
            // Mint to buyer1
            await validatorNFT.connect(saleContract).mintAndTransfer(buyer1.address, 0);
            
            // buyer2 cannot toggle buyer1's NFT
            await expect(validatorNFT.connect(buyer2).toggleEnable(0))
                .to.be.revertedWith("toggleEnable: Not token owner");
            
            // Contract owner cannot toggle buyer1's NFT
            await expect(validatorNFT.connect(owner).toggleEnable(0))
                .to.be.revertedWith("toggleEnable: Not token owner");
            
            // Only token owner can toggle
            await validatorNFT.connect(buyer1).toggleEnable(0);
            expect(await validatorNFT.cardDisabled(0)).to.be.false;
        });

        it("should track validator eligibility with multiple cards", async function () {
            // Buyer1 gets 3 cards
            await validatorNFT.connect(saleContract).mintAndTransfer(buyer1.address, 0);  // AC
            await validatorNFT.connect(saleContract).mintAndTransfer(buyer1.address, 13); // AD
            await validatorNFT.connect(saleContract).mintAndTransfer(buyer1.address, 26); // AH
            
            // All disabled, not a validator
            expect(await validatorNFT.isValidator(buyer1.address)).to.be.false;
            
            // Enable one card
            await validatorNFT.connect(buyer1).toggleEnable(0);
            expect(await validatorNFT.isValidator(buyer1.address)).to.be.true;
            
            // Disable it again
            await validatorNFT.connect(buyer1).toggleEnable(0);
            expect(await validatorNFT.isValidator(buyer1.address)).to.be.false;
            
            // Enable a different card
            await validatorNFT.connect(buyer1).toggleEnable(13);
            expect(await validatorNFT.isValidator(buyer1.address)).to.be.true;
        });
    });

    describe("Card Deck Integrity", function () {
        it("should maintain correct card mappings after sale", async function () {
            // Mint cards in non-sequential order
            await validatorNFT.connect(saleContract).mintAndTransfer(buyer1.address, 51); // KS
            await validatorNFT.connect(saleContract).mintAndTransfer(buyer1.address, 0);  // AC
            await validatorNFT.connect(saleContract).mintAndTransfer(buyer2.address, 26); // AH
            
            // Verify correct mnemonics
            expect(await validatorNFT.getCardMnemonic(51)).to.equal("KS");
            expect(await validatorNFT.getCardMnemonic(0)).to.equal("AC");
            expect(await validatorNFT.getCardMnemonic(26)).to.equal("AH");
            
            // Verify suit and rank
            const [suit0, rank0] = await validatorNFT.getSuitAndRank(0);
            expect(suit0).to.equal(0); // Clubs
            expect(rank0).to.equal(0); // Ace
            
            const [suit51, rank51] = await validatorNFT.getSuitAndRank(51);
            expect(suit51).to.equal(3); // Spades
            expect(rank51).to.equal(12); // King
        });
    });
});