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

    // todo: work out how to manage the rest of the usdc on this account , might have a slashing contract becuase we are going to have a bonding system, and also a penalty if the node doesnt do their job, and also a cooling off perioed for the node operator to object.
    // todo: have a failsafe withdraw function to treasury

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
        IERC20(underlying).transferFrom(msg.sender, address(this), PRICE);

        // Transfer 50% to treasury - change to mint and transfer to msg.sender
        // update Validator NFT to allow for minting and transfer to msg.sender
        nft.safeTransferFrom(address(this), msg.sender, tokenId);

        //todo: send 52% or usdc to treasury

    }


    function getPrice() private view returns (uint256) {
        return PRICE * 10 ** IERC20Metadata(underlying).decimals();
    }

    event Bought(address indexed buyer, uint256 indexed tokenId);
}