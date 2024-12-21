import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe.skip("Bridge", () => {
    const fixture = async () => {
        const [owner, otherAccount, validator] = await hre.ethers.getSigners();

        // Deploy mock token
        const Token = await hre.ethers.getContractFactory("MockToken");
        const token = await Token.deploy("MockToken", "MTK");
        const tokenAddress = await token.getAddress();

        // Deploy vault with validator
        const Vault = await hre.ethers.getContractFactory("Vault");
        const vault = await Vault.deploy(tokenAddress, 1, ethers.parseEther("10"));
        const vaultAddress = await vault.getAddress();
        
        // Set validator in vault
        await vault.addValidator(validator.address);

        // Deploy bridge
        const Bridge = await hre.ethers.getContractFactory("Bridge");
        const bridge = await Bridge.deploy(tokenAddress, vaultAddress);
        const bridgeAddress = await bridge.getAddress();

        // Setup initial token balances
        await token.transfer(otherAccount.address, ethers.parseEther("100"));
        await token.connect(otherAccount).approve(bridgeAddress, ethers.parseEther("100"));

        return { bridge, token, vault, owner, otherAccount, validator };
    };

    describe("Deployment", () => {
        it("Should deploy bridge with correct parameters", async () => {
            const { bridge, token, vault } = await loadFixture(fixture);
            
            const name = await bridge.name();
            expect(name).to.equal("MockToken Bridge");
            
            const symbol = await bridge.symbol();
            expect(symbol).to.equal("MTKb");
            
            const decimals = await bridge.decimals();
            expect(decimals).to.equal(18);
            
            expect(await bridge.underlying()).to.equal(await token.getAddress());
            expect(await bridge.vault()).to.equal(await vault.getAddress());
        });
    });

    describe("Deposit", () => {
        it("Should allow users to deposit tokens", async () => {
            const { bridge, token, otherAccount } = await loadFixture(fixture);
            const bridgeAddress = await bridge.getAddress();
            
            const depositAmount = ethers.parseEther("10");
            const initialBridgeBalance = await token.balanceOf(bridgeAddress);
            
            await expect(bridge.connect(otherAccount).deposit(depositAmount))
                .to.emit(bridge, "Deposited")
                .withArgs(otherAccount.address, depositAmount, 0);  // 0 is the first deposit index
            
            expect(await token.balanceOf(bridgeAddress)).to.equal(initialBridgeBalance + depositAmount);
            expect(await bridge.totalDeposits()).to.equal(depositAmount);
            
            const deposit = await bridge.deposits(0);
            expect(deposit.account).to.equal(otherAccount.address);
            expect(deposit.amount).to.equal(depositAmount);
        });

        it("Should increment deposit index", async () => {
            const { bridge, otherAccount } = await loadFixture(fixture);
            
            await bridge.connect(otherAccount).deposit(ethers.parseEther("5"));
            expect(await bridge.depositIndex()).to.equal(1);
            
            await bridge.connect(otherAccount).deposit(ethers.parseEther("5"));
            expect(await bridge.depositIndex()).to.equal(2);
        });
    });

    describe("Withdraw", () => {
        it("Should allow withdrawals with valid signature", async () => {
            const { bridge, token, otherAccount, validator } = await loadFixture(fixture);
            const bridgeAddress = await bridge.getAddress();
            
            // First deposit
            const amount = ethers.parseEther("10");
            await bridge.connect(otherAccount).deposit(amount);
            
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
                
            expect(await token.balanceOf(bridgeAddress)).to.equal(0);
            expect(await bridge.totalDeposits()).to.equal(0);
        });

        it("Should prevent reuse of nonce", async () => {
            const { bridge, otherAccount, validator } = await loadFixture(fixture);
            
            const amount = ethers.parseEther("10");
            await bridge.connect(otherAccount).deposit(amount);
            
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

        it("Should prevent withdrawals with invalid signature", async () => {
            const { bridge, otherAccount } = await loadFixture(fixture);
            
            const amount = ethers.parseEther("10");
            await bridge.connect(otherAccount).deposit(amount);
            
            const nonce = ethers.id("unique_nonce");
            const fakeSignature = "0x" + "00".repeat(65);  // Invalid signature
            
            await expect(
                bridge.connect(otherAccount).withdraw(amount, otherAccount.address, nonce, fakeSignature)
            ).to.be.revertedWith("Invalid signature length");
        });

        it("Should prevent withdrawals with non-validator signature", async () => {
            const { bridge, otherAccount, owner } = await loadFixture(fixture);
            
            const amount = ethers.parseEther("10");
            await bridge.connect(otherAccount).deposit(amount);
            
            const nonce = ethers.id("unique_nonce");
            const messageHash = ethers.solidityPackedKeccak256(
                ["address", "uint256", "bytes32"],
                [otherAccount.address, amount, nonce]
            );
            const signature = await owner.signMessage(ethers.getBytes(messageHash));  // Owner is not a validator
            
            await expect(
                bridge.connect(otherAccount).withdraw(amount, otherAccount.address, nonce, signature)
            ).to.be.revertedWith("withdraw: invalid signature");
        });
    });

    describe("Emergency Withdraw", () => {
        it("Should allow emergency withdrawal of excess funds", async () => {
            const { bridge, token, otherAccount } = await loadFixture(fixture);
            const bridgeAddress = await bridge.getAddress();
            
            // Send extra tokens directly to bridge
            const depositAmount = ethers.parseEther("10");
            const extraAmount = ethers.parseEther("5");
            await token.connect(otherAccount).transfer(bridgeAddress, depositAmount + extraAmount);
            
            // Make a deposit to track
            await bridge.connect(otherAccount).deposit(depositAmount);
            
            // Emergency withdraw should only take excess
            await bridge.emergencyWithdraw();
            
            expect(await token.balanceOf(bridgeAddress)).to.equal(depositAmount);
            expect(await bridge.totalDeposits()).to.equal(depositAmount);
        });

        it("Should do nothing if no excess funds", async () => {
            const { bridge, token, otherAccount } = await loadFixture(fixture);
            const bridgeAddress = await bridge.getAddress();
            
            const amount = ethers.parseEther("10");
            await bridge.connect(otherAccount).deposit(amount);
            
            await bridge.emergencyWithdraw();
            
            expect(await token.balanceOf(bridgeAddress)).to.equal(amount);
            expect(await bridge.totalDeposits()).to.equal(amount);
        });
    });
});

// import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
// import { expect } from "chai";
// import hre, { ethers } from "hardhat";

// describe("Bridge", () => {
//     const fixture = async () => {
//         // Contracts are deployed using the first signer/account by default
//         const [owner, otherAccount] = await hre.ethers.getSigners();

//         const Token = await hre.ethers.getContractFactory("MockToken");
//         const token = await Token.deploy("MockToken", "MTK");
//         const tokenAddress = await token.getAddress();

//         const Vault = await hre.ethers.getContractFactory("Vault");
//         const vault = await Vault.deploy(tokenAddress, 1, ethers.parseEther("10"));
//         const vaultAddress = await vault.getAddress();

//         const Bridge = await hre.ethers.getContractFactory("Bridge");
//         const bridge = await Bridge.deploy(tokenAddress, vaultAddress, 1);

//         await token.transfer(otherAccount.address, ethers.parseEther("100"));

//         return { bridge, token, owner, otherAccount };
//     };

//     describe("Deployment", async () => {
//         const { bridge, token, owner } = await loadFixture(fixture);

//         it("Should deploy bridge", async function () {
//             const name = await bridge.name();
//             expect(name).to.equal("MockToken Bridge");
//         });

//         it("Should set the correct underlying token address", async function () {
//             expect(await bridge.underlying()).to.equal(await token.getAddress());
//         });

//         it("Should set the correct vault address", async function () {
//             expect(await bridge.vault()).to.equal(owner.address);
//         });
//     });

//     describe("Deposit", async () => {
//         const { bridge, token, owner, otherAccount } = await loadFixture(fixture);

//         it("Should allow users to deposit tokens", async () => {
//             await bridge.connect(otherAccount).deposit(ethers.parseEther("10"));

//             expect(await bridge.balances(otherAccount.address)).to.equal(ethers.parseEther("10"));
//             expect(await bridge.totalDeposits()).to.equal(ethers.parseEther("10"));
//         });

//         it("Should emit Deposited event", async () => {
//             await expect(bridge.connect(otherAccount).deposit(ethers.parseEther("10")))
//                 .to.emit(bridge, "Deposited")
//                 .withArgs(otherAccount.address, ethers.parseEther("10"));
//         });
//     });

//     describe("Withdraw", () => {
//         const lockTime = 1;

//         it("Should allow users to withdraw tokens after lock time has passed", async () => {
//             const { bridge, token, owner, otherAccount } = await loadFixture(fixture);
//             const bridgeAddress = await bridge.getAddress();

//             // Send tokens to the bridge
//             await token.connect(otherAccount).transfer(bridgeAddress, ethers.parseEther("10"));

//             // Set allowance and deposit tokens
//             await token.connect(otherAccount).approve(bridgeAddress, ethers.parseEther("10"));
//             await bridge.connect(otherAccount).deposit(ethers.parseEther("10"));

//             // Move forward in time to surpass lockTime
//             await ethers.provider.send("evm_increaseTime", [1]);
//             await ethers.provider.send("evm_mine");

//             // Mock a valid signature and nonce
//             const nonce = ethers.ZeroHash;
//             const messageHash = ethers.solidityPackedKeccak256(["address", "uint256", "bytes32"], [otherAccount.address, ethers.parseEther("10"), nonce]);
//             const signature = await owner.signMessage(ethers.getBytes(messageHash));

//             // Withdraw tokens
//             await bridge.connect(otherAccount).withdraw(ethers.parseEther("10"), otherAccount.address, nonce, signature);

//             expect(await bridge.balances(otherAccount.address)).to.equal(0);
//             expect(await bridge.totalDeposits()).to.equal(0);
//         });

//         it("Should emit Withdrawn event", async () => {
//             const { bridge, token, owner, otherAccount } = await loadFixture(fixture);
//             const bridgeAddress = await bridge.getAddress();

//             // Deposit tokens
//             await token.connect(otherAccount).approve(bridgeAddress, ethers.parseEther("10"));
//             await bridge.connect(otherAccount).deposit(ethers.parseEther("10"));

//             // Move forward in time to surpass lockTime
//             await ethers.provider.send("evm_increaseTime", [lockTime + 1]);
//             await ethers.provider.send("evm_mine");

//             // Mock a valid signature and nonce
//             const nonce = ethers.ZeroAddress;
//             // const messageHash = ethers.solidityKeccak256(["address", "uint256", "bytes32"], [otherAccount.address, ethers.parseEther("10"), nonce]);
//             // const signature = await owner.signMessage(ethers.arrayify(messageHash));

//             // // Expect the event
//             // await expect(bridge.connect(addr1).withdraw(ethers.parseEther("10"), otherAccount.address, nonce, signature))
//             //     .to.emit(bridge, "Withdrawn")
//             //     .withArgs(otherAccount.address, ethers.parseEther("10"), nonce);
//         });

//         it.skip("Should not allow withdrawal before lock time", async () => {
//             const { bridge, token, owner, otherAccount } = await loadFixture(fixture);

//             await bridge.connect(otherAccount).deposit(ethers.parseEther("10"));

//             const nonce = ethers.formatBytes32String("unique_nonce");
//             const messageHash = ethers.solidityKeccak256(["address", "uint256", "bytes32"], [otherAccount.address, ethers.parseEther("10"), nonce]);
//             const signature = await owner.signMessage(ethers.arrayify(messageHash));

//             await expect(bridge.connect(otherAccount).withdraw(ethers.parseEther("10"), otherAccount.address, nonce, signature)).to.be.revertedWith(
//                 "withdraw: funds are locked"
//             );
//         });
//     });

//     describe("Emergency Withdraw", () => {
//         it("Should allow the owner to withdraw in an emergency", async () => {
//             const { bridge, token, owner, otherAccount } = await loadFixture(fixture);

//             const bridgeAddress = await bridge.getAddress();
//             await token.connect(otherAccount).transfer(bridgeAddress, ethers.parseEther("10"));

//             let bridgeBalance = await token.balanceOf(bridgeAddress);
//             expect(bridgeBalance).to.equal(ethers.parseEther("10"));

//             await bridge.connect(owner).emergencyWithdraw();

//             bridgeBalance = await token.balanceOf(bridgeAddress);
//             expect(bridgeBalance).to.equal(0);
//         });

//         it("Should allow the owner to withdraw without impacting deposits in an emergency", async () => {
//             const { bridge, token, owner, otherAccount } = await loadFixture(fixture);

//             const bridgeAddress = await bridge.getAddress();
//             await token.connect(otherAccount).transfer(bridgeAddress, ethers.parseEther("10"));

//             let bridgeBalance = await token.balanceOf(bridgeAddress);
//             expect(bridgeBalance).to.equal(ethers.parseEther("10"));

//             // Deposit tokens
//             await token.connect(otherAccount).approve(bridgeAddress, ethers.parseEther("10"));
//             await bridge.connect(otherAccount).deposit(ethers.parseEther("10"));

//             const totalDeposits = await bridge.totalDeposits();
//             expect(totalDeposits).to.equal(ethers.parseEther("10"));

//             const depositIndex = await bridge.depositIndex();
//             expect(depositIndex).to.equal(1);

//             await bridge.connect(owner).emergencyWithdraw();

//             bridgeBalance = await token.balanceOf(bridgeAddress);
//             expect(bridgeBalance).to.equal(ethers.parseEther("10"));
//         });

//         it.skip("Should revert if there are no funds to withdraw", async () => {
//             const { bridge, token, owner, otherAccount } = await loadFixture(fixture);
//             await expect(bridge.connect(owner).emergencyWithdraw()).to.be.revertedWith("emergencyWithdraw: no funds to withdraw");
//         });
//     });
// });

// // describe("Bridge Contract", function () {
// //     let Bridge, bridge, owner, addr1, addr2;
// //     let Token, token;
// //     const lockTime = 3600; // 1 hour

// //     beforeEach(async function () {
// //         [owner, addr1, addr2] = await ethers.getSigners();

// //         // Deploy a mock ERC20 token
// //         Token = await ethers.getContractFactory("MockToken");
// //         token = await Token.deploy("Mock Token", "MTK", 18, ethers.parseEther("1000"));
// //         await token.deployed();

// //         // Deploy the Bridge contract
// //         Bridge = await ethers.getContractFactory("Bridge");
// //         bridge = await Bridge.deploy(token.address, owner.address, lockTime);
// //         await bridge.deployed();

// //         // Allocate tokens to addr1 and approve Bridge contract
// //         await token.transfer(addr1.address, ethers.parseEther("100"));
// //         await token.connect(addr1).approve(bridge.address, ethers.parseEther("100"));
// //     });

// //     describe("Deployment", function () {
// //         it("Should set the correct underlying token address", async function () {
// //             expect(await bridge.underlying()).to.equal(token.address);
// //         });

// //         it("Should set the correct vault address", async function () {
// //             expect(await bridge.vault()).to.equal(owner.address);
// //         });

// //         it("Should set the correct lock time", async function () {
// //             expect(await bridge.lockTime()).to.equal(lockTime);
// //         });
// //     });

// //     describe("Deposit", function () {
// //         it("Should allow users to deposit tokens", async function () {
// //             await bridge.connect(addr1).deposit(ethers.utils.parseEther("10"));

// //             expect(await bridge.balances(addr1.address)).to.equal(ethers.utils.parseEther("10"));
// //             expect(await bridge.totalDeposits()).to.equal(ethers.utils.parseEther("10"));
// //         });

// //         it("Should emit Deposited event", async function () {
// //             await expect(bridge.connect(addr1).deposit(ethers.utils.parseEther("10")))
// //                 .to.emit(bridge, "Deposited")
// //                 .withArgs(addr1.address, ethers.utils.parseEther("10"));
// //         });
// //     });

// //     describe("Withdraw", function () {
// //         it("Should allow users to withdraw tokens after lock time has passed", async function () {
// //             // Deposit tokens
// //             await bridge.connect(addr1).deposit(ethers.utils.parseEther("10"));

// //             // Move forward in time to surpass lockTime
// //             await ethers.provider.send("evm_increaseTime", [lockTime + 1]);
// //             await ethers.provider.send("evm_mine");

// //             // Mock a valid signature and nonce
// //             const nonce = ethers.utils.formatBytes32String("unique_nonce");
// //             const messageHash = ethers.utils.solidityKeccak256(["address", "uint256", "bytes32"], [addr1.address, ethers.utils.parseEther("10"), nonce]);
// //             const signature = await owner.signMessage(ethers.utils.arrayify(messageHash));

// //             // Withdraw tokens
// //             await bridge.connect(addr1).withdraw(ethers.utils.parseEther("10"), addr1.address, nonce, signature);

// //             expect(await bridge.balances(addr1.address)).to.equal(0);
// //             expect(await bridge.totalDeposits()).to.equal(0);
// //         });

// //         it("Should emit Withdrawn event", async function () {
// //             // Deposit tokens
// //             await bridge.connect(addr1).deposit(ethers.utils.parseEther("10"));

// //             // Move forward in time to surpass lockTime
// //             await ethers.provider.send("evm_increaseTime", [lockTime + 1]);
// //             await ethers.provider.send("evm_mine");

// //             // Mock a valid signature and nonce
// //             const nonce = ethers.utils.formatBytes32String("unique_nonce");
// //             const messageHash = ethers.utils.solidityKeccak256(["address", "uint256", "bytes32"], [addr1.address, ethers.utils.parseEther("10"), nonce]);
// //             const signature = await owner.signMessage(ethers.utils.arrayify(messageHash));

// //             // Expect the event
// //             await expect(bridge.connect(addr1).withdraw(ethers.utils.parseEther("10"), addr1.address, nonce, signature))
// //                 .to.emit(bridge, "Withdrawn")
// //                 .withArgs(addr1.address, ethers.utils.parseEther("10"), nonce);
// //         });

// //         it("Should not allow withdrawal before lock time", async function () {
// //             await bridge.connect(addr1).deposit(ethers.utils.parseEther("10"));

// //             const nonce = ethers.utils.formatBytes32String("unique_nonce");
// //             const messageHash = ethers.utils.solidityKeccak256(["address", "uint256", "bytes32"], [addr1.address, ethers.utils.parseEther("10"), nonce]);
// //             const signature = await owner.signMessage(ethers.utils.arrayify(messageHash));

// //             await expect(bridge.connect(addr1).withdraw(ethers.utils.parseEther("10"), addr1.address, nonce, signature)).to.be.revertedWith(
// //                 "withdraw: funds are locked"
// //             );
// //         });
// //     });

// //     describe("Emergency Withdraw", function () {
// //         it("Should allow the owner to withdraw in an emergency", async function () {
// //             await bridge.connect(addr1).deposit(ethers.utils.parseEther("10"));

// //             await bridge.connect(owner).emergencyWithdraw();

// //             const ownerBalance = await token.balanceOf(owner.address);
// //             expect(ownerBalance).to.equal(ethers.utils.parseEther("910")); // Initial 1000 - 100 to addr1 + 10 from emergencyWithdraw
// //         });

// //         it("Should revert if there are no funds to withdraw", async function () {
// //             await expect(bridge.connect(owner).emergencyWithdraw()).to.be.revertedWith("emergencyWithdraw: no funds to withdraw");
// //         });
// //     });
// // });
