export type TransactionDTO = {
    to: string | null;
    from: string | null;
    value: string;
    signature: string;
    timestamp: string;
    hash: string;
    index?: string;
};

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
};

export type AccountDTO = {
    address: string;
    balance: string;
};

export type BurnResponseDTO = {
    mintSignature: {
        amount: string;
        to: string;
        nonce: string;
        signature: string;
    };
    burnTransaction: TransactionDTO;
};
