// Add function to format address
export const formatAddress = (address: string | undefined) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Modify formatBalance to add logging
export const formatBalance = (rawBalance: string | number) => {
    const value = Number(rawBalance) / 1e18;
    const formatted = value.toFixed(2);
    return formatted;
};
