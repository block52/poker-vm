// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token for testing purposes with minting capability
 * @notice This is a test token and should NOT be used in production
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6; // USDC uses 6 decimals

    constructor() ERC20("Mock USD Coin", "USDC") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, 1000000 * 10**DECIMALS); // 1 million mock USDC
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * USDC uses 6 decimals.
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @dev Mint new tokens. Only owner can mint.
     * @param to Address to receive the minted tokens
     * @param amount Amount to mint (remember to account for 6 decimals)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from the caller's balance
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @dev Mint tokens to multiple addresses in one transaction
     * @param recipients Array of addresses to receive tokens
     * @param amounts Array of amounts to mint to each address
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "MockUSDC: arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }
}