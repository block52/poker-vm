// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Vault {
    mapping(address => uint) public balances;

    address public immutable underlying;

    function isValidator(address account) external view returns (bool) {
        return balances[account] > 0;
    }

    constructor(address _underlying) {
        underlying = _underlying;
    }

    function stake(uint amount) external {
        IERC20 token = IERC20(underlying);
        token.transferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;

        emit Staked(msg.sender, amount);
    }

    function withdraw(uint amount) external {
        require(balances[msg.sender] >= amount, "Vault: insufficient balance");
        balances[msg.sender] -= amount;

        IERC20 token = IERC20(underlying);
        token.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    event Staked(address indexed user, uint amount);
    event Withdrawn(address indexed user, uint amount);
}
