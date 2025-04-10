export interface ISignedResponse<T> {
    data: T;
    signature: string;
}

// RPC Class
export type RPCRequest = {
    id: string;
    method: RPCMethods;
    params: RPCRequestParams[RPCMethods];
    data?: string;
};

export type RPCResponse<T> = {
    id: string;
    result: ISignedResponse<T>;
    error?: string;
};

export enum RPCMethods {
    BLOCK = "block",
    BURN = "burn",
    CREATE_ACCOUNT = "create_account",
    CREATE_CONTRACT_SCHEMA = "create_contract_schema",
    DEPLOY_CONTRACT = "deploy_contract",
    GET_ACCOUNT = "get_account",
    GET_BALANCE = "get_balance",
    GET_BLOCK = "get_block",
    GET_BLOCK_BY_HASH = "get_block_by_hash",
    GET_BLOCK_HEIGHT = "get_block_height",
    GET_BLOCKS = "get_blocks",
    GET_CLIENT = "get_client",
    GET_CONTRACT_SCHEMA = "get_contract_schema",
    GET_GAME_STATE = "get_game_state",
    GET_LAST_BLOCK = "get_last_block",
    GET_MEMPOOL = "get_mempool",
    GET_NODES = "get_nodes",
    GET_SHARED_SECRET = "get_shared_secret",
    GET_TRANSACTION = "get_transaction",
    GET_TRANSACTIONS = "get_transactions",
    MINE = "mine",
    MINED_BLOCK_HASH = "mined_block_hash",
    MINT = "mint",
    PERFORM_ACTION = "perform_action",
    PURGE = "purge",
    RESET_BLOCKCHAIN = "reset_blockchain",
    SHUTDOWN = "shutdown",
    START = "start",
    STOP = "stop",
    TRANSFER = "transfer",
}

export type RPCRequestParams = {
    [RPCMethods.BLOCK]: [string, string]; // [hash, block]
    [RPCMethods.BURN]: [string, string, string]; // [burnFrom(privateKey), amount, bridgeTo(address)]
    [RPCMethods.CREATE_ACCOUNT]: [string]; // private key
    [RPCMethods.CREATE_CONTRACT_SCHEMA]: [string, string, any]; // [category, name, schema]
    [RPCMethods.DEPLOY_CONTRACT]: [string, string, string]; // [nonce, owner, data]
    [RPCMethods.GET_ACCOUNT]: [string]; // [address]
    [RPCMethods.GET_BALANCE]: [string]; // [address]
    [RPCMethods.GET_BLOCK_BY_HASH]: [string]; // [hash]
    [RPCMethods.GET_BLOCK_HEIGHT]: []; // No parameters
    [RPCMethods.GET_BLOCK]: [string]; // [index]
    [RPCMethods.GET_BLOCKS]: [string]; // [count]
    [RPCMethods.GET_CLIENT]: []; // No parameters
    [RPCMethods.GET_CONTRACT_SCHEMA]: [string]; // [hash]
    [RPCMethods.GET_GAME_STATE]: [string]; // [address]
    [RPCMethods.GET_LAST_BLOCK]: []; // No parameters
    [RPCMethods.GET_MEMPOOL]: []; // No parameters
    [RPCMethods.GET_NODES]: []; // No parameters
    [RPCMethods.GET_SHARED_SECRET]: [string]; // [publicKey]
    [RPCMethods.GET_TRANSACTION]: [string]; // [hash]
    [RPCMethods.GET_TRANSACTIONS]: [string]; // [count]
    [RPCMethods.MINE]: []; // No parameters
    [RPCMethods.MINED_BLOCK_HASH]: [string, string]; // [blockHash, nodeUrl]
    [RPCMethods.MINT]: [string]; // [depositIndex]
    [RPCMethods.PERFORM_ACTION]: [string, string, string, string | null, number, string | null]; // [from, to, action, amount, nonce, data]
    [RPCMethods.PURGE]: [string, string]; // [username, password]
    [RPCMethods.RESET_BLOCKCHAIN]: [string, string]; // [username, password]
    [RPCMethods.SHUTDOWN]: [string, string]; // [username, password]
    [RPCMethods.START]: []; // No parameters
    [RPCMethods.STOP]: []; // No parameters
    [RPCMethods.TRANSFER]: [string, string, string, number, string | null]; // [from, to, amount, nonce, data]
};
