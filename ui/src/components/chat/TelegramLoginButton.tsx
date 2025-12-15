import React, { useEffect, useRef } from "react";

interface TelegramLoginButtonProps {
    botUsername: string;
    onAuth: (user: TelegramAuthResponse) => void;
    buttonSize?: "large" | "medium" | "small";
    cornerRadius?: number;
    showUserPhoto?: boolean;
    requestAccess?: "write";
}

export interface TelegramAuthResponse {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}

declare global {
    interface Window {
        TelegramLoginWidget: {
            dataOnauth: (user: TelegramAuthResponse) => void;
        };
    }
}

const TelegramLoginButton: React.FC<TelegramLoginButtonProps> = ({
    botUsername,
    onAuth,
    buttonSize = "large",
    cornerRadius = 8,
    showUserPhoto = true,
    requestAccess
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Set up the global callback
        window.TelegramLoginWidget = {
            dataOnauth: (user: TelegramAuthResponse) => {
                onAuth(user);
            }
        };

        // Create and load the Telegram script
        const script = document.createElement("script");
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.setAttribute("data-telegram-login", botUsername);
        script.setAttribute("data-size", buttonSize);
        script.setAttribute("data-radius", cornerRadius.toString());
        script.setAttribute("data-onauth", "TelegramLoginWidget.dataOnauth(user)");
        script.setAttribute("data-request-access", requestAccess || "write");

        if (!showUserPhoto) {
            script.setAttribute("data-userpic", "false");
        }

        script.async = true;

        if (containerRef.current) {
            // Clear any existing content
            containerRef.current.innerHTML = "";
            containerRef.current.appendChild(script);
        }

        return () => {
            // Cleanup
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        };
    }, [botUsername, buttonSize, cornerRadius, showUserPhoto, requestAccess, onAuth]);

    return <div ref={containerRef} className="telegram-login-button" />;
};

export default TelegramLoginButton;
