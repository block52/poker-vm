// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

interface ISimplifiedBridge {
    function depositUnderlying(uint256 amount, address receiver) external returns(uint256);
}

contract Deposit is Ownable {
    IERC20 public immutable token;
    ISimplifiedBridge public immutable bridge;

    event DepositReceived(address indexed from, uint256 amount);

    constructor(address _token, address _bridge) Ownable(msg.sender) {
        token = IERC20(_token);
        bridge = ISimplifiedBridge(_bridge);
        // Approve bridge to spend our tokens
        token.approve(_bridge, type(uint256).max);
    }

    // This will be called by our backend when it detects a deposit
    function forwardDeposit(address user, uint256 amount) external onlyOwner {
        require(token.balanceOf(address(this)) >= amount, "Insufficient balance");

        // Call depositUnderlying without storing the unused return value
        bridge.depositUnderlying(amount, user);
        
        emit DepositReceived(user, amount);
    }
}