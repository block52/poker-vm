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
    index: number;
    timestamp: number;
    validator: string;
    version: string;
    signature: string;
    merkleRoot: string;
    previousHash: string;
    transactions: TransactionDTO[];
}

export type AccountDTO = {
    address: string;
    balance: string;
}