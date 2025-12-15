import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTelegramChat } from "../hooks/useTelegramChat";
import { useTelegramAuth, TelegramUser } from "../hooks/useTelegramAuth";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";
import TelegramLoginButton, { TelegramAuthResponse } from "../components/chat/TelegramLoginButton";
import { colors, getAnimationGradient, hexToRgba } from "../utils/colorConfig";

const CHAT_API_URL = import.meta.env.VITE_TELEGRAM_CHAT_API_URL || "http://localhost:8080";
const TELEGRAM_CHANNEL_URL = import.meta.env.VITE_TELEGRAM_CHANNEL_URL || "https://t.me/block52poker";

const ChatPage: React.FC = () => {
    const navigate = useNavigate();
    const { messages, isConnected, isConnecting, error: chatError, connect } = useTelegramChat();
    const { user, isAuthenticated, isLoading: authLoading, login, logout, botUsername } = useTelegramAuth();

    // Background styles (matching other pages)
    const backgroundStyle1 = useMemo(
        () => ({
            backgroundImage: getAnimationGradient(50, 50),
            backgroundColor: colors.table.bgBase,
            filter: "blur(40px)",
            transition: "all 0.3s ease-out"
        }),
        []
    );

    const backgroundStyle2 = useMemo(
        () => ({
            backgroundImage: `
            repeating-linear-gradient(
                45deg,
                ${hexToRgba(colors.animation.color2, 0.1)} 0%,
                ${hexToRgba(colors.animation.color1, 0.1)} 25%,
                ${hexToRgba(colors.animation.color4, 0.1)} 50%,
                ${hexToRgba(colors.animation.color5, 0.1)} 75%,
                ${hexToRgba(colors.animation.color2, 0.1)} 100%
            )
        `,
            backgroundSize: "400% 400%",
            animation: "gradient 15s ease infinite"
        }),
        []
    );

    const handleGoBack = () => {
        navigate("/");
    };

    const handleOpenTelegram = () => {
        window.open(TELEGRAM_CHANNEL_URL, "_blank");
    };

    const handleTelegramAuth = useCallback(
        async (authData: TelegramAuthResponse) => {
            try {
                await login(authData);
            } catch (err) {
                console.error("Login failed:", err);
            }
        },
        [login]
    );

    const handleSendMessage = useCallback(
        async (text: string) => {
            if (!user) return;

            const response = await fetch(`${CHAT_API_URL}/api/chat/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text,
                    userId: user.id
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to send message");
            }
        },
        [user]
    );

    const getInitials = (user: TelegramUser) => {
        const first = user.firstName?.charAt(0) || "";
        const last = user.lastName?.charAt(0) || "";
        return (first + last).toUpperCase() || "?";
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-white relative px-4 py-8 overflow-hidden">
            {/* Animated background layers */}
            <div className="fixed inset-0 z-0" style={backgroundStyle1} />
            <div className="fixed inset-0 z-0 opacity-20" style={backgroundStyle2} />

            {/* Back button */}
            <button
                type="button"
                className="absolute top-8 left-8 flex items-center gap-2 py-2 px-4 text-sm font-semibold text-gray-300 hover:text-white transition-colors z-10"
                onClick={handleGoBack}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back
            </button>

            {/* Main chat container */}
            <div className="w-full max-w-2xl h-[700px] bg-gray-800 rounded-lg border border-gray-700 overflow-hidden z-10 flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.67-.52.36-1-.54-1.55-.52-.54.02-1.53-.3-2.28-.55-.93-.31-1.66-.47-1.6-.99.03-.27.38-.55 1.04-.83 4.09-1.78 6.82-2.96 8.19-3.53 3.9-1.62 4.71-1.9 5.24-1.91.12 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .38z" />
                            </svg>
                            Community Chat
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Chat with the Block52 community</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Connection status */}
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : isConnecting ? "bg-yellow-500 animate-pulse" : "bg-red-500"}`}
                            />
                            <span className="text-xs text-gray-400">{isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}</span>
                        </div>

                        {/* Open in Telegram button */}
                        <button
                            type="button"
                            onClick={handleOpenTelegram}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-sm transition-colors"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.67-.52.36-1-.54-1.55-.52-.54.02-1.53-.3-2.28-.55-.93-.31-1.66-.47-1.6-.99.03-.27.38-.55 1.04-.83 4.09-1.78 6.82-2.96 8.19-3.53 3.9-1.62 4.71-1.9 5.24-1.91.12 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .38z" />
                            </svg>
                            Open in Telegram
                        </button>
                    </div>
                </div>

                {/* Error banner */}
                {chatError && (
                    <div className="px-4 py-2 bg-red-500/20 border-b border-red-500/30 flex items-center justify-between">
                        <span className="text-red-400 text-sm">{chatError}</span>
                        <button type="button" onClick={connect} className="text-red-400 hover:text-red-300 text-sm underline">
                            Retry
                        </button>
                    </div>
                )}

                {/* Chat messages */}
                <ChatWindow messages={messages} isLoading={isConnecting && messages.length === 0} />

                {/* Footer with auth/input */}
                <div className="px-4 py-3 bg-gray-900 border-t border-gray-700">
                    {authLoading ? (
                        <div className="flex items-center justify-center py-2">
                            <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                    ) : isAuthenticated && user ? (
                        <div className="space-y-3">
                            {/* User info bar */}
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    {user.photoUrl ? (
                                        <img src={user.photoUrl} alt={user.firstName} className="w-6 h-6 rounded-full" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                                            {getInitials(user)}
                                        </div>
                                    )}
                                    <span className="text-gray-300">
                                        Chatting as <span className="text-white font-medium">{user.username ? `@${user.username}` : user.firstName}</span>
                                    </span>
                                </div>
                                <button type="button" onClick={logout} className="text-gray-500 hover:text-gray-300 transition-colors">
                                    Logout
                                </button>
                            </div>

                            {/* Message input */}
                            <ChatInput onSend={handleSendMessage} disabled={!isConnected} placeholder={isConnected ? "Type a message..." : "Connecting..."} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-2">
                            <p className="text-gray-400 text-sm">Login with Telegram to join the conversation</p>
                            {botUsername ? (
                                <TelegramLoginButton botUsername={botUsername} onAuth={handleTelegramAuth} buttonSize="large" cornerRadius={8} />
                            ) : (
                                <p className="text-gray-500 text-xs">Loading login widget...</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
