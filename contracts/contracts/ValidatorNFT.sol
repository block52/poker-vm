// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IValidator } from "./IValidator.sol";

contract ValidatorNFT is IValidator, ERC721, Ownable {
    enum Suit {
        Spades,
        Hearts,
        Diamonds,
        Clubs
    }

    enum Rank {
        Two,
        Three,
        Four,
        Five,
        Six,
        Seven,
        Eight,
        Nine,
        Ten,
        Jack,
        Queen,
        King,
        Ace
    }

    uint256 public constant MAX_VALIDATORS = 52;
    uint8 private counter;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) Ownable(msg.sender) {
        address self = address(this);
        for (uint256 i = 0; i < MAX_VALIDATORS; i++) {
            _mint(self, i);
        }
        counter = uint8(MAX_VALIDATORS);
    }

    function mint(address to, uint256 tokenId) external onlyOwner {
        _safeMint(to, tokenId);
        counter++;

        emit ValidatorAdded(to, tokenId, counter);
    }

    function getSuitAndRank(uint256 tokenId) external pure returns (Suit suit, Rank rank) {
        require(tokenId < MAX_VALIDATORS, "getSuitAndRank: Token ID out of range");
        suit = Suit(tokenId / 13);
        rank = Rank(tokenId % 13);
    }

    function isValidator(address account) external view returns (bool) {
        return super.balanceOf(account) > 0;
    }

    function validatorCount() external view returns (uint8) {
        return counter;
    }

    function getValidatorAddress(uint256 index) external view returns (address) {
        return super.ownerOf(index);
    }

    event ValidatorAdded(address indexed validator, uint256 indexed tokenId, uint256 indexed count);
}