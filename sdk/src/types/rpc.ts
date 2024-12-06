export interface ISignedResponse<T> {
    data: T;
    signature: string;
}

// RPC Class
export type RPCRequest = {
    id: string;
    method: RPCMethods;
    params: RPCRequestParams[RPCMethods];
};

export type RPCResponse<T> = {
    id: string;
    result: ISignedResponse<T>;
    error?: string;
};

export enum RPCMethods {
    BURN = "burn",
    CREATE_ACCOUNT = "create_account",
    CREATE_CONTRACT_SCHEMA = "create_contract_schema",
    GET_ACCOUNT = "get_account",
    GET_BALANCE = "get_balance",
    GET_BLOCK = "get_block",
    GET_BLOCKS = "get_blocks",
    GET_CLIENT = "get_client",
    GET_CONTRACT_SCHEMA = "get_contract_schema",
    GET_LAST_BLOCK = "get_last_block",
    GET_MEMPOOL = "get_mempool",
    GET_NODES = "get_nodes",
    GET_TRANSACTIONS = "get_transactions",
    GET_GAME_STATE = "get_game_state",
    MINE = "mine",
    MINED_BLOCK_HASH = "mined_block_hash",
    MINT = "mint",
    SHUTDOWN = "shutdown",
    START = "start",
    STOP = "stop",
    TRANSFER = "transfer"
}

export type RPCRequestParams = {
    [RPCMethods.BURN]: [string, string, string]; // [burnFrom(privateKey), amount, bridgeTo(address)]
    [RPCMethods.CREATE_ACCOUNT]: [string]; // private key
    [RPCMethods.CREATE_CONTRACT_SCHEMA]: [string, string, any]; // [category, name, schema]
    [RPCMethods.GET_ACCOUNT]: [string]; // [address]
    [RPCMethods.GET_BALANCE]: [string]; // [address]
    [RPCMethods.GET_BLOCK]: [string]; // [index]
    [RPCMethods.GET_BLOCKS]: [string]; // [count]
    [RPCMethods.GET_CLIENT]: []; // No parameters
    [RPCMethods.GET_CONTRACT_SCHEMA]: [string]; // [hash]
    [RPCMethods.GET_LAST_BLOCK]: []; // No parameters
    [RPCMethods.GET_MEMPOOL]: []; // No parameters
    [RPCMethods.GET_NODES]: []; // No parameters
    [RPCMethods.GET_TRANSACTIONS]: [string]; // [count]
    [RPCMethods.GET_GAME_STATE]: [string]; // [address]
    [RPCMethods.MINE]: []; // No parameters
    [RPCMethods.MINT]: [string]; // [depositIndex]
    [RPCMethods.MINED_BLOCK_HASH]: [string]; // [blockHash]
    [RPCMethods.START]: []; // No parameters
    [RPCMethods.STOP]: []; // No parameters
    [RPCMethods.TRANSFER]: [string, string, string, string | null]; // [from, to, amount, data]
    [RPCMethods.SHUTDOWN]: [string, string]; // [username, password]
    [RPCMethods.CREATE_CONTRACT_SCHEMA]: [string, string, any]; // [category, name, schema]
};
