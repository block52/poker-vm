// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IValidator } from "./Vault.sol";
import { IOracle } from "./Oracle.sol";

contract Bridge {
    address public immutable underlying;
    address public immutable vault;
    address private immutable oracle;
    address private immutable _self;
    uint256 public immutable lockTime;

    mapping(address => uint256) public lockTimes;
    mapping(address => uint256) public balances;
    mapping(bytes32 => bool) private usedNonces;

    constructor(address _underlying, address _vault, address _oracle, uint256 _lockTime) {
        underlying = _underlying;
        vault = _vault;
        oracle = _oracle;
        _self = address(this);
        lockTime = _lockTime;
    }

    function deposit(uint256 amount) external {
        IERC20 token = IERC20(underlying);

        lockTimes[msg.sender] += block.timestamp + lockTime;
        token.transferFrom(msg.sender, _self, amount);
        
        // Get exchange rate from oracle
        uint256 rate = IOracle(oracle).getRate(amount);
        balances[msg.sender] += rate;

        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount, address to, bytes32 nonce, bytes calldata signature) external {
        require(!usedNonces[nonce], "Bridge: nonce already used");
        require(lockTimes[to] >= block.timestamp, "Bridge: funds are locked");
        require(IERC20(underlying).balanceOf(to) >= amount, "Bridge: insufficient balance");

        bytes32 messageHash = keccak256(abi.encodePacked(to, amount, nonce));
        address signer = recoverSignerAddress(messageHash, signature);

        require(IValidator(vault).isValidator(signer), "Bridge: invalid signature");

        usedNonces[nonce] = true;
        balances[to] -= amount;
        IERC20 token = IERC20(underlying);
        token.transfer(to, amount);

        emit Withdrawn(to, amount, nonce);
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

    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount, bytes32 nonce);
}