// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ValidatorNFT } from "./ValidatorNFT.sol";

// Add uniswap 
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoterV2.sol";

contract ValidatorSale is Ownable {

    ValidatorNFT public immutable nft;
    address public immutable underlying;
    address public immutable treasury;
    ISwapRouter public immutable swapRouter;
    IQuoterV2 public immutable quoter;

    uint256 private constant PRICE = 52_000;
    uint256 private constant TREASURY_PERCENTAGE = 52; // 52% goes to treasury
    // Remaining 48% stays in contract for bonding/slashing mechanism
    // This will be used as collateral for validator performance

    constructor(address nft_, address treasury_) Ownable(msg.sender) {
        require(nft_ != address(0), "NFT address cannot be zero");
        require(treasury_ != address(0), "Treasury address cannot be zero");
        
        nft = ValidatorNFT(nft_);
        treasury = treasury_;
        underlying = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48); // USDC address
        swapRouter = ISwapRouter(0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45); // Uniswap V3 Router
        quoter = IQuoterV2(0x61fFE014bA17989E743c5F6cB21bF9697530B21e); // Uniswap V3 Quoter
    }

    function buy(uint256 tokenId) external {
        uint256 price = getPrice();
        
        // Transfer full payment from buyer
        IERC20(underlying).transferFrom(msg.sender, address(this), price);
        
        // Send 52% to treasury immediately
        uint256 treasuryAmount = (price * TREASURY_PERCENTAGE) / 100;
        IERC20(underlying).transfer(treasury, treasuryAmount);
        
        // Mint and transfer NFT to buyer
        nft.mintAndTransfer(msg.sender, tokenId);
        
        emit Bought(msg.sender, tokenId);
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
    
    // Failsafe function to withdraw remaining USDC to treasury
    // The remaining 48% is intended for bonding/slashing but can be withdrawn if needed
    function withdrawToTreasury() external onlyOwner {
        uint256 balance = IERC20(underlying).balanceOf(address(this));
        require(balance > 0, "withdrawToTreasury: No balance to withdraw");
        
        IERC20(underlying).transfer(treasury, balance);
        
        emit WithdrawnToTreasury(balance);
    }

    event Bought(address indexed buyer, uint256 indexed tokenId);
    event WithdrawnToTreasury(uint256 amount);
}