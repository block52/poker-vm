import { BigUnit } from "bigunit";
import { ethers } from "ethers";

// Modify formatBalance to add logging
export const formatBalance = (balance: string | number) => {
    const value = Number(balance) / 1e18;
    const formatted = value.toFixed(2);
    return formatted;
};

export const formatToFixed = (value: number | number): string => {
    return value.toFixed(2);
};

export const formatToFixedFromString = (value: string | number): string => {
    return Number(ethers.formatUnits(value || "0", 18)).toFixed(2);
}

// Update the formatting function to ensure two decimal places
export const formatWeiToDollars = (weiAmount: string | bigint | undefined | null): string => {
    try {
        // Handle undefined or null values
        if (weiAmount === undefined || weiAmount === null) {
            return "0.00";
        }

        // Convert from Wei (18 decimals) to standard units
        const usdValue = Number(ethers.formatUnits(weiAmount.toString(), 18));

        // Format to always show 2 decimal places
        return usdValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    } catch (error) {
        console.error("Error formatting Wei amount:", error);
        return "0.00";
    }
};

// Simplified version without commas if needed
export const formatWeiToSimpleDollars = (weiAmount: string | bigint | undefined | null): string => {
    try {
        // Handle undefined or null values
        if (weiAmount === undefined || weiAmount === null) {
            return "0.00";
        }

        const etherValue = ethers.formatUnits(weiAmount.toString(), 18);
        return parseFloat(etherValue).toFixed(2);
    } catch (error) {
        console.error("Error formatting Wei amount:", error);
        return "0.00";
    }
};

export const formatWeiToUSD = (weiAmount: string | number | undefined | null): string => {
    try {
        // Handle undefined or null values
        if (weiAmount === undefined || weiAmount === null) {
            return "0.00";
        }

        // Convert from Wei (18 decimals) to standard units
        const usdValue = Number(ethers.formatUnits(weiAmount.toString(), 18));
        // Format to 2 decimal places and add commas
        return usdValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    } catch (error) {
        console.error("Error formatting Wei amount:", error);
        return "0.00";
    }
};

/**
 * Formats a winning amount with appropriate styling
 * @param amount The winning amount in ETH as a string
 * @returns Formatted string for display
 */
export const formatWinningAmount = (amount: string): string => {
    // Convert to a number and format it with commas
    const numAmount = parseFloat(amount);
    return numAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

/**
 * Converts a string amount to BigInt using specified decimals
 * @param amount The amount as a string
 * @param decimals The number of decimals to use for conversion
 * @returns BigInt representation of the amount
 */
export const convertAmountToBigInt = (amount: string, decimals: number): bigint => {
    if (!decimals || !amount || !+amount) return BigInt(0);
    return BigUnit.from(+amount, decimals).toBigInt();
};

// Format USDC amounts (6 decimals) to simple dollar format
export const formatUSDCToSimpleDollars = (usdcAmount: string | bigint | undefined | null): string => {
    try {
        // Handle undefined or null values
        if (usdcAmount === undefined || usdcAmount === null) {
            return "0.00";
        }

        const usdcValue = ethers.formatUnits(usdcAmount.toString(), 6);
        return parseFloat(usdcValue).toFixed(2);
    } catch (error) {
        console.error("Error formatting USDC amount:", error);
        return "0.00";
    }
};

// Format chip amounts that are stored in Wei format but represent USDC values
//
// The poker system stores chip amounts in Wei format (18 decimals) internally,
// but these represent USDC values which use 6 decimals. To convert properly:
// 1. Divide by 10^14 to convert from 18-decimal format to 6-decimal format
// 2. Format using ethers.formatUnits with 6 decimals
//
// Example: 960000000000000000000 (Wei format) -> 9.60 (USDC)
export const formatChipAmount = (chipAmount: string | bigint | undefined | null): string => {
    try {
        // Handle undefined or null values
        if (chipAmount === undefined || chipAmount === null) {
            return "0.00";
        }

        // Convert from Wei format (18 decimals) to USDC-compatible format
        // Divide by 10^14 to get the correct USDC amount, then format with 6 decimals
        const converted = BigInt(chipAmount.toString()) / BigInt("100000000000000");
        const usdcValue = ethers.formatUnits(converted.toString(), 6);
        return parseFloat(usdcValue).toFixed(2);
    } catch (error) {
        console.error("Error formatting chip amount:", error);
        return "0.00";
    }
};
