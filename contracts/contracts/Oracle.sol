// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IOracle.sol";

contract Oracle is IOracle {

    address private immutable _underlying;

    function name() external pure returns (string memory) {
        return IERC20(_underlying).name();
    }

    function precision() external pure returns (uint256) {
        return 100;
    }

    constructor(address underlying) {
        _underlying = underlying;
    }

    function getRate(uint256 amount) external view returns (uint256) {
        return amount * 1 * 100;
    }
}