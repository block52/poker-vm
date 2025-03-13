import { BigUnit } from "bigunit";
import { ethers } from "ethers";

export const toDollar = (amount: BigInt): string => {
    const dollar = amount.toString();

    // truncate the amount to 2 decimal places
    const [whole, decimal] = dollar.split(".");
    if (!decimal) return dollar;

    return `${whole}.${decimal.slice(0, 2)}`;
}

export const toDollarFromString = (amount: string | null): string => {
    if (!amount) return "0.00";

    // truncate the amount to 2 decimal places, if regex

    if (amount.match(/\d+\.\d{3,}/)) {
        const [whole, decimal] = amount.split(".");
        if (!decimal) return whole;
    
        return `${whole}.${decimal.slice(0, 2)}`;
    }

    return toDollar(BigInt(amount));
}
 
export const toDollarFromBigUnit = (amount: BigUnit): string => {
    return toDollar(amount.toBigInt());
}

export const formatUSDC = (amount: string): string => {
    const usdc = ethers.parseUnits(amount, 6);
    return toDollar(usdc);
}

// New function to format Wei values (18 decimals) to dollars
export const formatWeiToDollars = (weiAmount: string | bigint): number => {
    try {
        // Convert from Wei (18 decimals) to standard units
        const etherValue = ethers.formatUnits(weiAmount.toString(), 18);
        
        // Parse to number and format to 2 decimal places
        const dollarValue = parseFloat(etherValue);
        
        // Format with commas for thousands and fixed 2 decimal places
        return dollarValue;
    } catch (error) {
        console.error("Error formatting Wei amount:", error);
        return 0;
    }
}

// Simplified version without commas if needed
export const formatWeiToSimpleDollars = (weiAmount: string | bigint): string => {
    try {
        const etherValue = ethers.formatUnits(weiAmount.toString(), 18);
        return parseFloat(etherValue).toFixed(2);
    } catch (error) {
        console.error("Error formatting Wei amount:", error);
        return "0.00";
    }
}