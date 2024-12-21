// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { ISwapRouter } from "../Uniswap/Interfaces.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockUniswapRouter {
    function exactInputSingle(ISwapRouter.ExactInputSingleParams calldata params) external returns (uint256) {
        // Mock the swap by transferring input token and returning a fixed rate
        IERC20(params.tokenIn).transferFrom(msg.sender, address(this), params.amountIn);
        
        // Mock conversion rate: 1 ETH = 2000 USDC
        return params.amountIn * 2000;
    }
}