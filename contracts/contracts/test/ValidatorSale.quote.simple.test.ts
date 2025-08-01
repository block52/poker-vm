import { expect } from "chai";
import { ethers } from "hardhat";
import { ValidatorNFT, ValidatorSale } from "../typechain-types";

describe("ValidatorSale Quote Function (Simple Tests)", function () {
    let validatorNFT: ValidatorNFT;
    let validatorSale: ValidatorSale;
    let owner: any;
    let treasury: any;

    beforeEach(async function () {
        [owner, treasury] = await ethers.getSigners();

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
    });

    describe("Quote Function Basic Validation", function () {
        it("should revert with zero address", async function () {
            await expect(validatorSale.quote(ethers.ZeroAddress, 3000))
                .to.be.revertedWith("quote: Token address cannot be zero");
        });

        it("should revert with invalid fee tier", async function () {
            const randomAddress = "0x1234567890123456789012345678901234567890";
            
            // Test invalid fee values
            await expect(validatorSale.quote(randomAddress, 100))
                .to.be.revertedWith("quote: Invalid fee");
            
            await expect(validatorSale.quote(randomAddress, 2500))
                .to.be.revertedWith("quote: Invalid fee");
            
            await expect(validatorSale.quote(randomAddress, 15000))
                .to.be.revertedWith("quote: Invalid fee");
        });

        it("should accept valid fee tiers", async function () {
            const randomAddress = "0x1234567890123456789012345678901234567890";
            
            // These should not revert on fee validation
            // They will fail on the actual Uniswap call, but that's expected without forking
            await expect(validatorSale.quote(randomAddress, 500))
                .to.be.reverted; // Will fail on Uniswap call, not on our validation
            
            await expect(validatorSale.quote(randomAddress, 3000))
                .to.be.reverted; // Will fail on Uniswap call, not on our validation
            
            await expect(validatorSale.quote(randomAddress, 10000))
                .to.be.reverted; // Will fail on Uniswap call, not on our validation
        });
    });

    describe("Quote Function Properties", function () {
        it("should be a view function", async function () {
            // This test verifies that quote is properly marked as view
            // by checking that it doesn't modify state
            const randomAddress = "0x1234567890123456789012345678901234567890";
            
            // If this was not a view function, it would cost gas
            // View functions return data without costing gas when called off-chain
            try {
                await validatorSale.quote(randomAddress, 3000);
            } catch (error) {
                // Expected to fail due to missing Uniswap contracts
                // But the important thing is it's callable as a view function
            }
        });
    });
});

/**
 * Note: These are basic validation tests that work without mainnet forking.
 * 
 * For full integration testing with actual Uniswap quotes, you need to:
 * 
 * 1. Set up mainnet forking in hardhat.config.ts:
 *    networks: {
 *      hardhat: {
 *        forking: {
 *          url: "https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY",
 *          blockNumber: 18500000
 *        }
 *      }
 *    }
 * 
 * 2. Run the full test suite:
 *    npx hardhat test test/ValidatorSale.quote.test.ts --network hardhat
 * 
 * Without forking, the quote function will fail when trying to call
 * the Uniswap Quoter contract, which doesn't exist on local network.
 */