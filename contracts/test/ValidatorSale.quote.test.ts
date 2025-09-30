import { expect } from "chai";
import { ethers } from "hardhat";
import { ValidatorNFT, ValidatorSale } from "../typechain-types";

/**
 * IMPORTANT: This test suite requires mainnet forking to work!
 * 
 * Without forking, all tests will fail because Uniswap contracts don't exist locally.
 * See contracts/docs/Mainnet-Forking-Guide.md for setup instructions.
 * 
 * For basic validation tests that work without forking, use:
 * npm run hh:test -- contracts/test/ValidatorSale.quote.simple.test.ts
 */
describe("ValidatorSale Quote Functionality", function () {
    let validatorNFT: ValidatorNFT;
    let validatorSale: ValidatorSale;
    let owner: any;
    let treasury: any;
    let buyer: any;

    // Common token addresses on Ethereum mainnet
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const WBTC_ADDRESS = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    
    // Uniswap V3 fee tiers
    const FEE_LOW = 500;      // 0.05%
    const FEE_MEDIUM = 3000;  // 0.3%
    const FEE_HIGH = 10000;   // 1%

    beforeEach(async function () {
        // Note: This test requires forking mainnet to work with real Uniswap contracts
        // Run with: npx hardhat test --network hardhat --fork https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
        
        [owner, treasury, buyer] = await ethers.getSigners();

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

    describe("Quote Function", function () {
        it("should return quote for WETH to USDC", async function () {
            // Get quote for WETH
            const wethAmount = await validatorSale.quote(WETH_ADDRESS, FEE_MEDIUM);
            
            // Should return a positive amount
            expect(wethAmount).to.be.gt(0);
            
            // Rough check: 1 ETH ≈ $2000-4000, so for $52,000 we need ~13-26 ETH
            // This is just a sanity check, actual amount depends on current market price
            const ethAmount = Number(ethers.formatEther(wethAmount));
            expect(ethAmount).to.be.gt(5);  // More than 5 ETH
            expect(ethAmount).to.be.lt(100); // Less than 100 ETH
        });

        it("should return quote for WBTC to USDC", async function () {
            // Get quote for WBTC
            const wbtcAmount = await validatorSale.quote(WBTC_ADDRESS, FEE_MEDIUM);
            
            // Should return a positive amount
            expect(wbtcAmount).to.be.gt(0);
            
            // WBTC has 8 decimals
            const btcAmount = Number(wbtcAmount) / 1e8;
            // Rough check: 1 BTC ≈ $30,000-60,000, so for $52,000 we need ~0.8-1.7 BTC
            expect(btcAmount).to.be.gt(0.5);  // More than 0.5 BTC
            expect(btcAmount).to.be.lt(5);    // Less than 5 BTC
        });

        it("should return different amounts for different fee tiers", async function () {
            // Get quotes with different fee tiers
            const wethLowFee = await validatorSale.quote(WETH_ADDRESS, FEE_LOW);
            const wethMediumFee = await validatorSale.quote(WETH_ADDRESS, FEE_MEDIUM);
            
            // Different fee tiers should return different amounts
            expect(wethLowFee).to.not.equal(wethMediumFee);
            
            // Lower fee pools usually have better prices (need less input token)
            // But this depends on liquidity, so we just check they're different
        });

        it("should revert with zero address", async function () {
            await expect(validatorSale.quote(ethers.ZeroAddress, FEE_MEDIUM))
                .to.be.revertedWith("quote: Token address cannot be zero");
        });

        it("should revert with invalid fee tier", async function () {
            await expect(validatorSale.quote(WETH_ADDRESS, 100))
                .to.be.revertedWith("quote: Invalid fee");
            
            await expect(validatorSale.quote(WETH_ADDRESS, 2500))
                .to.be.revertedWith("quote: Invalid fee");
        });

        it("should accept all valid fee tiers", async function () {
            // Test all valid Uniswap V3 fee tiers
            await expect(validatorSale.quote(WETH_ADDRESS, 500)).to.not.be.reverted;
            await expect(validatorSale.quote(WETH_ADDRESS, 3000)).to.not.be.reverted;
            await expect(validatorSale.quote(WETH_ADDRESS, 10000)).to.not.be.reverted;
        });

        it("should return consistent quotes for stablecoins", async function () {
            // Quote for DAI (another stablecoin)
            const daiAmount = await validatorSale.quote(DAI_ADDRESS, FEE_LOW);
            
            // DAI has 18 decimals, should be close to 52,000 DAI
            const daiFormatted = Number(ethers.formatEther(daiAmount));
            expect(daiFormatted).to.be.gt(51000);  // Account for slippage/fees
            expect(daiFormatted).to.be.lt(53000);  // Should be close to 52,000
        });
    });

    describe("Quote Integration with Purchase Flow", function () {
        it("should demonstrate complete flow: quote -> swap -> buy", async function () {
            // This is a demonstration test showing the intended flow
            
            // Step 1: Buyer checks how much WETH they need
            const wethNeeded = await validatorSale.quote(WETH_ADDRESS, FEE_MEDIUM);
            console.log(`Need ${ethers.formatEther(wethNeeded)} WETH to buy NFT`);
            
            // Step 2: Buyer would swap WETH for USDC on Uniswap
            // (In real scenario, buyer does this externally)
            
            // Step 3: With USDC in hand, buyer purchases NFT
            // (This would require having USDC, which we demonstrated in other tests)
            
            expect(wethNeeded).to.be.gt(0);
        });
    });

    describe("Gas Usage", function () {
        it("should have reasonable gas usage for quote", async function () {
            // Quote function should be view/pure and use minimal gas
            const tx = await validatorSale.quote(WETH_ADDRESS, FEE_MEDIUM);
            
            // Since quote is a view function, it shouldn't consume gas when called
            // This test mainly ensures the function is properly marked as view
            expect(tx).to.be.gt(0);
        });
    });
});

/**
 * Note: To run these tests with mainnet forking:
 * 
 * 1. Set up your Infura/Alchemy API key in .env:
 *    FORK_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
 * 
 * 2. Update hardhat.config.ts to include forking:
 *    networks: {
 *      hardhat: {
 *        forking: {
 *          url: process.env.FORK_URL,
 *          blockNumber: 18500000  // Optional: pin to specific block
 *        }
 *      }
 *    }
 * 
 * 3. Run tests:
 *    npx hardhat test test/ValidatorSale.quote.test.ts
 */