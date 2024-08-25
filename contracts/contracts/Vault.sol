// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { I4626 } from "./I4626.sol";

contract Vault {
    mapping(address => uint) public balances;
    mapping(address => uint) public lockTimes;

    address public immutable underlying;
    uint256 public immutable lockTime;
    uint256 public minValidatorStake;

    function isValidator(address account) external view returns (bool) {
        return balances[account] > minValidatorStake;
    }

    constructor(address _underlying, uint256 _lockTime, uint256 _minValidatorStake) {
        underlying = _underlying;
        lockTime = _lockTime;
        minValidatorStake = _minValidatorStake;
    }

    function stake(uint amount) external {
        IERC20 token = IERC20(underlying);
        token.transferFrom(msg.sender, address(this), amount);

        lockTimes[msg.sender] = block.timestamp + lockTime;
        balances[msg.sender] += amount;

        emit Staked(msg.sender, amount);
    }

    function withdraw(uint amount) external {
        require(balances[msg.sender] >= amount, "Vault: insufficient balance");
        require(block.timestamp >= lockTimes[msg.sender], "Vault: funds are locked");
        
        balances[msg.sender] -= amount;

        IERC20 token = IERC20(underlying);
        token.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function slash(address account, bytes proof) external {
        uint amount = balances[account];
        balances[account] = 0;

        IERC20 token = IERC20(underlying);
        token.transfer(I4626(underlying).validator(), amount);
    }

    event Staked(address indexed user, uint amount);
    event Withdrawn(address indexed user, uint amount);
}
