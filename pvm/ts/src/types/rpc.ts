// RPC Class
export type RPCRequest = {
    id: number;
    method: string;
    params?: any[];
};

export type RPCResponse = {
    result?: any;
    error?: string;
};
