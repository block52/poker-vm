export class NativeToken {
    public static getDecimals(): bigint {
        return 18n;
    }

    // Convert value using arbitrary number of decimals to our native number of decimals
    // Note: Will truncate any remainder
    public static convertFromDecimals(amount: bigint, decimals: bigint): bigint {
        const nativeDecimals = this.getDecimals();

        const convertedAmount = amount * 10n ** (nativeDecimals - decimals);
        return convertedAmount;
    }

    // Convert value using our native number of decimals to arbitrary number of decimals
    // Note: Will truncate any remainder
    public static convertToDecimals(amount: bigint, decimals: bigint): bigint {
        const nativeDecimals = this.getDecimals();

        const convertedAmount = amount / 10n ** (nativeDecimals - decimals);
        return convertedAmount;
    }
}
