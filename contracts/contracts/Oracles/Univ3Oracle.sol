// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IOracle} from "../IOracle.sol";
import {IQuoterV2} from "@uniswap/v3-periphery/contracts/interfaces/IQuoterV2.sol";
// import {IQuoter} from "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UniswapOracle {
    // Uniswap V3 Quoter V2 contract on Ethereum mainnet
    address public constant QUOTER_V2 = 0x61fFE014bA17989E743c5F6cB21bF9697530B21e;
    
    // USDT address on Ethereum mainnet
    address private constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    function underlying() external view returns (address) {
        return USDT;
    }
    
    struct QuoteParams {
        address tokenIn;
        uint24 fee;
        uint256 amountIn;
        uint160 sqrtPriceLimitX96;
    }

    function getValueInUSDT(address token) external returns (uint256) {
        QuoteParams memory params = QuoteParams({
            tokenIn: token,
            fee: 3000,
            amountIn: 1e18,
            sqrtPriceLimitX96: 0
        });

        (uint256 amountOut, , , ) = this.getQuoteTokenToUnderlying(params);
        return amountOut;
    }
    
    function getQuoteTokenToUnderlying(QuoteParams memory params) external returns (
        uint256 amountOut,
        uint160 sqrtPriceX96After,
        uint32 initializedTicksCrossed,
        uint256 gasEstimate
    ) {
        require(params.tokenIn != USDT, "Token cannot be WETH");
        
        // Create the parameters for the quoter
        IQuoterV2.QuoteExactInputSingleParams memory quoteParams = 
            IQuoterV2.QuoteExactInputSingleParams({
                tokenIn: params.tokenIn,
                tokenOut: USDT,
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