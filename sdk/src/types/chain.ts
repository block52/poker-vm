/**
 * Cosmos Chain Types
 */

// Standard Cosmos Coin type
export interface Coin {
    denom: string;
    amount: string;
}

// Cosmos Account Response from REST API
export interface AccountResponse {
    address: string;
    pub_key?: any;
    account_number: string;
    sequence: string;
    [key: string]: any;
}

// Cosmos Transaction Response from REST API
export interface TxResponse {
    height: string;
    txhash: string;
    codespace?: string;
    code?: number;
    data?: string;
    raw_log: string;
    logs?: any[];
    info?: string;
    gas_wanted: string;
    gas_used: string;
    tx?: any;
    timestamp: string;
    events?: any[];
    [key: string]: any;
}

// Cosmos Block Response from REST API
export interface BlockResponse {
    block_id: any;
    block: any;
    [key: string]: any;
}

/**
 * Legacy DTO Types (for backward compatibility)
 */

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
    data? : string;
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

export type WithdrawResponseDTO = {
    nonce: string;
    receiver: string;
    amount: string;
    signature: string;
    timestamp: string;
    withdrawSignature: string;
};