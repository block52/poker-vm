import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Vault", () => {
    const fixture = async () => {
        const [owner, staker1, staker2] = await hre.ethers.getSigners();

        // Deploy mock token
        const Token = await hre.ethers.getContractFactory("MockToken");
        const token = await Token.deploy("MockToken", "MTK");
        const tokenAddress = await token.getAddress();

        // Deploy vault
        const lockTimeDays = 7; // 7 days lock time
        const minStake = ethers.parseEther("100"); // 100 tokens minimum stake
        
        const Vault = await hre.ethers.getContractFactory("Vault");
        const vault = await Vault.deploy(tokenAddress, lockTimeDays, minStake); // 100 tokens min stake
        const vaultAddress = await vault.getAddress();

        // Setup initial token balances
        await token.transfer(staker1.address, ethers.parseEther("1000"));
        await token.transfer(staker2.address, ethers.parseEther("1000"));
        
        // Approve vault for tokens
        await token.connect(staker1).approve(vaultAddress, ethers.parseEther("1000"));
        await token.connect(staker2).approve(vaultAddress, ethers.parseEther("1000"));

        return { vault, token, owner, staker1, staker2, lockTimeDays };
    };

    describe("Deployment", () => {
        it("Should deploy with correct parameters", async () => {
            const { vault, token, lockTimeDays } = await loadFixture(fixture);
            
            expect(await vault.underlying()).to.equal(await token.getAddress());
            // expect(await vault.lockTime()).to.equal(lockTimeDays * 24 * 60 * 60); // days to seconds
            expect(await vault.minValidatorStake()).to.equal(ethers.parseEther("100"));
            expect(await vault.validatorCount()).to.equal(0);
        });

        it("Should have correct name", async () => {
            const { vault, token } = await loadFixture(fixture);
            expect(await vault.name()).to.equal(await token.name());
        });
    });

    describe("Staking", () => {
        it("Should allow users to stake tokens", async () => {
            const { vault, token, staker1 } = await loadFixture(fixture);
            const stakeAmount = ethers.parseEther("150"); // More than min stake
            
            await expect(vault.connect(staker1).stake(stakeAmount))
                .to.emit(vault, "Staked")
                .withArgs(staker1.address, stakeAmount);
            
            expect(await vault.balanceOf(staker1.address)).to.equal(stakeAmount);
            expect(await vault.validatorCount()).to.equal(1);
        });

        it("Should update validator count correctly", async () => {
            const { vault, staker1, staker2 } = await loadFixture(fixture);
            
            // First staker stakes enough to become validator
            await vault.connect(staker1).stake(ethers.parseEther("150"));
            expect(await vault.validatorCount()).to.equal(1);
            
            // Second staker stakes enough to become validator
            await vault.connect(staker2).stake(ethers.parseEther("150"));
            expect(await vault.validatorCount()).to.equal(2);
            
            // First staker stakes more (shouldn't change validator count)
            await vault.connect(staker1).stake(ethers.parseEther("50"));
            expect(await vault.validatorCount()).to.equal(2);
        });

        it("Should set correct lock time", async () => {
            const { vault, staker1, lockTimeDays } = await loadFixture(fixture);
            
            const blockTimestamp = await time.latest();
            await vault.connect(staker1).stake(ethers.parseEther("150"));
            
            const expectedLockTime = blockTimestamp + (lockTimeDays * 24 * 60 * 60);
            expect(await vault.lockTimes(staker1.address)).to.be.closeTo(expectedLockTime, 10);
        });
    });

    describe("Withdrawals", () => {
        it("Should prevent withdrawals during lock period", async () => {
            const { vault, staker1 } = await loadFixture(fixture);
            
            await vault.connect(staker1).stake(ethers.parseEther("150"));
            
            await expect(
                vault.connect(staker1).withdraw(ethers.parseEther("150"))
            ).to.be.revertedWith("withdraw: funds are locked");
        });

        it("Should allow withdrawals after lock period", async () => {
            const { vault, token, staker1, lockTimeDays } = await loadFixture(fixture);
            const stakeAmount = ethers.parseEther("150");
            
            await vault.connect(staker1).stake(stakeAmount);
            
            // Move time forward past lock period
            await time.increase(lockTimeDays * 24 * 60 * 60 + 1);
            
            await expect(vault.connect(staker1).withdraw(stakeAmount))
                .to.emit(vault, "Withdrawn")
                .withArgs(staker1.address, stakeAmount);
            
            expect(await vault.balanceOf(staker1.address)).to.equal(0);
            expect(await token.balanceOf(staker1.address)).to.equal(ethers.parseEther("1000")); // Back to original balance
        });

        it("Should update validator count on withdrawal", async () => {
            const { vault, staker1, lockTimeDays } = await loadFixture(fixture);
            
            await vault.connect(staker1).stake(ethers.parseEther("150"));
            expect(await vault.validatorCount()).to.equal(1);
            
            await time.increase(lockTimeDays * 24 * 60 * 60 + 1);
            
            // Partial withdrawal keeping validator status
            await vault.connect(staker1).withdraw(ethers.parseEther("40"));
            expect(await vault.validatorCount()).to.equal(1);
            
            // Withdrawal that removes validator status
            await vault.connect(staker1).withdraw(ethers.parseEther("20"));
            expect(await vault.validatorCount()).to.equal(0);
        });

        it("Should prevent withdrawal of more than balance", async () => {
            const { vault, staker1, lockTimeDays } = await loadFixture(fixture);
            
            await vault.connect(staker1).stake(ethers.parseEther("150"));
            await time.increase(lockTimeDays * 24 * 60 * 60 + 1);
            
            await expect(
                vault.connect(staker1).withdraw(ethers.parseEther("151"))
            ).to.be.revertedWith("withdraw: insufficient balance");
        });
    });

    describe("ERC1363 Receiver", () => {
        it("Should handle receiveApproval correctly", async () => {
            const { vault, token, staker1 } = await loadFixture(fixture);
            const amount = ethers.parseEther("150");
            
            // Simulate ERC1363 receiveApproval
            await expect(
                vault.receiveApproval(staker1.address, amount, await token.getAddress(), "0x")
            ).to.emit(vault, "Staked")
             .withArgs(staker1.address, amount);
            
            expect(await vault.balanceOf(staker1.address)).to.equal(amount);
            expect(await vault.validatorCount()).to.equal(1);
        });

        it("Should reject receiveApproval with wrong token", async () => {
            const { vault, staker1 } = await loadFixture(fixture);
            
            // Deploy another token
            const Token2 = await hre.ethers.getContractFactory("MockToken");
            const token2 = await Token2.deploy("MockToken2", "MTK2");
            
            await expect(
                vault.receiveApproval(staker1.address, ethers.parseEther("150"), await token2.getAddress(), "0x")
            ).to.be.revertedWith("Vault: invalid token");
        });
    });

    describe("Validator Status", () => {
        it("Should correctly identify validators", async () => {
            const { vault, staker1, staker2 } = await loadFixture(fixture);
            
            // Not a validator initially
            expect(await vault.isValidator(staker1.address)).to.be.false;
            
            // Becomes validator after staking enough
            await vault.connect(staker1).stake(ethers.parseEther("150"));
            expect(await vault.isValidator(staker1.address)).to.be.true;
            
            // Another staker with insufficient stake
            await vault.connect(staker2).stake(ethers.parseEther("50"));
            expect(await vault.isValidator(staker2.address)).to.be.false;
        });

        it("Should handle zero address validation check", async () => {
            const { vault } = await loadFixture(fixture);
            expect(await vault.isValidator(ethers.ZeroAddress)).to.be.false;
        });
    });

    describe("Slashing", () => {
        it("Should slash validator balance", async () => {
            const { vault, staker1 } = await loadFixture(fixture);
            
            await vault.connect(staker1).stake(ethers.parseEther("150"));
            expect(await vault.validatorCount()).to.equal(1);
            
            await vault.slash(staker1.address, ethers.ZeroHash); // Using dummy proof since it's commented out in contract
            
            expect(await vault.balanceOf(staker1.address)).to.equal(0);
            expect(await vault.validatorCount()).to.equal(0);
        });

        it("Should handle slashing non-validator", async () => {
            const { vault, staker1 } = await loadFixture(fixture);
            
            await vault.connect(staker1).stake(ethers.parseEther("50")); // Less than min stake
            expect(await vault.validatorCount()).to.equal(0);
            
            await vault.slash(staker1.address, ethers.ZeroHash);
            
            expect(await vault.balanceOf(staker1.address)).to.equal(0);
            expect(await vault.validatorCount()).to.equal(0);
        });
    });
});