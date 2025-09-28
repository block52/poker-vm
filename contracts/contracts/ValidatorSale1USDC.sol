// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ValidatorNFT } from "./ValidatorNFT.sol";

// Add uniswap 
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoterV2.sol";

contract ValidatorSale1USDC is Ownable {

    ValidatorNFT public immutable nft;
    address public immutable underlying;
    address public immutable treasury;
    ISwapRouter public immutable swapRouter;
    IQuoterV2 public immutable quoter;

    uint256 private constant PRICE = 1; // 1 USDC per NFT
    uint256 private constant TREASURY_PERCENTAGE = 52; // 52% goes to treasury
    // Remaining 48% stays in contract for bonding/slashing mechanism
    // This will be used as collateral for validator performance

    constructor(address nft_, address treasury_) Ownable(msg.sender) {
        require(nft_ != address(0), "NFT address cannot be zero");
        require(treasury_ != address(0), "Treasury address cannot be zero");
        
        nft = ValidatorNFT(nft_);
        treasury = treasury_;
        underlying = address(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913); // Base USDC address
        swapRouter = ISwapRouter(0x2626664c2603336E57B271c5C0b26F421741e481); // Base Uniswap V3 Router
        quoter = IQuoterV2(0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a); // Base Uniswap V3 Quoter V2
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
        require(token != underlying, "quote: Cannot quote USDC to USDC");
        require(fee == 100 || fee == 500 || fee == 3000 || fee == 10000, "quote: Invalid fee tier");

        IQuoterV2.QuoteExactOutputSingleParams memory params = IQuoterV2.QuoteExactOutputSingleParams({
            tokenIn: token,
            tokenOut: underlying,
            amount: getPrice(),
            fee: fee,
            sqrtPriceLimitX96: 0
        });

        try quoter.quoteExactOutputSingle(params) returns (
            uint256 amountIn,
            uint160,
            uint32,
            uint256
        ) {
            require(amountIn > 0, "quote: Invalid quote returned");
            return amountIn;
        } catch {
            revert("quote: No liquidity or invalid pair");
        }
    }

    function getPrice() public view returns (uint256) {
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