export type TransactionDTO = {
    to: string;
    from: string | null;
    value: string;
    signature: string;
    timestamp: string;
    hash: string;
    index?: string;
}

export type BlockDTO = {
    hash: string;
    index: string;
    timestamp: string;
    transactions: TransactionDTO[];
}