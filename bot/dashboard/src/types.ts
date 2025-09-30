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

export interface LogEntry {
    timestamp: string;
    level: "debug" | "info" | "warn" | "error";
    message: string;
    data?: any;
    component?: string;
    userId?: string;
    gameId?: string;
}

export interface LogsResponse {
    logs: LogEntry[];
    count: number;
    limit: number;
}
