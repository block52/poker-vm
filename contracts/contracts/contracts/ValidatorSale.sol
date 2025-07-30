// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IValidator } from "../IValidator.sol";

// Add uniswap 
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoterV2.sol";

// import { QuoteExactOutputSingleParams } from "@uniswap/v3-periphery/contracts/interfaces/IQuoterV2.sol";

contract ValidatorSale is Ownable {

    IERC721 public immutable nft;
    address public immutable underlying;
    ISwapRouter public immutable swapRouter;
    IQuoterV2 public immutable quoter;

    uint256 private constant PRICE = 52_000;

    constructor(address nft_) Ownable(msg.sender) {
        require(nft_ != address(0), "NFT address cannot be zero");
        nft = IERC721(nft_);

        underlying = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48); // USDC address
        swapRouter = ISwapRouter(0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45); // Uniswap V3 Router
        quoter = IQuoterV2(0x61fFE014bA17989E743c5F6cB21bF9697530B21e); // Uniswap V3 Quoter
        IERC20(nft_).approve(address(this), type(uint256).max);
    }

    function buy(uint256 tokenId) external {
        require(nft.ownerOf(tokenId) == address(this), "buy: NFT not for sale");
        IERC20(underlying).transferFrom(msg.sender, address(this), 1 ether);

        // Transfer 50% to treasury
        nft.safeTransferFrom(address(this), msg.sender, tokenId);
    }

    function quote(address token, uint24 fee) external returns (uint256) {
        require(token != address(0), "quote: Token address cannot be zero");
        require(fee == 3000 || fee == 500 || fee == 10000, "quote: Invalid fee");

        IQuoterV2.QuoteExactOutputSingleParams memory params = IQuoterV2.QuoteExactOutputSingleParams({
            tokenIn: token,
            tokenOut: underlying,
            amount: getPrice(),
            fee: uint24(fee),
            sqrtPriceLimitX96: 0
        });

        // Use the quoter to get the price
        (uint256 amountIn,,,) = quoter.quoteExactOutputSingle(params);
        return amountIn;
    }

    function getPrice() private view returns (uint256) {
        return PRICE * 10 ** IERC20Metadata(underlying).decimals();
    }

    event Bought(address indexed buyer, uint256 indexed tokenId);
}