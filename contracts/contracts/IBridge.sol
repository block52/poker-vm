// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface IBridge {
    function deposit(uint256 amount, address receiver, address token) external returns(uint256);
    function depositUnderlying(uint256 amount, address receiver) external returns(uint256);
    function underlying() external view returns (address);
}