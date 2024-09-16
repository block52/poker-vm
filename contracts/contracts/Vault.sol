// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { IValidator } from "./IValidator.sol";

contract Vault is IValidator {
    using ECDSA for bytes32;

    mapping(address => uint256) public balances;
    mapping(address => uint256) public lockTimes;

    address public immutable underlying;
    uint256 public immutable lockTime;
    uint256 public minValidatorStake;

    function name () external view returns (string memory) {
        // string memory _name = "Vault";
        return IERC20Metadata(underlying).name();
    }

    function isValidator(address account) external view returns (bool) {
        return _isValidator(account);
    }

    function _isValidator(address account) private view returns (bool) {
        if (account == address(0)) {
            return false;
        }

        return balances[account] > minValidatorStake;
    }

    constructor(address _underlying, uint256 _lockTime, uint256 _minValidatorStake) {
        underlying = _underlying;
        lockTime = _lockTime;
        minValidatorStake = _minValidatorStake;
    }

    function stake(uint256 amount) external {
        IERC20 token = IERC20(underlying);
        token.transferFrom(msg.sender, address(this), amount);

        lockTimes[msg.sender] = block.timestamp + lockTime;
        balances[msg.sender] += amount;

        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Vault: insufficient balance");
        require(block.timestamp >= lockTimes[msg.sender], "Vault: funds are locked");
        
        balances[msg.sender] -= amount;

        IERC20 token = IERC20(underlying);
        token.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function slash(address account, bytes32 proof) external {
        // address signer = ECDSA.recover(account, proof);
        // require(_isValidator(signer), "Bridge: invalid signature");

        // uint256 amount = balances[account];
        balances[account] = 0;
    }

    // function _verify(bytes32 data, address account) pure returns (bool) {
    //     return keccack256(data)
    //         .toEthSignedMessageHash()
    //         .recover(signature) == account;
    // }

    event Staked(address indexed user, uint amount);
    event Withdrawn(address indexed user, uint amount);
}
