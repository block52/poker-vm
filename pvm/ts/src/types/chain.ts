export type TransactionDTO = {
    to: string;
    from: string;
    value: number;
    signature: string;
    timestamp: number;
    hash: string;
    index?: number;
}