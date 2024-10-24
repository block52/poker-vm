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

export type Transaction = {
    to: string;
    from: string | null;
    value: string;
    signature: string;
    timestamp: string;
    index?: string;
    hash: string;
  }

export type Block = {
    index: number;
    hash: string;
    previousHash: string;
    timestamp: number;
    validator: string;
    transactions: Transaction[];
}