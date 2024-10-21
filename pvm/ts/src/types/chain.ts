export type TransactionDTO = {
    to: string;
    from: string | null;
    value: string;
    signature: string;
    timestamp: string;
    hash: string;
    index?: string;
}