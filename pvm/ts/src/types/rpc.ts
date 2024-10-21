// RPC Class
export type RPCRequest = {
    id: bigint;
    method: RPCMethods;
    params: RPCRequestParams[RPCMethods];
    data: string;
};

export type RPCResponse = {
    id: bigint;
    result: string;
    error?: string;
};

export enum RPCMethods {
    GET_ACCOUNT = "get_account",
    MINT = "mint",
    TRANSFER = "transfer",
    GET_BLOCK = "get_block",
    GET_LAST_BLOCK = "get_last_block",
}

export type RPCRequestParams = {
    [RPCMethods.GET_ACCOUNT]: [string]; // [address]
    [RPCMethods.MINT]: [string, bigint]; // [address, amount]
    [RPCMethods.TRANSFER]: [string, string, bigint]; // [from, to, amount]
    [RPCMethods.GET_BLOCK]: [bigint]; // [index]
    [RPCMethods.GET_LAST_BLOCK]: []; // No parameters
}
