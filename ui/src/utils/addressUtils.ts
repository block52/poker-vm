import { ethers } from "ethers";

/**
 * Check if an address represents an empty/vacant player slot.
 * Handles both Ethereum-style addresses (0x...) and Cosmos-style addresses (poker52...).
 *
 * @param address - The player address to check
 * @returns true if the address is empty/vacant, false if it's a real player
 */
export const isEmptyAddress = (address: string | null | undefined): boolean => {
    if (!address) return true;
    if (address === "") return true;

    // Trim whitespace
    const trimmed = address.trim();
    if (trimmed === "") return true;

    // Ethereum zero address
    if (address === ethers.ZeroAddress) return true;

    // Check for any all-zero address patterns (lowercase or checksum)
    if (address.toLowerCase() === "0x0000000000000000000000000000000000000000") return true;

    // Check for placeholder/empty patterns that might come from the API
    // Empty string after "0x" prefix
    if (address === "0x") return true;

    // All zeros of any length (some APIs might return shorter zero addresses)
    if (/^0x0+$/.test(address)) return true;

    return false;
};

/**
 * Check if an address represents a valid (non-empty) player.
 * Opposite of isEmptyAddress.
 *
 * @param address - The player address to check
 * @returns true if the address is a valid player address, false if empty
 */
export const isValidPlayerAddress = (address: string | null | undefined): boolean => {
    return !isEmptyAddress(address);
};
