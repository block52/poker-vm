// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import { ISwapRouter } from "../Uniswap/Interfaces.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockUniswapRouter {
    function exactInputSingle(ISwapRouter.ExactInputSingleParams calldata params) external returns (uint256) {
        // Transfer input token from sender
        require(
            IERC20(params.tokenIn).transferFrom(msg.sender, address(this), params.amountIn),
            "Transfer failed"
        );
        
        // Mock conversion rate: 1 ETH = 2000 USDC (considering 6 decimals for USDC)
        uint256 amountOut = (params.amountIn * 2000 * 1e6) / 1e18;
        
        // Mock the output token transfer
        // In production, we'd transfer the actual swapped tokens
        // Here we're just simulating the output amount
        
        return amountOut;
    }
}