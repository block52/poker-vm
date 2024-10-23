// RPC Class
export type RPCRequest = {
    id: string;
    method: RPCMethods;
    params: RPCRequestParams[RPCMethods];
    data?: string;
};

export type RPCResponse<T> = {
    id: string;
    result: T;
    error?: string;
};

export enum RPCMethods {
    GET_ACCOUNT = "get_account",
    GET_BLOCK = "get_block",
    GET_CLIENT = "get_client",
    GET_LAST_BLOCK = "get_last_block",
    GET_MEMPOOL = "get_mempool",
    GET_NODES = "get_nodes",
    MINE = "mine",
    MINT = "mint",
    MINED_BLOCK_HASH = "mined_block_hash",
    START = "start",
    STOP = "stop",
    SHUTDOWN = "shutdown",
    TRANSFER = "transfer"
}

export type RPCRequestParams = {
    [RPCMethods.GET_ACCOUNT]: [string]; // [address]
    [RPCMethods.GET_BLOCK]: [bigint]; // [index]
    [RPCMethods.GET_CLIENT]: []; // No parameters
    [RPCMethods.GET_LAST_BLOCK]: []; // No parameters
    [RPCMethods.GET_MEMPOOL]: []; // No parameters
    [RPCMethods.GET_NODES]: []; // No parameters
    [RPCMethods.MINE]: []; // No parameters
    [RPCMethods.MINT]: [string, bigint, string]; // [address, amount, transactionId]
    [RPCMethods.MINED_BLOCK_HASH]: [string]; // [blockHash]
    [RPCMethods.START]: []; // No parameters
    [RPCMethods.STOP]: []; // No parameters
    [RPCMethods.TRANSFER]: [string, string, bigint]; // [from, to, amount]
    [RPCMethods.SHUTDOWN]: [string, string]; // [username, password]
};

export const READ_METHODS = [
    RPCMethods.GET_ACCOUNT,
    RPCMethods.GET_BLOCK,
    RPCMethods.GET_CLIENT,
    RPCMethods.GET_LAST_BLOCK,
    RPCMethods.GET_MEMPOOL,
    RPCMethods.GET_NODES,
    RPCMethods.MINED_BLOCK_HASH,
];

export const WRITE_METHODS = [
    RPCMethods.MINE,
    RPCMethods.MINT,
    RPCMethods.TRANSFER
];

export const CONTROL_METHODS = [RPCMethods.START, RPCMethods.STOP, RPCMethods.SHUTDOWN];
