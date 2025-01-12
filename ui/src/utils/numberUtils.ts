export const toDollar = (amount: BigInt): string => {
    const dollar = amount.toString();

    // trucate the amount to 2 decimal places
    const [whole, decimal] = dollar.split(".");
    if (!decimal) return dollar;

    return `${whole}.${decimal.slice(0, 2)}`;
}

export const toDollarFromString = (amount: string): string => {
    return toDollar(BigInt(amount));
}