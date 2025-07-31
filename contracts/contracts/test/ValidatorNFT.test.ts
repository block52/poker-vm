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

    describe("Token ID mapping", function () {
        it("should map token IDs to correct mnemonics following deck.test.ts order", async function () {
            // Test the complete deck ordering from deck.test.ts:
            // "AC-2C-3C-4C-5C-6C-7C-8C-9C-TC-JC-QC-KC-" +
            // "AD-2D-3D-4D-5D-6D-7D-8D-9D-TD-JD-QD-KD-" +
            // "AH-2H-3H-4H-5H-6H-7H-8H-9H-TH-JH-QH-KH-" +
            // "AS-2S-3S-4S-5S-6S-7S-8S-9S-TS-JS-QS-KS"
            
            // Test first few cards (Clubs) - token IDs 0-12
            expect(await validatorNFT.getCardMnemonic(0)).to.equal("AC");   // Ace of Clubs
            expect(await validatorNFT.getCardMnemonic(1)).to.equal("2C");   // 2 of Clubs
            expect(await validatorNFT.getCardMnemonic(2)).to.equal("3C");   // 3 of Clubs
            expect(await validatorNFT.getCardMnemonic(9)).to.equal("TC");   // Ten of Clubs (T, not 10)
            expect(await validatorNFT.getCardMnemonic(12)).to.equal("KC");  // King of Clubs

            // Test Diamonds (token IDs 13-25)
            expect(await validatorNFT.getCardMnemonic(13)).to.equal("AD");  // Ace of Diamonds
            expect(await validatorNFT.getCardMnemonic(14)).to.equal("2D");  // 2 of Diamonds
            expect(await validatorNFT.getCardMnemonic(22)).to.equal("TD");  // Ten of Diamonds
            expect(await validatorNFT.getCardMnemonic(25)).to.equal("KD");  // King of Diamonds

            // Test Hearts (token IDs 26-38)
            expect(await validatorNFT.getCardMnemonic(26)).to.equal("AH");  // Ace of Hearts
            expect(await validatorNFT.getCardMnemonic(35)).to.equal("TH");  // Ten of Hearts
            expect(await validatorNFT.getCardMnemonic(38)).to.equal("KH");  // King of Hearts

            // Test Spades (token IDs 39-51)
            expect(await validatorNFT.getCardMnemonic(39)).to.equal("AS");  // Ace of Spades
            expect(await validatorNFT.getCardMnemonic(48)).to.equal("TS");  // Ten of Spades
            expect(await validatorNFT.getCardMnemonic(51)).to.equal("KS");  // King of Spades
        });

        it("should correctly map suit and rank for all token IDs", async function () {
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

        it("should reject invalid token IDs", async function () {
            await expect(validatorNFT.getCardMnemonic(52)).to.be.revertedWith("getCardMnemonic: Token ID out of range");
            await expect(validatorNFT.getCardMnemonic(100)).to.be.revertedWith("getCardMnemonic: Token ID out of range");
        });
    });

    describe("Minting functionality", function () {
        it("should mint cards by token ID and default to disabled", async function () {
            // Mint Ace of Clubs (token ID 0)
            await validatorNFT.mint(validator1.address, 0);
            expect(await validatorNFT.ownerOf(0)).to.equal(validator1.address);
            expect(await validatorNFT.cardMinted(0)).to.be.true;
            expect(await validatorNFT.cardDisabled(0)).to.be.true; // Should be disabled by default
            expect(await validatorNFT.isValidator(validator1.address)).to.be.false; // Not a validator until enabled
            
            // Token owner toggles the card to enable it
            await validatorNFT.connect(validator1).toggleX(0);
            expect(await validatorNFT.cardDisabled(0)).to.be.false;
            expect(await validatorNFT.isValidator(validator1.address)).to.be.true; // Now a validator
            
            // Mint King of Spades (token ID 51) - also disabled by default
            await validatorNFT.mint(validator1.address, 51);
            expect(await validatorNFT.ownerOf(51)).to.equal(validator1.address);
            expect(await validatorNFT.cardMinted(51)).to.be.true;
            expect(await validatorNFT.cardDisabled(51)).to.be.true; // Also disabled by default
        });

        it("should prevent double minting of same card", async function () {
            await validatorNFT.mint(validator1.address, 0);
            await expect(validatorNFT.mint(validator1.address, 0)).to.be.revertedWith("mint: Card already minted");
        });

        it("should track minted card count correctly", async function () {
            expect(await validatorNFT.totalSupply()).to.equal(0);
            
            await validatorNFT.mint(validator1.address, 0);
            expect(await validatorNFT.totalSupply()).to.equal(1);
            
            await validatorNFT.mint(validator1.address, 13);
            expect(await validatorNFT.totalSupply()).to.equal(2);
        });

        it("should have maximum of 52 validators", async function () {
            expect(await validatorNFT.MAX_VALIDATORS()).to.equal(52);
        });

        it("should return correct tokenURI", async function () {
            // Initially empty URI
            expect(await validatorNFT.tokenURI(0)).to.equal("");
            
            // Set individual token URIs
            await validatorNFT.setTokenURI(0, "https://nft.block52.xyz/tokenid/0");
            await validatorNFT.setTokenURI(1, "https://api.example.com/metadata/1.json");
            await validatorNFT.setTokenURI(51, "ipfs://QmHash/51");
            
            expect(await validatorNFT.tokenURI(0)).to.equal("https://nft.block52.xyz/tokenid/0");
            expect(await validatorNFT.tokenURI(1)).to.equal("https://api.example.com/metadata/1.json");
            expect(await validatorNFT.tokenURI(51)).to.equal("ipfs://QmHash/51");
        });

        it("should reject invalid token IDs for tokenURI", async function () {
            await expect(validatorNFT.tokenURI(52))
                .to.be.revertedWith("tokenURI: Token ID out of range");
            
            await expect(validatorNFT.tokenURI(100))
                .to.be.revertedWith("tokenURI: Token ID out of range");
        });

        it("should only allow owner to set token URI", async function () {
            // Non-owner should not be able to set token URI
            await expect(validatorNFT.connect(validator1).setTokenURI(0, "https://example.com/0"))
                .to.be.revertedWithCustomError(validatorNFT, "OwnableUnauthorizedAccount");
            
            // Owner should be able to set token URI
            await validatorNFT.setTokenURI(0, "https://example.com/0");
            expect(await validatorNFT.tokenURI(0)).to.equal("https://example.com/0");
        });
    });

    describe("Enable/Disable functionality", function () {
        it("should not allow toggling unminted tokens", async function () {
            // Try to toggle an unminted token - should fail
            await expect(validatorNFT.toggleX(0))
                .to.be.revertedWith("toggleX: Token not minted");
        });

        it("should allow token owner to toggle their tokens", async function () {
            // Mint a token to validator1 (will be disabled by default)
            await validatorNFT.mint(validator1.address, 0);
            expect(await validatorNFT.cardDisabled(0)).to.be.true;
            expect(await validatorNFT.isValidator(validator1.address)).to.be.false;
            
            // Token owner toggles to enable their token
            await expect(validatorNFT.connect(validator1).toggleX(0))
                .to.emit(validatorNFT, "CardEnabled")
                .withArgs(0);
            
            expect(await validatorNFT.cardDisabled(0)).to.be.false;
            expect(await validatorNFT.isValidator(validator1.address)).to.be.true;
            
            // Token owner toggles again to disable their token
            await expect(validatorNFT.connect(validator1).toggleX(0))
                .to.emit(validatorNFT, "CardDisabled")
                .withArgs(0);
            
            expect(await validatorNFT.cardDisabled(0)).to.be.true;
            expect(await validatorNFT.isValidator(validator1.address)).to.be.false;
        });

        it("should not allow non-owners to toggle tokens", async function () {
            // Mint a token to validator1
            await validatorNFT.mint(validator1.address, 0);
            
            // Contract owner (different from token owner) should not be able to toggle
            await expect(validatorNFT.toggleX(0))
                .to.be.revertedWith("toggleX: Not token owner");
            
            // Another user should not be able to toggle
            const [, , validator2] = await ethers.getSigners();
            await expect(validatorNFT.connect(validator2).toggleX(0))
                .to.be.revertedWith("toggleX: Not token owner");
        });


        it("should reject invalid token IDs for toggle", async function () {
            await expect(validatorNFT.toggleX(52))
                .to.be.revertedWith("toggleX: Token ID out of range");
            
            await expect(validatorNFT.toggleX(100))
                .to.be.revertedWith("toggleX: Token ID out of range");
        });

        it("should handle multiple cards with mixed enabled/disabled states", async function () {
            // Mint multiple cards to same validator (all disabled by default)
            await validatorNFT.mint(validator1.address, 0);  // Ace of Clubs
            await validatorNFT.mint(validator1.address, 13); // Ace of Diamonds
            await validatorNFT.mint(validator1.address, 26); // Ace of Hearts
            
            expect(await validatorNFT.isValidator(validator1.address)).to.be.false; // All disabled by default
            
            // Token owner toggles one card to enable it
            await validatorNFT.connect(validator1).toggleX(0);
            expect(await validatorNFT.isValidator(validator1.address)).to.be.true; // Valid due to one enabled card
            
            // Token owner toggles another card to enable it
            await validatorNFT.connect(validator1).toggleX(13);
            expect(await validatorNFT.isValidator(validator1.address)).to.be.true; // Still valid
            
            // Token owner toggles first card to disable it
            await validatorNFT.connect(validator1).toggleX(0);
            expect(await validatorNFT.isValidator(validator1.address)).to.be.true; // Still valid due to card 13
            
            // Token owner toggles second card to disable it
            await validatorNFT.connect(validator1).toggleX(13);
            expect(await validatorNFT.isValidator(validator1.address)).to.be.false; // No enabled cards left (26 never enabled)
        });
    });
});