// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IValidator } from "../IValidator.sol";

// todo: have a minter role that can use mintAndTransferFrom on the vallidator sale contract

contract ValidatorNFT is IValidator, ERC721Enumerable, Ownable {
    // Card order matches deck.test.ts: Clubs -> Diamonds -> Hearts -> Spades
    enum Suit {
        Clubs,      // 0: First suit in deck order
        Diamonds,   // 1: Second suit in deck order
        Hearts,     // 2: Third suit in deck order
        Spades      // 3: Fourth suit in deck order
    }

    // Rank order matches deck.test.ts: A,2,3,4,5,6,7,8,9,10,J,Q,K
    enum Rank {
        Ace,        // 0: A (position 0, 13, 26, 39)
        Two,        // 1: 2 (position 1, 14, 27, 40) 
        Three,      // 2: 3 (position 2, 15, 28, 41)
        Four,       // 3: 4 (position 3, 16, 29, 42)
        Five,       // 4: 5 (position 4, 17, 30, 43)
        Six,        // 5: 6 (position 5, 18, 31, 44)
        Seven,      // 6: 7 (position 6, 19, 32, 45)
        Eight,      // 7: 8 (position 7, 20, 33, 46)
        Nine,       // 8: 9 (position 8, 21, 34, 47)  
        Ten,        // 9: 10 (position 9, 22, 35, 48)
        Jack,       // 10: J (position 10, 23, 36, 49)
        Queen,      // 11: Q (position 11, 24, 37, 50)
        King        // 12: K (position 12, 25, 38, 51)
    }

    uint8 public constant MAX_VALIDATORS = 52;
    
    // Track which cards (token IDs) have been minted to validators
    mapping(uint256 => bool) public cardMinted;
    
    // Track which cards are enabled/disabled by owner
    mapping(uint256 => bool) public cardDisabled;
    
    // Token URI mapping
    mapping(uint256 => string) private _tokenURIs;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) Ownable(msg.sender) {
        // Contract starts with all 52 cards available for minting
        // No pre-minting - cards are minted on demand
    }

    function mint(address to, uint256 tokenId) external onlyOwner {
        require(tokenId < MAX_VALIDATORS, "mint: Token ID out of range");
        require(!cardMinted[tokenId], "mint: Card already minted");
        
        _safeMint(to, tokenId);
        cardMinted[tokenId] = true;
        cardDisabled[tokenId] = true; // Default to disabled

        emit ValidatorAdded(to, tokenId, totalSupply());
    }
    
    function toggleEnable(uint256 tokenId) external {
        require(tokenId < MAX_VALIDATORS, "toggleEnable: Token ID out of range");
        require(cardMinted[tokenId], "toggleEnable: Token not minted");
        require(ownerOf(tokenId) == msg.sender, "toggleEnable: Not token owner");
        
        cardDisabled[tokenId] = !cardDisabled[tokenId];
        
        if (cardDisabled[tokenId]) {
            emit CardDisabled(tokenId);
        } else {
            emit CardEnabled(tokenId);
        }
    }
    

    function getSuitAndRank(uint256 tokenId) external pure returns (Suit suit, Rank rank) {
        require(tokenId < MAX_VALIDATORS, "getSuitAndRank: Token ID out of range");
        
        // Token ID to suit/rank mapping following deck.test.ts order:
        // Clubs: 0-12, Diamonds: 13-25, Hearts: 26-38, Spades: 39-51
        suit = Suit(tokenId / 13);
        rank = Rank(tokenId % 13);
    }
    
    function getCardMnemonic(uint256 tokenId) external pure returns (string memory) {
        require(tokenId < MAX_VALIDATORS, "getCardMnemonic: Token ID out of range");
        
        // Calculate suit and rank directly without calling external function
        Suit suit = Suit(tokenId / 13);
        Rank rank = Rank(tokenId % 13);
        
        string memory rankStr;
        if (rank == Rank.Ace) rankStr = "A";
        if (rank == Rank.Two) rankStr = "2";
        if (rank == Rank.Three) rankStr = "3";
        if (rank == Rank.Four) rankStr = "4";
        if (rank == Rank.Five) rankStr = "5";
        if (rank == Rank.Six) rankStr = "6";
        if (rank == Rank.Seven) rankStr = "7";
        if (rank == Rank.Eight) rankStr = "8";
        if (rank == Rank.Nine) rankStr = "9";
        if (rank == Rank.Ten) rankStr = "T";
        if (rank == Rank.Jack) rankStr = "J";
        if (rank == Rank.Queen) rankStr = "Q";
        if (rank == Rank.King) rankStr = "K";
        
        string memory suitStr;
        if (suit == Suit.Clubs) suitStr = "C";
        if (suit == Suit.Diamonds) suitStr = "D";
        if (suit == Suit.Hearts) suitStr = "H";
        if (suit == Suit.Spades) suitStr = "S";
        
        return string(abi.encodePacked(rankStr, suitStr));
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId < MAX_VALIDATORS, "tokenURI: Token ID out of range");
        return _tokenURIs[tokenId];
    }
    
    function setTokenURI(uint256 tokenId, string memory uri) external onlyOwner {
        require(tokenId < MAX_VALIDATORS, "setTokenURI: Token ID out of range");
        _tokenURIs[tokenId] = uri;
    }

    function isValidator(address account) external view returns (bool) {
        uint256 balance = balanceOf(account);
        if (balance == 0) return false;
        
        // Check if any of the account's cards are enabled
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(account, i);
            if (!cardDisabled[tokenId]) {
                return true;
            }
        }
        return false;
    }

    function validatorCount() external view returns (uint256) {
        return totalSupply();
    }

    function getValidatorAddress(uint256 tokenId) external view returns (address) {
        require(cardMinted[tokenId], "getValidatorAddress: Card not minted");
        return super.ownerOf(tokenId);
    }

    event ValidatorAdded(address indexed validator, uint256 indexed tokenId, uint256 indexed count);
    event CardDisabled(uint256 indexed tokenId);
    event CardEnabled(uint256 indexed tokenId);
}