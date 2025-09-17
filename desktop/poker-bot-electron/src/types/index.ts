export interface Bot {
    id: string;
    name: string;
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface CreateBotRequest {
    name: string;
}

export interface UpdateBotRequest {
    id: string;
    name?: string;
    status?: 'active' | 'inactive';
}