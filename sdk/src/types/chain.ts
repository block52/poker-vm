export type AccountDTO = {
    address: string;
    balance: string;
    nonce: number;
};

export type BlockHeaderDTO = {
    hash: string;
    index: number;
    timestamp: number;
    validator: string;
    version: string;
    signature: string;
    merkleRoot: string;
    previousHash: string;
    transactionCount: number;
};

export type BlockDTO = BlockHeaderDTO & {
    transactions: TransactionDTO[];
};

export type TransactionDTO = {
    to: string;
    from: string;
    value: string;
    hash: string;
    signature: string;
    timestamp: string;
    index?: string;
    nonce?: string;
    data?: string;
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