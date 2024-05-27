// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Vault {
    mapping(address => uint) public balances;
    mapping(address => bool) public validators;

    address public immutable underlying;

    constructor(address _underlying) {
        underlying = _underlying;
    }

    function stake(uint amount) public {
        IERC20 token = IERC20(underlying);
        token.transferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
    }

    event Staked(address indexed user, uint amount);
}
