// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IValidator } from "../IValidator.sol";

contract ValidatorNFT is IValidator, ERC721, Ownable {
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

    uint256 public constant MAX_VALIDATORS = 52;
    
    // Track which cards (token IDs) have been minted to validators
    mapping(uint256 => bool) public cardMinted;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) Ownable(msg.sender) {
        // Contract starts with all 52 cards available for minting
        // No pre-minting - cards are minted on demand
    }

    function mint(address to, uint256 cardPosition) external onlyOwner {
        require(cardPosition < MAX_VALIDATORS, "ValidatorNFT: Card position out of range");
        require(!cardMinted[cardPosition], "ValidatorNFT: Card already minted");
        
        _safeMint(to, cardPosition);
        cardMinted[cardPosition] = true;

        emit ValidatorAdded(to, cardPosition, getMintedCardCount());
    }
    
    function getMintedCardCount() public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < MAX_VALIDATORS; i++) {
            if (cardMinted[i]) {
                count++;
            }
        }
        return count;
    }

    function getSuitAndRank(uint256 cardPosition) external pure returns (Suit suit, Rank rank) {
        require(cardPosition < MAX_VALIDATORS, "ValidatorNFT: Card position out of range");
        
        // Card position to suit/rank mapping following deck.test.ts order:
        // Clubs: 0-12, Diamonds: 13-25, Hearts: 26-38, Spades: 39-51
        suit = Suit(cardPosition / 13);
        rank = Rank(cardPosition % 13);
    }
    
    function getCardMnemonic(uint256 cardPosition) external pure returns (string memory) {
        require(cardPosition < MAX_VALIDATORS, "ValidatorNFT: Card position out of range");
        
        // Calculate suit and rank directly without calling external function
        Suit suit = Suit(cardPosition / 13);
        Rank rank = Rank(cardPosition % 13);
        
        string memory rankStr;
        if (rank == Rank.Ace) rankStr = "A";
        else if (rank == Rank.Two) rankStr = "2";
        else if (rank == Rank.Three) rankStr = "3";
        else if (rank == Rank.Four) rankStr = "4";
        else if (rank == Rank.Five) rankStr = "5";
        else if (rank == Rank.Six) rankStr = "6";
        else if (rank == Rank.Seven) rankStr = "7";
        else if (rank == Rank.Eight) rankStr = "8";
        else if (rank == Rank.Nine) rankStr = "9";
        else if (rank == Rank.Ten) rankStr = "T";  // Use "T" for Ten as per deck.test.ts
        else if (rank == Rank.Jack) rankStr = "J";
        else if (rank == Rank.Queen) rankStr = "Q";
        else if (rank == Rank.King) rankStr = "K";
        
        string memory suitStr;
        if (suit == Suit.Clubs) suitStr = "C";
        else if (suit == Suit.Diamonds) suitStr = "D";
        else if (suit == Suit.Hearts) suitStr = "H";
        else if (suit == Suit.Spades) suitStr = "S";
        
        return string(abi.encodePacked(rankStr, suitStr));
    }

    function isValidator(address account) external view returns (bool) {
        return super.balanceOf(account) > 0;
    }

    function validatorCount() external view returns (uint256) {
        return getMintedCardCount();
    }

    function getValidatorAddress(uint256 cardPosition) external view returns (address) {
        require(cardMinted[cardPosition], "ValidatorNFT: Card not minted");
        return super.ownerOf(cardPosition);
    }

    event ValidatorAdded(address indexed validator, uint256 indexed tokenId, uint256 indexed count);
}