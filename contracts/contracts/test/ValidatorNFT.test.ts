import { expect } from "chai";
import { ethers } from "hardhat";
import { ValidatorNFT } from "../typechain-types";

describe("ValidatorNFT Card Deck Mapping", function () {
    let validatorNFT: ValidatorNFT;
    let owner: any;
    let validator1: any;

    beforeEach(async function () {
        [owner, validator1] = await ethers.getSigners();
        
        const ValidatorNFTFactory = await ethers.getContractFactory("ValidatorNFT");
        validatorNFT = await ValidatorNFTFactory.deploy("Poker Validators", "PVAL");
        await validatorNFT.waitForDeployment();
    });

    describe("Card position mapping", function () {
        it("should map card positions to correct mnemonics following deck.test.ts order", async function () {
            // Test the complete deck ordering from deck.test.ts:
            // "AC-2C-3C-4C-5C-6C-7C-8C-9C-TC-JC-QC-KC-" +
            // "AD-2D-3D-4D-5D-6D-7D-8D-9D-TD-JD-QD-KD-" +
            // "AH-2H-3H-4H-5H-6H-7H-8H-9H-TH-JH-QH-KH-" +
            // "AS-2S-3S-4S-5S-6S-7S-8S-9S-TS-JS-QS-KS"
            
            // Test first few cards (Clubs)
            expect(await validatorNFT.getCardMnemonic(0)).to.equal("AC");   // Ace of Clubs
            expect(await validatorNFT.getCardMnemonic(1)).to.equal("2C");   // 2 of Clubs
            expect(await validatorNFT.getCardMnemonic(2)).to.equal("3C");   // 3 of Clubs
            expect(await validatorNFT.getCardMnemonic(9)).to.equal("TC");   // Ten of Clubs (T, not 10)
            expect(await validatorNFT.getCardMnemonic(12)).to.equal("KC");  // King of Clubs

            // Test Diamonds (positions 13-25)
            expect(await validatorNFT.getCardMnemonic(13)).to.equal("AD");  // Ace of Diamonds
            expect(await validatorNFT.getCardMnemonic(14)).to.equal("2D");  // 2 of Diamonds
            expect(await validatorNFT.getCardMnemonic(22)).to.equal("TD");  // Ten of Diamonds
            expect(await validatorNFT.getCardMnemonic(25)).to.equal("KD");  // King of Diamonds

            // Test Hearts (positions 26-38)
            expect(await validatorNFT.getCardMnemonic(26)).to.equal("AH");  // Ace of Hearts
            expect(await validatorNFT.getCardMnemonic(35)).to.equal("TH");  // Ten of Hearts
            expect(await validatorNFT.getCardMnemonic(38)).to.equal("KH");  // King of Hearts

            // Test Spades (positions 39-51)
            expect(await validatorNFT.getCardMnemonic(39)).to.equal("AS");  // Ace of Spades
            expect(await validatorNFT.getCardMnemonic(48)).to.equal("TS");  // Ten of Spades
            expect(await validatorNFT.getCardMnemonic(51)).to.equal("KS");  // King of Spades
        });

        it("should correctly map suit and rank for all positions", async function () {
            // Test Clubs (0-12)
            const [suit0, rank0] = await validatorNFT.getSuitAndRank(0);
            expect(suit0).to.equal(0); // Clubs
            expect(rank0).to.equal(0); // Ace

            // Test Diamonds (13-25)
            const [suit13, rank13] = await validatorNFT.getSuitAndRank(13);
            expect(suit13).to.equal(1); // Diamonds
            expect(rank13).to.equal(0); // Ace

            // Test Hearts (26-38)
            const [suit26, rank26] = await validatorNFT.getSuitAndRank(26);
            expect(suit26).to.equal(2); // Hearts
            expect(rank26).to.equal(0); // Ace

            // Test Spades (39-51)
            const [suit39, rank39] = await validatorNFT.getSuitAndRank(39);
            expect(suit39).to.equal(3); // Spades
            expect(rank39).to.equal(0); // Ace
        });

        it("should reject invalid card positions", async function () {
            await expect(validatorNFT.getCardMnemonic(52)).to.be.revertedWith("ValidatorNFT: Card position out of range");
            await expect(validatorNFT.getCardMnemonic(100)).to.be.revertedWith("ValidatorNFT: Card position out of range");
        });
    });

    describe("Minting functionality", function () {
        it("should mint cards by position", async function () {
            // Mint Ace of Clubs (position 0)
            await validatorNFT.mint(validator1.address, 0);
            expect(await validatorNFT.ownerOf(0)).to.equal(validator1.address);
            expect(await validatorNFT.cardMinted(0)).to.be.true;
            
            // Mint King of Spades (position 51)
            await validatorNFT.mint(validator1.address, 51);
            expect(await validatorNFT.ownerOf(51)).to.equal(validator1.address);
            expect(await validatorNFT.cardMinted(51)).to.be.true;
        });

        it("should prevent double minting of same card", async function () {
            await validatorNFT.mint(validator1.address, 0);
            await expect(validatorNFT.mint(validator1.address, 0)).to.be.revertedWith("ValidatorNFT: Card already minted");
        });

        it("should track minted card count correctly", async function () {
            expect(await validatorNFT.getMintedCardCount()).to.equal(0);
            
            await validatorNFT.mint(validator1.address, 0);
            expect(await validatorNFT.getMintedCardCount()).to.equal(1);
            
            await validatorNFT.mint(validator1.address, 13);
            expect(await validatorNFT.getMintedCardCount()).to.equal(2);
        });

        it("should have maximum of 52 validators", async function () {
            expect(await validatorNFT.MAX_VALIDATORS()).to.equal(52);
        });
    });
});