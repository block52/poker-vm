// RPC Class
export type RPCRequest = {
    id: number;
    method: string;
    params?: any[];
    data?: any;
};

export type RPCResponse = {
    id: number;
    result: string;
    error?: string;
};
