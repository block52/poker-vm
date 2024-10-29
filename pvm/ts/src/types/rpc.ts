export enum RPCMethods {
    CREATE_CONTRACT_SCHEMA = "create_contract_schema",
    GET_ACCOUNT = "get_account",
    GET_TRANSACTIONS = "get_transactions",
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
    TRANSFER = "transfer",
    GET_BLOCKS = "get_blocks"
}

export type RPCRequestParams = {
    [RPCMethods.GET_ACCOUNT]: [string]; // [address]
    [RPCMethods.GET_BLOCK]: [string]; // [index]
    [RPCMethods.GET_BLOCKS]: [string]; // [count]
    [RPCMethods.GET_CLIENT]: []; // No parameters
    [RPCMethods.GET_CONTRACT_SCHEMA]: [string]; // [hash]
    [RPCMethods.GET_LAST_BLOCK]: []; // No parameters
    [RPCMethods.GET_MEMPOOL]: []; // No parameters
    [RPCMethods.GET_NODES]: []; // No parameters
    [RPCMethods.GET_TRANSACTIONS]: [string]; // [count]
    [RPCMethods.MINE]: []; // No parameters
    [RPCMethods.MINT]: [string, string, string]; // [address, amount, transactionId]
    [RPCMethods.MINED_BLOCK_HASH]: [string]; // [blockHash]
    [RPCMethods.START]: []; // No parameters
    [RPCMethods.STOP]: []; // No parameters
    [RPCMethods.TRANSFER]: [string, string, string]; // [from, to, amount]
    [RPCMethods.SHUTDOWN]: [string, string]; // [username, password]
    [RPCMethods.CREATE_CONTRACT_SCHEMA]: [string, string, any]; // [category, name, schema]
};

export const READ_METHODS = [
    RPCMethods.GET_ACCOUNT,
    RPCMethods.GET_BLOCK,
    RPCMethods.GET_BLOCKS,
    RPCMethods.GET_CLIENT,
    RPCMethods.GET_LAST_BLOCK,
    RPCMethods.GET_MEMPOOL,
    RPCMethods.GET_TRANSACTIONS,
    RPCMethods.GET_NODES,
    RPCMethods.MINED_BLOCK_HASH,
    RPCMethods.GET_CONTRACT_SCHEMA,
];

export const WRITE_METHODS = [
    RPCMethods.CREATE_CONTRACT_SCHEMA,
    RPCMethods.MINE,
    RPCMethods.MINT,
    RPCMethods.TRANSFER,
];

export const CONTROL_METHODS = [
    RPCMethods.START,
    RPCMethods.STOP,
    RPCMethods.SHUTDOWN,
];
