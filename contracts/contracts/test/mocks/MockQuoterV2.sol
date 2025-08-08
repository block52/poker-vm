// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@uniswap/v3-periphery/contracts/interfaces/IQuoterV2.sol";

contract MockQuoterV2 is IQuoterV2 {
    // Mock implementation that returns predictable values for testing
    
    function quoteExactInputSingle(QuoteExactInputSingleParams memory params)
        external
        override
        returns (
            uint256 amountOut,
            uint160 sqrtPriceX96After,
            uint32 initializedTicksCrossed,
            uint256 gasEstimate
        )
    {
        // Simple mock: return params.amountIn as amountOut
        return (params.amountIn, 0, 0, 50000);
    }

    function quoteExactOutputSingle(QuoteExactOutputSingleParams memory params)
        external
        override
        returns (
            uint256 amountIn,
            uint160 sqrtPriceX96After,
            uint32 initializedTicksCrossed,
            uint256 gasEstimate
        )
    {
        // Mock logic: calculate a simple conversion
        // For WETH (18 decimals) to USDC (6 decimals) at ~$2000/ETH
        if (params.fee == 3000) {
            // Assuming 1 ETH = 2000 USDC for testing
            // To get 52,000 USDC, need 26 ETH
            amountIn = 26 * 10**18; // 26 ETH
        } else if (params.fee == 500) {
            // Slightly better rate for lower fee tier
            amountIn = 25.5 * 10**18; // 25.5 ETH
        } else {
            // Higher fee tier, worse rate
            amountIn = 26.5 * 10**18; // 26.5 ETH
        }
        
        return (amountIn, 0, 0, 50000);
    }

    function quoteExactInput(bytes memory path, uint256 amountIn)
        external
        override
        returns (
            uint256 amountOut,
            uint160[] memory sqrtPriceX96AfterList,
            uint32[] memory initializedTicksCrossedList,
            uint256 gasEstimate
        )
    {
        // Not implemented for this mock
        revert("Not implemented");
    }

    function quoteExactOutput(bytes memory path, uint256 amountOut)
        external
        override
        returns (
            uint256 amountIn,
            uint160[] memory sqrtPriceX96AfterList,
            uint32[] memory initializedTicksCrossedList,
            uint256 gasEstimate
        )
    {
        // Not implemented for this mock
        revert("Not implemented");
    }
}