/**
 * Currency conversion constants for USDC
 * 
 * USDC uses 6 decimal places (micro-denominations)
 * 1 USDC = 1,000,000 micro-USDC
 */

/** Number of micro-units per 1 USDC (10^6) */
export const USDC_DECIMALS = 6;

/** Conversion factor: 1 USDC = 1,000,000 micro-USDC */
export const USDC_TO_MICRO = 1_000_000;

/** Conversion factor: 1 micro-USDC = 0.000001 USDC */
export const MICRO_TO_USDC = 1 / 1_000_000;

/**
 * Convert USDC dollars to micro-units
 * @param usdcAmount Amount in USDC (e.g., 1.50)
 * @returns Amount in micro-units (e.g., 1500000)
 */
export function usdcToMicro(usdcAmount: number): number {
    return Math.floor(usdcAmount * USDC_TO_MICRO);
}

/**
 * Convert micro-units to USDC dollars
 * @param microAmount Amount in micro-units (e.g., 1500000)
 * @returns Amount in USDC (e.g., 1.50)
 */
export function microToUsdc(microAmount: number | string): number {
    const amount = typeof microAmount === "string" ? parseFloat(microAmount) : microAmount;
    return amount / USDC_TO_MICRO;
}

/**
 * Format micro-units as USDC with specified decimal places
 * @param microAmount Amount in micro-units
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted USDC string (e.g., "1.50")
 */
export function formatMicroAsUsdc(microAmount: number | string, decimals: number = 2): string {
    return microToUsdc(microAmount).toFixed(decimals);
}
