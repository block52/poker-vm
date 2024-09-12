// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface IOracle {
    function getRate() external view returns (uint256);
}