export interface ISignedResponse<T> {
    data: T;
    signature: string;
}

export type RPCRequest = {
    id: string;
    method: RPCMethods;
    params: RPCRequestParams[RPCMethods];
    data?: string;
    signature?: string;
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
    FIND_CONTRACT = "find_contract",
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
    NEW_HAND = "new",
    NEW_TABLE = "new_table",
    PERFORM_ACTION = "perform_action",
    PURGE = "purge",
    RESET_BLOCKCHAIN = "reset_blockchain",
    SHUTDOWN = "shutdown",
    START = "start",
    STOP = "stop",
    TRANSFER = "transfer",
}

export type RPCRequestParams = {
    [RPCMethods.BLOCK]: [string, string];
    [RPCMethods.BURN]: [string, string, string];
    [RPCMethods.CREATE_ACCOUNT]: [string];
    [RPCMethods.CREATE_CONTRACT_SCHEMA]: [string, string, any];
    [RPCMethods.DEPLOY_CONTRACT]: [string, string, string];
    [RPCMethods.FIND_CONTRACT]: [string];
    [RPCMethods.GET_ACCOUNT]: [string];
    [RPCMethods.GET_BALANCE]: [string];
    [RPCMethods.GET_BLOCK_BY_HASH]: [string];
    [RPCMethods.GET_BLOCK_HEIGHT]: [];
    [RPCMethods.GET_BLOCK]: [string];
    [RPCMethods.GET_BLOCKS]: [string];
    [RPCMethods.GET_CLIENT]: [];
    [RPCMethods.GET_CONTRACT_SCHEMA]: [string];
    [RPCMethods.GET_GAME_STATE]: [string, string];
    [RPCMethods.GET_LAST_BLOCK]: [];
    [RPCMethods.GET_MEMPOOL]: [];
    [RPCMethods.GET_NODES]: [];
    [RPCMethods.GET_SHARED_SECRET]: [string];
    [RPCMethods.GET_TRANSACTION]: [string];
    [RPCMethods.GET_TRANSACTIONS]: [string];
    [RPCMethods.MINE]: [];
    [RPCMethods.MINED_BLOCK_HASH]: [string, string];
    [RPCMethods.MINT]: [string];
    [RPCMethods.NEW_HAND]: [string, string, number, string];
    [RPCMethods.NEW_TABLE]: [string, string];
    [RPCMethods.PERFORM_ACTION]: [string, string, string, string | null, string, number, string];
    [RPCMethods.PURGE]: [string, string];
    [RPCMethods.RESET_BLOCKCHAIN]: [string, string];
    [RPCMethods.SHUTDOWN]: [string, string];
    [RPCMethods.START]: [];
    [RPCMethods.STOP]: [];
    [RPCMethods.TRANSFER]: [string, string, string, number, string | null];
}; 