import { expect } from "chai";
import { ethers } from "hardhat";
import { ValidatorNFT, ValidatorSale, IERC20 } from "../typechain-types";

describe("ValidatorSale Integration", function () {
    let validatorNFT: ValidatorNFT;
    let validatorSale: ValidatorSale;
    let usdc: IERC20;
    let owner: any;
    let treasury: any;
    let buyer1: any;
    let buyer2: any;

    const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const USDC_WHALE = "0x4B16c5dE96EB2117bBE5fd171E4d203624B014aa"; // Address with lots of USDC
    const PRICE = 52_000;
    const USDC_DECIMALS = 6;
    const PRICE_WITH_DECIMALS = PRICE * 10 ** USDC_DECIMALS;

    beforeEach(async function () {
        [owner, treasury, buyer1, buyer2] = await ethers.getSigners();

        // Deploy ValidatorNFT
        const ValidatorNFTFactory = await ethers.getContractFactory("ValidatorNFT");
        validatorNFT = await ValidatorNFTFactory.deploy("Poker Validators", "PVAL");
        await validatorNFT.waitForDeployment();

        // Deploy ValidatorSale
        const ValidatorSaleFactory = await ethers.getContractFactory("ValidatorSale");
        validatorSale = await ValidatorSaleFactory.deploy(
            await validatorNFT.getAddress(),
            treasury.address
        );
        await validatorSale.waitForDeployment();

        // Grant MINTER_ROLE to ValidatorSale
        const MINTER_ROLE = await validatorNFT.MINTER_ROLE();
        await validatorNFT.grantRole(MINTER_ROLE, await validatorSale.getAddress());

        // Get USDC contract
        usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);

        // For testing on local hardhat, we'll need mainnet forking
        // to use real USDC. For now, tests will fail without forking.
        // See Mainnet-Forking-Guide.md for setup instructions.
    });

    describe("Deployment and Setup", function () {
        it("should deploy with correct configuration", async function () {
            expect(await validatorSale.nft()).to.equal(await validatorNFT.getAddress());
            expect(await validatorSale.treasury()).to.equal(treasury.address);
            expect(await validatorSale.underlying()).to.equal(USDC_ADDRESS);
        });

        it("should have correct roles configured", async function () {
            const MINTER_ROLE = await validatorNFT.MINTER_ROLE();
            expect(await validatorNFT.hasRole(MINTER_ROLE, await validatorSale.getAddress())).to.be.true;
        });
    });

    describe("Purchase Flow", function () {
        it("should complete a full purchase flow", async function () {
            // Buyer approves USDC spending
            await usdc.connect(buyer1).approve(await validatorSale.getAddress(), PRICE_WITH_DECIMALS);
            
            // Check initial balances
            const initialTreasuryBalance = await usdc.balanceOf(treasury.address);
            const initialSaleContractBalance = await usdc.balanceOf(await validatorSale.getAddress());
            
            // Buyer purchases Ace of Clubs (token ID 0)
            await expect(validatorSale.connect(buyer1).buy(0))
                .to.emit(validatorSale, "Bought")
                .withArgs(buyer1.address, 0)
                .to.emit(validatorNFT, "ValidatorAdded")
                .withArgs(buyer1.address, 0, 1);
            
            // Verify NFT ownership
            expect(await validatorNFT.ownerOf(0)).to.equal(buyer1.address);
            // Token exists check is implicit - ownerOf would revert if not minted
            expect(await validatorNFT.cardDisabled(0)).to.be.true; // Disabled by default
            
            // Verify treasury received 52%
            const treasuryAmount = (PRICE_WITH_DECIMALS * 52) / 100;
            expect(await usdc.balanceOf(treasury.address)).to.equal(initialTreasuryBalance + BigInt(treasuryAmount));
            
            // Verify 48% remains in sale contract for bonding
            const bondingAmount = PRICE_WITH_DECIMALS - treasuryAmount;
            expect(await usdc.balanceOf(await validatorSale.getAddress())).to.equal(initialSaleContractBalance + BigInt(bondingAmount));
        });

        it("should handle multiple purchases", async function () {
            // Both buyers approve USDC
            await usdc.connect(buyer1).approve(await validatorSale.getAddress(), PRICE_WITH_DECIMALS);
            await usdc.connect(buyer2).approve(await validatorSale.getAddress(), PRICE_WITH_DECIMALS);
            
            // Buy different cards
            await validatorSale.connect(buyer1).buy(0); // Ace of Clubs
            await validatorSale.connect(buyer2).buy(51); // King of Spades
            
            // Verify ownership
            expect(await validatorNFT.ownerOf(0)).to.equal(buyer1.address);
            expect(await validatorNFT.ownerOf(51)).to.equal(buyer2.address);
            
            // Verify total supply
            expect(await validatorNFT.totalSupply()).to.equal(2);
        });

        it("should prevent double minting", async function () {
            await usdc.connect(buyer1).approve(await validatorSale.getAddress(), PRICE_WITH_DECIMALS * 2);
            
            await validatorSale.connect(buyer1).buy(0);
            
            await expect(validatorSale.connect(buyer1).buy(0))
                .to.be.revertedWith("mintAndTransfer: Card already minted");
        });
    });

    describe("Token Management", function () {
        it("should allow token owner to enable their validator", async function () {
            // Purchase NFT
            await usdc.connect(buyer1).approve(await validatorSale.getAddress(), PRICE_WITH_DECIMALS);
            await validatorSale.connect(buyer1).buy(0);
            
            // Initially not a validator (disabled by default)
            expect(await validatorNFT.isValidator(buyer1.address)).to.be.false;
            
            // Token owner enables their NFT
            await validatorNFT.connect(buyer1).toggleEnable(0);
            
            // Now they are a validator
            expect(await validatorNFT.isValidator(buyer1.address)).to.be.true;
            expect(await validatorNFT.cardDisabled(0)).to.be.false;
        });
    });

    describe("Treasury Management", function () {
        it("should allow owner to withdraw bonding funds to treasury", async function () {
            // Make a purchase to get funds in contract
            await usdc.connect(buyer1).approve(await validatorSale.getAddress(), PRICE_WITH_DECIMALS);
            await validatorSale.connect(buyer1).buy(0);
            
            // Calculate bonding amount (48%)
            const bondingAmount = (PRICE_WITH_DECIMALS * 48) / 100;
            expect(await usdc.balanceOf(await validatorSale.getAddress())).to.equal(bondingAmount);
            
            // Owner withdraws to treasury
            const treasuryBalanceBefore = await usdc.balanceOf(treasury.address);
            
            await expect(validatorSale.withdrawToTreasury())
                .to.emit(validatorSale, "WithdrawnToTreasury")
                .withArgs(bondingAmount);
            
            // Verify funds moved to treasury
            expect(await usdc.balanceOf(await validatorSale.getAddress())).to.equal(0);
            expect(await usdc.balanceOf(treasury.address)).to.equal(treasuryBalanceBefore + BigInt(bondingAmount));
        });

        it("should only allow owner to withdraw", async function () {
            await expect(validatorSale.connect(buyer1).withdrawToTreasury())
                .to.be.revertedWithCustomError(validatorSale, "OwnableUnauthorizedAccount");
        });
    });

    describe("Card Mnemonics", function () {
        it("should mint correct cards based on token ID", async function () {
            await usdc.connect(buyer1).approve(await validatorSale.getAddress(), PRICE_WITH_DECIMALS * 3);
            
            // Buy Ace of Clubs (0), King of Diamonds (25), and Ace of Spades (39)
            await validatorSale.connect(buyer1).buy(0);
            await validatorSale.connect(buyer1).buy(25);
            await validatorSale.connect(buyer1).buy(39);
            
            expect(await validatorNFT.getCardMnemonic(0)).to.equal("AC");
            expect(await validatorNFT.getCardMnemonic(25)).to.equal("KD");
            expect(await validatorNFT.getCardMnemonic(39)).to.equal("AS");
        });
    });
});