import { useState, useEffect, useCallback } from "react";

const CHAT_API_URL = import.meta.env.VITE_TELEGRAM_CHAT_API_URL || "http://localhost:8080";
const STORAGE_KEY = "telegram_auth_user";

export interface TelegramUser {
    id: number;
    firstName: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
}

interface TelegramAuthData {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}

interface UseTelegramAuthReturn {
    user: TelegramUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (authData: TelegramAuthData) => Promise<void>;
    logout: () => Promise<void>;
    botUsername: string | null;
}

export const useTelegramAuth = (): UseTelegramAuthReturn => {
    const [user, setUser] = useState<TelegramUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [botUsername, setBotUsername] = useState<string | null>(null);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem(STORAGE_KEY);
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
            } catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    // Fetch bot username for login widget
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch(`${CHAT_API_URL}/api/chat/config`);
                if (response.ok) {
                    const data = await response.json();
                    setBotUsername(data.botUsername || null);
                }
            } catch (err) {
                console.error("Failed to fetch chat config:", err);
            }
        };
        fetchConfig();
    }, []);

    const login = useCallback(async (authData: TelegramAuthData) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${CHAT_API_URL}/api/auth/telegram`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(authData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Authentication failed");
            }

            const telegramUser: TelegramUser = {
                id: data.user.id,
                firstName: data.user.firstName,
                lastName: data.user.lastName,
                username: data.user.username,
                photoUrl: data.user.photoUrl
            };

            setUser(telegramUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(telegramUser));
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Login failed";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        if (user) {
            try {
                await fetch(`${CHAT_API_URL}/api/auth/logout?userId=${user.id}`, {
                    method: "POST"
                });
            } catch {
                // Ignore logout errors
            }
        }

        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
    }, [user]);

    return {
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        botUsername
    };
};

export default useTelegramAuth;
