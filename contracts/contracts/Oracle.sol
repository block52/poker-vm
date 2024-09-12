// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./IOracle.sol";

contract Oracle is IOracle {

    address private immutable _underlying;

    constructor(address underlying) {
        _underlying = underlying;
    }

    function getRate() external view returns (uint256) {
        return 1;
    }
}