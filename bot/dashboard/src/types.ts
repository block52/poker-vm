export interface Bot {
    address: string;
    privateKey: string;
    enabled: boolean;
    tableAddress: string;
    type: string;
}

export interface ApiResponse<T> {
    data: T;
    status: number;
    message?: string;
}

export interface ApiError {
    message: string;
    status?: number;
}