export type TransactionDTO = {
    to: string;
    from: string;
    value: string;
    hash: string;
    signature: string;
    timestamp: string;
    index?: string;
    nonce?: string;
    data? : string;
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
    nonce: number;
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
