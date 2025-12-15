import { useState, useEffect, useCallback, useRef } from "react";

export interface ChatMessage {
    id: string;
    text: string;
    sender: {
        id: number;
        username?: string;
        firstName: string;
        lastName?: string;
    };
    timestamp: number;
    replyTo?: string;
    mediaType?: "photo" | "video" | "document" | "sticker";
    mediaUrl?: string;
    createdAt: string;
}

interface WebSocketMessage {
    type: string;
    payload: unknown;
}

interface UseTelegramChatOptions {
    wsUrl?: string;
    autoConnect?: boolean;
}

interface UseTelegramChatReturn {
    messages: ChatMessage[];
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    connect: () => void;
    disconnect: () => void;
    clientCount?: number;
}

const DEFAULT_WS_URL = import.meta.env.VITE_TELEGRAM_CHAT_WS_URL || "ws://localhost:8080/ws";

export const useTelegramChat = (options: UseTelegramChatOptions = {}): UseTelegramChatReturn => {
    const { wsUrl = DEFAULT_WS_URL, autoConnect = true } = options;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;

    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const data: WebSocketMessage = JSON.parse(event.data);

            switch (data.type) {
                case "chat:connected":
                    console.log("Chat connected:", data.payload);
                    break;

                case "chat:history":
                    setMessages(data.payload as ChatMessage[]);
                    break;

                case "chat:message":
                    setMessages(prev => [...prev, data.payload as ChatMessage]);
                    break;

                case "chat:error":
                    setError(data.payload as string);
                    break;

                default:
                    console.log("Unknown message type:", data.type);
            }
        } catch (err) {
            console.error("Failed to parse WebSocket message:", err);
        }
    }, []);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log("WebSocket connected to chat server");
                setIsConnected(true);
                setIsConnecting(false);
                reconnectAttemptsRef.current = 0;
            };

            ws.onclose = (event) => {
                console.log("WebSocket closed:", event.code, event.reason);
                setIsConnected(false);
                setIsConnecting(false);
                wsRef.current = null;

                // Attempt to reconnect
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        connect();
                    }, delay);
                } else {
                    setError("Connection lost. Please refresh the page.");
                }
            };

            ws.onerror = (event) => {
                console.error("WebSocket error:", event);
                setError("Connection error");
            };

            ws.onmessage = handleMessage;

            wsRef.current = ws;
        } catch (err) {
            console.error("Failed to create WebSocket:", err);
            setIsConnecting(false);
            setError("Failed to connect to chat server");
        }
    }, [wsUrl, handleMessage]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnected(false);
        setIsConnecting(false);
        reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent auto-reconnect
    }, []);

    // Auto-connect on mount
    useEffect(() => {
        if (autoConnect) {
            connect();
        }

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [autoConnect, connect]);

    return {
        messages,
        isConnected,
        isConnecting,
        error,
        connect,
        disconnect
    };
};

export default useTelegramChat;
