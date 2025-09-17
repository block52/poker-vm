import axios, { AxiosResponse } from "axios";
import type { Bot, ApiError } from "../types";

// Configure axios with base URL and CORS headers
const api = axios.create({
    baseURL: "http://localhost:8080",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
    },
    // Add CORS configuration
    withCredentials: false
});

// Request interceptor
api.interceptors.request.use(
    config => {
        console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    error => {
        const apiError: ApiError = {
            message: error.response?.data?.message || error.message || "An error occurred",
            status: error.response?.status
        };
        return Promise.reject(apiError);
    }
);

export class BotService {
    /**
     * Fetch all bots from the API
     */
    static async getBots(): Promise<Bot[]> {
        try {
            const response = await api.get<Bot[]>("/bots");
            return response.data;
        } catch (error) {
            console.error("Error fetching bots:", error);
            throw error;
        }
    }

    /**
     * Get a specific bot by address
     */
    static async getBotByAddress(address: string): Promise<Bot> {
        try {
            const response = await api.get<Bot>(`/bots/${address}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching bot ${address}:`, error);
            throw error;
        }
    }

    /**
     * Update bot enabled status
     */
    static async updateBotStatus(address: string, enabled: boolean): Promise<Bot> {
        try {
            const response = await api.patch<Bot>(`/bots/${address}`, { enabled });
            return response.data;
        } catch (error) {
            console.error(`Error updating bot ${address}:`, error);
            throw error;
        }
    }
}

export default api;
