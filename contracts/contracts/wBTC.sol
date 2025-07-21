// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IBridge } from "./IBridge.sol"; // Assuming you have an IBridge interface defined

contract WBTC is Ownable {
    IERC20 public immutable token;
    IBridge public bridge;  // Remove immutable to allow bridge updates

    constructor(address _bridge) Ownable(msg.sender) {
        token = IERC20(0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599); // WBTC token address
        require(_bridge != address(0), "Invalid bridge address");
        bridge = IBridge(_bridge);
    }

    function deposit(uint256 amount, address receiver) external onlyOwner {
        require(token.balanceOf(address(this)) >= amount, "Insufficient balance");
        require(receiver != address(0), "Invalid receiver address");

        // Approve the bridge to spend our tokens
        token.approve(address(bridge), amount);
        bridge.deposit(amount, receiver, address(token));
    }
}