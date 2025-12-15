import React from "react";
import { ChatMessage as ChatMessageType } from "../../hooks/useTelegramChat";

interface ChatMessageProps {
    message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const getInitials = (firstName: string, lastName?: string) => {
        const first = firstName?.charAt(0) || "";
        const last = lastName?.charAt(0) || "";
        return (first + last).toUpperCase() || "?";
    };

    const getAvatarColor = (id: number) => {
        const colors = [
            "bg-blue-500",
            "bg-green-500",
            "bg-yellow-500",
            "bg-purple-500",
            "bg-pink-500",
            "bg-indigo-500",
            "bg-red-500",
            "bg-orange-500"
        ];
        return colors[Math.abs(id) % colors.length];
    };

    const displayName = message.sender.username
        ? `@${message.sender.username}`
        : `${message.sender.firstName}${message.sender.lastName ? ` ${message.sender.lastName}` : ""}`;

    return (
        <div className="flex items-start gap-3 py-2 px-3 hover:bg-gray-700/30 transition-colors rounded">
            {/* Avatar */}
            <div
                className={`flex-shrink-0 w-8 h-8 rounded-full ${getAvatarColor(message.sender.id)} flex items-center justify-center text-white text-xs font-semibold`}
            >
                {getInitials(message.sender.firstName, message.sender.lastName ?? undefined)}
            </div>

            {/* Message content */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-baseline gap-2">
                    <span className="font-medium text-gray-200 text-sm truncate">{displayName}</span>
                    <span className="text-gray-500 text-xs flex-shrink-0">{formatTime(message.timestamp)}</span>
                </div>

                {/* Message text */}
                {message.text && <p className="text-gray-300 text-sm mt-0.5 break-words whitespace-pre-wrap">{message.text}</p>}

                {/* Media indicator */}
                {message.mediaType && (
                    <div className="mt-1 flex items-center gap-1 text-gray-400 text-xs">
                        {message.mediaType === "photo" && (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <span>Photo</span>
                            </>
                        )}
                        {message.mediaType === "video" && (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                </svg>
                                <span>Video</span>
                            </>
                        )}
                        {message.mediaType === "document" && (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <span>Document</span>
                            </>
                        )}
                        {message.mediaType === "sticker" && <span className="text-lg">{message.text || "Sticker"}</span>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
