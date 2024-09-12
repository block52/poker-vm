// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface IOracle {
    function getRate(uint256 amount) external view returns (uint256);
    function precision() external view returns (uint256);
}