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