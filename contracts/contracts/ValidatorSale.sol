// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IValidator } from "./IValidator.sol";

contract ValidatorSale is Ownable {

    private address public immutable nft;
    private address public immutable underlying;
    public int8 public totalSold;

    constructor(address nft_, address underlying_) Ownable(msg.sender) {
        nft = nft_;
        IERC20(nft).approve(address(this), type(uint256).max);
    }

    function buy(uint256 tokenId) external {
        require(IERC721(nft).ownerOf(tokenId) == address(this), "Not for sale");

        sold += 1;
        IERC20(underlying).transferFrom(msg.sender, address(this), 1 ether);

        // Transfer 50% to treasury

        IERC721(nft).safeTransferFrom(address(this), msg.sender, tokenId);
    }

    function nonLinearFee(uint256 tokenId) external view returns (uint256) {
        uint8 decimals = IERC20(underlying).decimals();
        uint256 price = 1000 * (10 ** decimals) * (uint256(totalSold) + 1);
        return price;
    }

    event Bought(address indexed buyer, uint256 tokenId);
}