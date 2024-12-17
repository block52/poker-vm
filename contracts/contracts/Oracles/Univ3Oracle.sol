// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IOracle} from "../IOracle.sol";
import {IQuoterV2} from "@uniswap/v3-periphery/contracts/interfaces/IQuoterV2.sol";
// import {IQuoter} from "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UniswapOracle {
    // Uniswap V3 Quoter V2 contract on Ethereum mainnet
    address public constant QUOTER_V2 = 0x61fFE014bA17989E743c5F6cB21bF9697530B21e;
    
    // WETH address on Ethereum mainnet
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    
    struct QuoteParams {
        address tokenIn;
        uint24 fee;
        uint256 amountIn;
        uint160 sqrtPriceLimitX96;
    }

    function getValueInEth(address token) external returns (uint256) {
        QuoteParams memory params = QuoteParams({
            tokenIn: token,
            fee: 3000,
            amountIn: 1e18,
            sqrtPriceLimitX96: 0
        });

        (uint256 amountOut, , , ) = this.getQuoteTokenToEth(params);
        return amountOut;
    }
    
    function getQuoteTokenToEth(QuoteParams memory params) external returns (
        uint256 amountOut,
        uint160 sqrtPriceX96After,
        uint32 initializedTicksCrossed,
        uint256 gasEstimate
    ) {
        require(params.tokenIn != WETH, "Token cannot be WETH");
        
        // Create the parameters for the quoter
        IQuoterV2.QuoteExactInputSingleParams memory quoteParams = 
            IQuoterV2.QuoteExactInputSingleParams({
                tokenIn: params.tokenIn,
                tokenOut: WETH,
                fee: params.fee,
                amountIn: params.amountIn,
                sqrtPriceLimitX96: params.sqrtPriceLimitX96
            });
            
        // Get quote from Uniswap V3 Quoter
        (
            amountOut,
            sqrtPriceX96After,
            initializedTicksCrossed,
            gasEstimate
        ) = IQuoterV2(QUOTER_V2).quoteExactInputSingle(quoteParams);
    }
}