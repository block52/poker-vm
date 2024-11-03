import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Bridge", () => {
    const fixture = async () => {
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await hre.ethers.getSigners();

        const Token = await hre.ethers.getContractFactory("MockToken");
        const token = await Token.deploy("MockToken", "MTK");
        const tokenAddress = await token.getAddress();

        const Vault = await hre.ethers.getContractFactory("Vault");
        const vault = await Vault.deploy(tokenAddress, 1, ethers.parseEther("10"));
        const vaultAddress = await vault.getAddress();

        const Bridge = await hre.ethers.getContractFactory("Bridge");
        const bridge = await Bridge.deploy(tokenAddress, vaultAddress, 1);

        return { bridge, token, owner, otherAccount };
    };

    describe("Deployment", async () => {
        const { bridge, token, owner } = await loadFixture(fixture);

        it("Should deploy bridge", async function () {
            const name = await bridge.name();
            expect(name).to.equal("MockToken Bridge");
        });

        it("Should set the correct underlying token address", async function () {
            expect(await bridge.underlying()).to.equal(await token.getAddress());
        });

        it("Should set the correct vault address", async function () {
            expect(await bridge.vault()).to.equal(owner.address);
        });
    });

    describe("Deposit", async () => {
        const { bridge, token, owner, otherAccount } = await loadFixture(fixture);

        it("Should allow users to deposit tokens", async () => {
            await bridge.connect(otherAccount).deposit(ethers.parseEther("10"));

            expect(await bridge.balances(otherAccount.address)).to.equal(ethers.parseEther("10"));
            expect(await bridge.totalDeposits()).to.equal(ethers.parseEther("10"));
        });

        it("Should emit Deposited event", async () => {
            await expect(bridge.connect(otherAccount).deposit(ethers.parseEther("10")))
                .to.emit(bridge, "Deposited")
                .withArgs(otherAccount.address, ethers.parseEther("10"));
        });
    });
});

// const { expect } = require("chai");
// const { ethers } = require("hardhat");

// describe("Bridge Contract", function () {
//     let Bridge, bridge, owner, addr1, addr2;
//     let Token, token;
//     const lockTime = 3600; // 1 hour

//     beforeEach(async function () {
//         [owner, addr1, addr2] = await ethers.getSigners();

//         // Deploy a mock ERC20 token
//         Token = await ethers.getContractFactory("MockToken");
//         token = await Token.deploy("Mock Token", "MTK", 18, ethers.parseEther("1000"));
//         await token.deployed();

//         // Deploy the Bridge contract
//         Bridge = await ethers.getContractFactory("Bridge");
//         bridge = await Bridge.deploy(token.address, owner.address, lockTime);
//         await bridge.deployed();

//         // Allocate tokens to addr1 and approve Bridge contract
//         await token.transfer(addr1.address, ethers.parseEther("100"));
//         await token.connect(addr1).approve(bridge.address, ethers.parseEther("100"));
//     });

//     describe("Deployment", function () {
//         it("Should set the correct underlying token address", async function () {
//             expect(await bridge.underlying()).to.equal(token.address);
//         });

//         it("Should set the correct vault address", async function () {
//             expect(await bridge.vault()).to.equal(owner.address);
//         });

//         it("Should set the correct lock time", async function () {
//             expect(await bridge.lockTime()).to.equal(lockTime);
//         });
//     });

//     describe("Deposit", function () {
//         it("Should allow users to deposit tokens", async function () {
//             await bridge.connect(addr1).deposit(ethers.utils.parseEther("10"));

//             expect(await bridge.balances(addr1.address)).to.equal(ethers.utils.parseEther("10"));
//             expect(await bridge.totalDeposits()).to.equal(ethers.utils.parseEther("10"));
//         });

//         it("Should emit Deposited event", async function () {
//             await expect(bridge.connect(addr1).deposit(ethers.utils.parseEther("10")))
//                 .to.emit(bridge, "Deposited")
//                 .withArgs(addr1.address, ethers.utils.parseEther("10"));
//         });
//     });

//     describe("Withdraw", function () {
//         it("Should allow users to withdraw tokens after lock time has passed", async function () {
//             // Deposit tokens
//             await bridge.connect(addr1).deposit(ethers.utils.parseEther("10"));

//             // Move forward in time to surpass lockTime
//             await ethers.provider.send("evm_increaseTime", [lockTime + 1]);
//             await ethers.provider.send("evm_mine");

//             // Mock a valid signature and nonce
//             const nonce = ethers.utils.formatBytes32String("unique_nonce");
//             const messageHash = ethers.utils.solidityKeccak256(["address", "uint256", "bytes32"], [addr1.address, ethers.utils.parseEther("10"), nonce]);
//             const signature = await owner.signMessage(ethers.utils.arrayify(messageHash));

//             // Withdraw tokens
//             await bridge.connect(addr1).withdraw(ethers.utils.parseEther("10"), addr1.address, nonce, signature);

//             expect(await bridge.balances(addr1.address)).to.equal(0);
//             expect(await bridge.totalDeposits()).to.equal(0);
//         });

//         it("Should emit Withdrawn event", async function () {
//             // Deposit tokens
//             await bridge.connect(addr1).deposit(ethers.utils.parseEther("10"));

//             // Move forward in time to surpass lockTime
//             await ethers.provider.send("evm_increaseTime", [lockTime + 1]);
//             await ethers.provider.send("evm_mine");

//             // Mock a valid signature and nonce
//             const nonce = ethers.utils.formatBytes32String("unique_nonce");
//             const messageHash = ethers.utils.solidityKeccak256(["address", "uint256", "bytes32"], [addr1.address, ethers.utils.parseEther("10"), nonce]);
//             const signature = await owner.signMessage(ethers.utils.arrayify(messageHash));

//             // Expect the event
//             await expect(bridge.connect(addr1).withdraw(ethers.utils.parseEther("10"), addr1.address, nonce, signature))
//                 .to.emit(bridge, "Withdrawn")
//                 .withArgs(addr1.address, ethers.utils.parseEther("10"), nonce);
//         });

//         it("Should not allow withdrawal before lock time", async function () {
//             await bridge.connect(addr1).deposit(ethers.utils.parseEther("10"));

//             const nonce = ethers.utils.formatBytes32String("unique_nonce");
//             const messageHash = ethers.utils.solidityKeccak256(["address", "uint256", "bytes32"], [addr1.address, ethers.utils.parseEther("10"), nonce]);
//             const signature = await owner.signMessage(ethers.utils.arrayify(messageHash));

//             await expect(bridge.connect(addr1).withdraw(ethers.utils.parseEther("10"), addr1.address, nonce, signature)).to.be.revertedWith(
//                 "withdraw: funds are locked"
//             );
//         });
//     });

//     describe("Emergency Withdraw", function () {
//         it("Should allow the owner to withdraw in an emergency", async function () {
//             await bridge.connect(addr1).deposit(ethers.utils.parseEther("10"));

//             await bridge.connect(owner).emergencyWithdraw();

//             const ownerBalance = await token.balanceOf(owner.address);
//             expect(ownerBalance).to.equal(ethers.utils.parseEther("910")); // Initial 1000 - 100 to addr1 + 10 from emergencyWithdraw
//         });

//         it("Should revert if there are no funds to withdraw", async function () {
//             await expect(bridge.connect(owner).emergencyWithdraw()).to.be.revertedWith("emergencyWithdraw: no funds to withdraw");
//         });
//     });
// });
