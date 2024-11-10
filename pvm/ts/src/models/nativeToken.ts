export class NativeToken {
    public static getDecimals(): bigint {
        return 18n;
    }

    public static convertFromDecimals(amount: bigint, decimals: bigint): bigint {
        const nativeDecimals = this.getDecimals();

        const convertedAmount = amount * 10n ** (nativeDecimals - decimals);
        return convertedAmount;
    }
}
