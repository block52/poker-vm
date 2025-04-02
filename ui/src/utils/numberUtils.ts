import { BigUnit } from "bigunit";
import { ethers } from "ethers";

export const toDollar = (amount: bigint): string => {
    const dollar = amount.toString();

    // truncate the amount to 2 decimal places
    const [whole, decimal] = dollar.split(".");
    if (!decimal) return dollar;

    return `${whole}.${decimal.slice(0, 2)}`;
};

export const toDollarFromString = (amount: string | null): string => {
    if (!amount) return "0.00";

    // truncate the amount to 2 decimal places, if regex

    if (amount.match(/\d+\.\d{3,}/)) {
        const [whole, decimal] = amount.split(".");
        if (!decimal) return whole;

        return `${whole}.${decimal.slice(0, 2)}`;
    }

    return toDollar(BigInt(amount));
};

export const toDollarFromBigUnit = (amount: BigUnit): string => {
    return toDollar(amount.toBigInt());
};

export const formatUSDC = (amount: string): string => {
    const usdc = ethers.parseUnits(amount, 6);
    return toDollar(usdc);
};

// Update the formatting function to ensure two decimal places
export const formatWeiToDollars = (weiAmount: string | bigint): string => {
    try {
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
export const formatWeiToSimpleDollars = (weiAmount: string | bigint): string => {
    try {
        const etherValue = ethers.formatUnits(weiAmount.toString(), 18);
        return parseFloat(etherValue).toFixed(2);
    } catch (error) {
        console.error("Error formatting Wei amount:", error);
        return "0.00";
    }
};

export const formatWeiToUSD = (weiAmount: string | number): string => {
    try {
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
