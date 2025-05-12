// Create an enum of game types
export enum GameType {
    CASH = "cash",
    TOURNAMENT = "tournament"
}

export enum Variant {
    TEXAS_HOLDEM = "texas-holdem",
    OMAHA = "omaha"
}

// Define transaction status types
// todo: make enums
export type TransactionStatus = "DETECTED" | "PROCESSING" | "CONFIRMING" | "CONFIRMED" | "COMPLETED" | null;

// Define interface for transaction data
export interface EtherscanTransaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    timeStamp: string;
    [key: string]: unknown; // For other properties we might not be using
}

export interface DepositSession {
    _id: string;
    userAddress: string;
    depositAddress: string;
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "EXPIRED";
    expiresAt: string;
    amount: number | null;
    txHash?: string;
    txStatus?: TransactionStatus;
}
