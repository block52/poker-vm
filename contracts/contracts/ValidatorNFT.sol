// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IValidator } from "./IValidator.sol";

contract ValidatorNFT is Ownable, ERC721 {

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {
        _mint(msg.sender, 0);
    }

    function mint(address to, uint256 tokenId) external onlyOwner {
        _safeMint(to, tokenId);
    }

    function isValidator(address account) external view returns (bool) {
        return super.balanceOf(account) > 0;
    }

    function validatorCount() external view returns (uint256) {
        return 0;
    }

    function getValidatorAddress(uint256 index) external view returns (address) {
        return super.ownerOf(index);
    }
}