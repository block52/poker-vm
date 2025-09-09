// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ValidatorNFT } from "./ValidatorNFT.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { ERC4626 } from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

contract ValidatorPartial is Ownable {

    public constant address NFT = address(0);
    public uint256 tokenId;
    private address _underlying;
    private uint8 _decimalsOffset;

    function asset() public view virtual returns (address) {
        return address(_underlying);
    }

    function decimals() public view virtual override(IERC20Metadata, ERC20) returns (uint8) {
        return IERC20Metadata(_underlying).decimals();
    }

    function name() public view override returns (string memory) {
        return "ValidatorPartial";
    }

    constructor() Ownable(msg.sender) {

        // nft = ValidatorNFT(nft_);
        // treasury = treasury_;
        // underlying = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48); // USDC address
        // swapRouter = ISwapRouter(0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45); // Uniswap V3 Router
        // quoter = IQuoterV2(0x61fFE014bA17989E743c5F6cB21bF9697530B21e); // Uniswap V3 Quoter
    }

    function setTokenId(uint256 _tokenId) external {
        if (IERC721(NFT).ownerOf(_tokenId) != address(this)) {
            revert("Not the owner of this NFT");
        }

        tokenId = _tokenId;
    }

    function getNFTData() private view returns (address) {
        // ownerOf(uint256 _tokenId) external view returns (address);
        return IERC721(NFT).ownerOf(tokenId);
    }

    /// @inheritdoc IERC4626
    function deposit(uint256 assets, address receiver) public virtual returns (uint256) {
        uint256 maxAssets = maxDeposit(receiver);
        if (assets > maxAssets) {
            revert ERC4626ExceededMaxDeposit(receiver, assets, maxAssets);
        }

        uint256 shares = previewDeposit(assets);
        _deposit(_msgSender(), receiver, assets, shares);

        return shares;
    }

    function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes _data) external returns(bytes4) {

    }

    event NFTReceived(address operator, address from, uint256 tokenId, bytes data);
    event TokenIdUpdated(uint256 newTokenId);
}