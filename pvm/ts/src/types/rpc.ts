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
    CREATE_CONTRACT_SCHEMA = "create_contract_schema",
    GET_ACCOUNT = "get_account",
    GET_BLOCK = "get_block",
    GET_CLIENT = "get_client",
    GET_CONTRACT_SCHEMA = "get_contract_schema",
    GET_LAST_BLOCK = "get_last_block",
    GET_MEMPOOL = "get_mempool",
    GET_NODES = "get_nodes",
    MINE = "mine",
    MINED_BLOCK_HASH = "mined_block_hash",
    MINT = "mint",
    SHUTDOWN = "shutdown",
    START = "start",
    STOP = "stop",
    TRANSFER = "transfer"
}

export type RPCRequestParams = {
    [RPCMethods.GET_ACCOUNT]: [string]; // [address]
    [RPCMethods.GET_BLOCK]: [bigint]; // [index]
    [RPCMethods.GET_CLIENT]: []; // No parameters
    [RPCMethods.GET_CONTRACT_SCHEMA]: [string]; // [hash]
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
    [RPCMethods.CREATE_CONTRACT_SCHEMA]: [string, string, any]; // [category, name, schema]
};

export const READ_METHODS = [
    RPCMethods.GET_ACCOUNT,
    RPCMethods.GET_BLOCK,
    RPCMethods.GET_CLIENT,
    RPCMethods.GET_LAST_BLOCK,
    RPCMethods.GET_MEMPOOL,
    RPCMethods.GET_NODES,
    RPCMethods.MINED_BLOCK_HASH,
    RPCMethods.GET_CONTRACT_SCHEMA
];

export const WRITE_METHODS = [
    RPCMethods.MINE,
    RPCMethods.MINT,
    RPCMethods.TRANSFER
];

export const CONTROL_METHODS = [
    RPCMethods.START,
    RPCMethods.STOP,
    RPCMethods.SHUTDOWN,
    RPCMethods.CREATE_CONTRACT_SCHEMA
];
