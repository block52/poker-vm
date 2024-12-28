import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Bridge", () => {
    // USDC and Uniswap router addresses on mainnet
    const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const UNISWAP_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    
    const fixture = async () => {
        const [owner, otherAccount, validator] = await hre.ethers.getSigners();

        // Get USDC interface
        const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
        
        // Deploy mock WETH for testing
        const MockToken = await hre.ethers.getContractFactory("MockToken");
        const weth = await MockToken.deploy("Wrapped Ether", "WETH");
        
        // Deploy mock Uniswap router
        const MockRouter = await hre.ethers.getContractFactory("MockUniswapRouter");
        const router = await MockRouter.deploy();

        // Deploy vault with validator
        const Vault = await hre.ethers.getContractFactory("Vault");
        const vault = await Vault.deploy(USDC_ADDRESS, 1, ethers.parseUnits("1", 6));

        // Deploy bridge
        const Bridge = await hre.ethers.getContractFactory("Bridge");
        const bridge = await Bridge.deploy(USDC_ADDRESS, await vault.getAddress(), await router.getAddress());

        // Setup initial balances using whale account
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503"], // Binance account with USDC
        });
        const whale = await ethers.getSigner("0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503");
        
        // Send some ETH to whale for gas
        await owner.sendTransaction({
            to: whale.address,
            value: ethers.parseEther("1"),
        });

        // Transfer USDC to test accounts
        const amount = ethers.parseUnits("1000", 6); // USDC has 6 decimals
        await usdc.connect(whale).transfer(otherAccount.address, amount);
        await usdc.connect(whale).transfer(validator.address, amount);
        
        // Approve bridge for USDC
        await usdc.connect(otherAccount).approve(await bridge.getAddress(), amount);
        await usdc.connect(validator).approve(await vault.getAddress(), amount);

        return { bridge, usdc, weth, router, vault, owner, otherAccount, validator };
    };

    describe("Deployment", () => {
        it("Should deploy with correct parameters", async () => {
            const { bridge, usdc, router, vault } = await loadFixture(fixture);
            
            expect(await bridge.underlying()).to.equal(USDC_ADDRESS);
            expect(await bridge.router()).to.equal(await router.getAddress());
            expect(await bridge.vault()).to.equal(await vault.getAddress());
            
            expect(await bridge.name()).to.equal("USD Coin Bridge");
            expect(await bridge.symbol()).to.equal("USDCb");
            expect(await bridge.decimals()).to.equal(6);
        });
    });

    describe.only("Direct USDC Deposits", () => {
        it("Should allow direct USDC deposits", async () => {
            const { bridge, otherAccount } = await loadFixture(fixture);
            const amount = ethers.parseUnits("100", 6);
            
            await expect(bridge.connect(otherAccount).depositUnderlying(amount))
                .to.emit(bridge, "Deposited")
                .withArgs(otherAccount.address, amount, 1);
            
            const deposit = await bridge.deposits(0);
            expect(deposit.account).to.equal(otherAccount.address);
            expect(deposit.amount).to.equal(amount);
            expect(await bridge.totalDeposits()).to.equal(amount);
        });
    });

    describe("Token Swap Deposits", () => {
        it("Should handle deposits with token swaps", async () => {
            const { bridge, weth, router, otherAccount } = await loadFixture(fixture);
            const bridgeAddress = await bridge.getAddress();
            const routerAddress = await router.getAddress();
            const depositAmount = ethers.parseEther("1"); // 1 WETH
            const expectedUsdc = ethers.parseUnits("2000", 6); // Mocked swap rate: 1 ETH = 2000 USDC
            
            // Mint WETH to the test account
            await weth.mint(otherAccount.address, depositAmount);
            
            // Approve WETH for both Bridge and Router
            await weth.connect(otherAccount).approve(bridgeAddress, depositAmount);
            await weth.connect(otherAccount).approve(routerAddress, depositAmount);
            
            await expect(bridge.connect(otherAccount).deposit(depositAmount, otherAccount.address, await weth.getAddress()))
                .to.emit(bridge, "Deposited")
                .withArgs(otherAccount.address, expectedUsdc, 1);
            
            const deposit = await bridge.deposits(0);
            expect(deposit.account).to.equal(otherAccount.address);
            expect(deposit.amount).to.equal(expectedUsdc);
            expect(await bridge.totalDeposits()).to.equal(expectedUsdc);
        });

        // it("Should handle deposits with zero router address", async () => {
        //     // Deploy bridge with zero router address
        //     const Bridge = await hre.ethers.getContractFactory("Bridge");
        //     const newBridge = await Bridge.deploy(
        //         USDC_ADDRESS, 
        //         await vault.getAddress(), 
        //         ethers.ZeroAddress
        //     );
            
        //     const depositAmount = ethers.parseUnits("100", 6); // 100 USDC
            
        //     // Approve and deposit USDC directly
        //     await usdc.connect(otherAccount).approve(await newBridge.getAddress(), depositAmount);
            
        //     await expect(newBridge.connect(otherAccount).deposit(depositAmount, otherAccount.address, USDC_ADDRESS))
        //         .to.emit(newBridge, "Deposited")
        //         .withArgs(otherAccount.address, depositAmount, 1);
            
        //     const deposit = await newBridge.deposits(0);
        //     expect(deposit.account).to.equal(otherAccount.address);
        //     expect(deposit.amount).to.equal(depositAmount);
        //     expect(await newBridge.totalDeposits()).to.equal(depositAmount);
        // });
    });

    describe("Withdrawals", () => {
        it("Should allow withdrawals with valid signature", async () => {
            const { bridge, usdc, otherAccount, validator, vault } = await loadFixture(fixture);
            const amount = ethers.parseUnits("100", 6);
            
            // Setup validator
            await vault.connect(validator).stake(amount);
            expect(await vault.balanceOf(validator.address)).to.equal(amount);
            expect(await vault.isValidator(validator.address)).to.be.true;

            // First deposit
            await bridge.connect(otherAccount).depositUnderlying(amount);
            
            // Create withdrawal signature
            const nonce = ethers.id("unique_nonce");
            const messageHash = ethers.solidityPackedKeccak256(
                ["address", "uint256", "bytes32"],
                [otherAccount.address, amount, nonce]
            );
            const signature = await validator.signMessage(ethers.getBytes(messageHash));
            
            // Withdraw
            await expect(bridge.connect(otherAccount).withdraw(amount, otherAccount.address, nonce, signature))
                .to.emit(bridge, "Withdrawn")
                .withArgs(otherAccount.address, amount, nonce);
            
            expect(await bridge.totalDeposits()).to.equal(0);
            expect(await usdc.balanceOf(otherAccount.address)).to.be.approximately(ethers.parseUnits("1000", 6), 100000n);
        });

        it("Should prevent reuse of nonce", async () => {
            const { bridge, otherAccount, validator, vault } = await loadFixture(fixture);
            const amount = ethers.parseUnits("100", 6);

            // Setup validator
            await vault.connect(validator).stake(amount);
            expect(await vault.balanceOf(validator.address)).to.equal(amount);
            expect(await vault.isValidator(validator.address)).to.be.true;
            
            await bridge.connect(otherAccount).depositUnderlying(amount);
            
            const nonce = ethers.id("unique_nonce");
            const messageHash = ethers.solidityPackedKeccak256(
                ["address", "uint256", "bytes32"],
                [otherAccount.address, amount, nonce]
            );
            const signature = await validator.signMessage(ethers.getBytes(messageHash));
            
            await bridge.connect(otherAccount).withdraw(amount, otherAccount.address, nonce, signature);
            
            await expect(
                bridge.connect(otherAccount).withdraw(amount, otherAccount.address, nonce, signature)
            ).to.be.revertedWith("withdraw: nonce already used");
        });
    });

    describe("Emergency Withdrawal", () => {
        it("Should allow emergency withdrawal of excess funds", async () => {
            const { bridge, usdc, otherAccount } = await loadFixture(fixture);
            const depositAmount = ethers.parseUnits("100", 6);
            const extraAmount = ethers.parseUnits("50", 6);
            
            // Regular deposit
            await bridge.connect(otherAccount).depositUnderlying(depositAmount);
            
            // Send extra USDC directly to bridge
            await usdc.connect(otherAccount).transfer(await bridge.getAddress(), extraAmount);
            
            // Emergency withdraw should only take excess
            await bridge.emergencyWithdraw();
            
            const bridgeBalance = await usdc.balanceOf(await bridge.getAddress());
            expect(bridgeBalance).to.equal(depositAmount);
            expect(await bridge.totalDeposits()).to.equal(depositAmount);
        });
    });
});