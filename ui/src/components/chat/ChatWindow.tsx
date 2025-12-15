import React, { useEffect, useRef } from "react";
import { ChatMessage as ChatMessageType } from "../../hooks/useTelegramChat";
import ChatMessage from "./ChatMessage";

interface ChatWindowProps {
    messages: ChatMessageType[];
    isLoading?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const userScrolledRef = useRef(false);

    // Auto-scroll to bottom when new messages arrive (unless user has scrolled up)
    useEffect(() => {
        if (!userScrolledRef.current && scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Track if user has scrolled away from bottom
    const handleScroll = () => {
        if (containerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
            userScrolledRef.current = !isAtBottom;
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2 text-gray-400">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <span>Loading messages...</span>
                </div>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs text-gray-500 mt-1">Messages from the Telegram channel will appear here</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent" onScroll={handleScroll}>
            <div className="py-2">
                {messages.map(message => (
                    <ChatMessage key={message.id} message={message} />
                ))}
                <div ref={scrollRef} />
            </div>
        </div>
    );
};

export default ChatWindow;
