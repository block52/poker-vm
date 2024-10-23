// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./IOracle.sol";

contract Oracle is IOracle {

    address private immutable _underlying;

    function name() external view returns (string memory) {
        return IERC20Metadata(_underlying).name();
    }

    function precision() external pure returns (uint256) {
        return 100;
    }

    constructor(address underlying) {
        _underlying = underlying;
    }

    function getRate(uint256 amount) external pure returns (uint256) {
        return amount * 1 * 100;
    }
}