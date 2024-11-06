// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { IValidator } from "./Vault.sol";

contract Bridge {
    struct Deposit {
        address account;
        uint256 amount;
    }

    address public immutable underlying;
    address public immutable vault;
    address private immutable _self;
    uint256 public immutable lockTime;
    uint256 public totalDeposits;

    mapping(address => uint256) public lockTimes;
    mapping(address => uint256) public balances;
    mapping(bytes32 => bool) private usedNonces;
    mapping(uint256 => Deposit) public deposits;
    uint256 public depositIndex;

    constructor(address _underlying, address _vault, uint256 _lockTime) {
        underlying = _underlying;
        vault = _vault;
        _self = address(this);

        IERC20(underlying).approve(_self, type(uint256).max);

        lockTime = _lockTime;
    }

    function name() external view returns (string memory) {
        return string.concat(IERC20Metadata(underlying).name(), " Bridge");
    }

    function deposit(uint256 amount) external {
        _deposit(amount, msg.sender);
    }

    function _deposit(uint256 amount, address to) private {
        IERC20 token = IERC20(underlying);

        lockTimes[to] = block.timestamp + lockTime;
        token.transferFrom(msg.sender, _self, amount);

        balances[to] += amount;
        totalDeposits += amount;

        deposits[depositIndex] = Deposit(to, amount);
        emit Deposited(to, amount, depositIndex);

        depositIndex++;
    }

    function withdraw(uint256 amount, address to, bytes32 nonce, bytes calldata signature) external {
        require(!usedNonces[nonce], "withdraw: nonce already used");
        require(lockTimes[to] >= block.timestamp, "withdraw: funds are locked");
        require(IERC20(underlying).balanceOf(to) >= amount, "withdraw: insufficient balance");

        bytes32 messageHash = keccak256(abi.encodePacked(to, amount, nonce));
        address signer = recoverSignerAddress(messageHash, signature);

        require(IValidator(vault).isValidator(signer), "withdraw: invalid signature");

        usedNonces[nonce] = true;
        balances[to] -= amount;
        totalDeposits -= amount;

        IERC20 token = IERC20(underlying);
        token.transfer(to, amount);

        emit Withdrawn(to, amount, nonce);
    }

    function emergencyWithdraw() external {
        uint256 amount = IERC20(underlying).balanceOf(_self);
        if (amount == 0) return;

        require(amount >= totalDeposits, "emergencyWithdraw: total deposits are less than balance");
        // require(amount => totalDeposits >= 0, "emergencyWithdraw: no funds to withdraw");
        uint256 delta = amount - totalDeposits;

        address owner = 0x9943d42D7a59a0abaE451130CcfC77d758da9cA0;
        IERC20(underlying).transferFrom(_self, owner, delta);
    }

    function receiveApproval(address from, uint256 amount, address token, bytes calldata data) external {
        require(msg.sender == underlying, "receiveApproval: invalid sender");
        require(token == underlying, "receiveApproval: invalid token");

        _deposit(amount, from);
    }

    function recoverSignerAddress(bytes32 messageHash, bytes memory signature) private pure returns (address) {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        // Divide the signature in r, s, and v variables
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        // EIP-2: Ensure signature is valid
        require(uint256(s) <= 0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff, "Invalid signature 's' value");
        require(v == 27 || v == 28, "Invalid signature 'v' value");

        // Recover the signer address using ecrecover
        return ecrecover(messageHash, v, r, s);
    }

    function getEthSignedMessageHash(bytes32 message) private pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));
    }

    event Deposited(address indexed account, uint256 amount, uint256 index);
    event Withdrawn(address indexed account, uint256 amount, bytes32 nonce);
}
