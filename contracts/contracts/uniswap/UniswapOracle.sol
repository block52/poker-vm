// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IOracle } from "./IOracle.sol";

contract UniswapOracle implements IOracle {
    address public immutable token0;
    address public immutable token1;
    uint256 public immutable precision;

    constructor(address _token0, address _token1, uint256 _precision) {
        token0 = _token0;
        token1 = _token1;
        precision = _precision;
    }

    function getRate(uint256 amount) external view returns (uint256) {
        return amount;
    }
}