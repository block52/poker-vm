export type RPCRequest = {
    id: string;
    method: string;
    params: any[];
    data?: string;
};

export type RPCResponse<T> = {
    id: string;
    result: T;
    error?: string;
};