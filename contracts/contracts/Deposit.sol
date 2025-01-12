// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Bridge } from "./Bridge.sol";

contract Deposit is Ownable {
    address public immutable bridge;

    mapping(bytes32 => bool) private usedNonces;

    constructor(address underlying, address bridge_) Ownable(msg.sender) {
        IERC20(underlying).approve(bridge_, type(uint256).max);
    }

    function deposit(uint256 amount, address receiver, address token, bytes32 txid) external onlyOwner returns(uint256) {
        require(!usedNonces[txid], "Deposit: txid already used");
        Bridge _bridge = Bridge(bridge);
        
        uint256 _amount = _bridge.deposit(amount, receiver, token);
        return _amount;
    }
}
