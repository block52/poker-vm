import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createThirdwebClient } from "thirdweb";
import { PayEmbed } from "thirdweb/react";
import { base } from "thirdweb/chains";
import { colors, getAnimationGradient, hexToRgba } from "../utils/colorConfig";
import { useCosmosWallet } from "../hooks";
import { BASE_USDC_ADDRESS, COSMOS_BRIDGE_ADDRESS } from "../config/constants";

// Create thirdweb client - you'll need to add your client ID to env
const THIRDWEB_CLIENT_ID = import.meta.env.VITE_THIRDWEB_CLIENT_ID;

const BuyPage: React.FC = () => {
    const navigate = useNavigate();
    const cosmosWallet = useCosmosWallet();

    // Mouse position for animated background
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const animationFrameRef = useRef<number | undefined>(undefined);

    // Mouse movement handler - throttled
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!animationFrameRef.current) {
            animationFrameRef.current = requestAnimationFrame(() => {
                const x = Math.round((e.clientX / window.innerWidth) * 100);
                const y = Math.round((e.clientY / window.innerHeight) * 100);
                setMousePosition(prev => {
                    if (Math.abs(prev.x - x) > 2 || Math.abs(prev.y - y) > 2) {
                        return { x, y };
                    }
                    return prev;
                });
                animationFrameRef.current = undefined;
            });
        }
    }, []);

    // Set up mouse tracking
    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [handleMouseMove]);

    // Animated background styles
    const backgroundStyle1 = useMemo(
        () => ({
            backgroundImage: getAnimationGradient(mousePosition.x, mousePosition.y),
            backgroundColor: colors.table.bgBase,
            filter: "blur(40px)",
            transition: "all 0.3s ease-out"
        }),
        [mousePosition.x, mousePosition.y]
    );

    const backgroundStyle2 = useMemo(
        () => ({
            backgroundImage: `
            repeating-linear-gradient(
                ${45 + mousePosition.x / 10}deg,
                ${hexToRgba(colors.animation.color2, 0.1)} 0%,
                ${hexToRgba(colors.animation.color1, 0.1)} 25%,
                ${hexToRgba(colors.animation.color4, 0.1)} 50%,
                ${hexToRgba(colors.animation.color5, 0.1)} 75%,
                ${hexToRgba(colors.animation.color2, 0.1)} 100%
            )
        `,
            backgroundSize: "400% 400%",
            animation: "gradient 15s ease infinite",
            transition: "background 0.5s ease"
        }),
        [mousePosition.x]
    );

    const backgroundStyle3 = useMemo(
        () => ({
            backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${hexToRgba(colors.brand.primary, 0.1)} 25%, rgba(0,0,0,0) 50%, ${hexToRgba(
                colors.brand.primary,
                0.1
            )} 75%, rgba(0,0,0,0) 100%)`,
            backgroundSize: "200% 100%",
            animation: "shimmer 8s infinite linear"
        }),
        []
    );

    const handleGoBack = () => {
        navigate("/");
    };

    // Create thirdweb client
    const client = useMemo(() => {
        if (!THIRDWEB_CLIENT_ID) return null;
        return createThirdwebClient({
            clientId: THIRDWEB_CLIENT_ID
        });
    }, []);

    if (!THIRDWEB_CLIENT_ID) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-white relative px-4 overflow-hidden">
                <div className="fixed inset-0 z-0" style={backgroundStyle1} />
                <div className="fixed inset-0 z-0 opacity-20" style={backgroundStyle2} />
                <div className="fixed inset-0 z-0 opacity-30" style={backgroundStyle3} />

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

                <div className="w-full max-w-md bg-gray-800 rounded-lg border border-gray-700 overflow-hidden z-10 p-6 text-center">
                    <h2 className="text-xl font-bold text-white mb-4">Configuration Required</h2>
                    <p className="text-gray-400">
                        Please set the <code className="bg-gray-900 px-2 py-1 rounded">VITE_THIRDWEB_CLIENT_ID</code> environment variable to enable payments.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-white relative px-4 overflow-hidden">
            {/* Animated background layers */}
            <div className="fixed inset-0 z-0" style={backgroundStyle1} />
            <div className="fixed inset-0 z-0 opacity-20" style={backgroundStyle2} />
            <div className="fixed inset-0 z-0 opacity-30" style={backgroundStyle3} />

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

            <div className="w-full max-w-md bg-gray-800 rounded-lg border border-gray-700 overflow-hidden z-10">
                {/* Header */}
                <div className="px-6 py-4 bg-gray-900 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Buy USDC</h2>
                    <p className="text-gray-400 text-sm mt-1">Purchase USDC with card or crypto</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Wallet Address Info */}
                    {cosmosWallet.address && (
                        <div className="mb-4 p-3 rounded-lg bg-gray-900 border border-gray-700">
                            <p className="text-gray-400 text-sm mb-1">Funds will be sent to:</p>
                            <p className="text-white font-mono text-sm break-all">{COSMOS_BRIDGE_ADDRESS}</p>
                            <p className="text-gray-500 text-xs mt-2">USDC on Base chain will be bridged to your game wallet</p>
                        </div>
                    )}

                    {/* Thirdweb PayEmbed */}
                    {client && (
                        <div className="rounded-lg overflow-hidden">
                            <PayEmbed
                                client={client}
                                payOptions={{
                                    mode: "fund_wallet",
                                    prefillBuy: {
                                        chain: base,
                                        token: {
                                            address: BASE_USDC_ADDRESS,
                                            name: "USDC",
                                            symbol: "USDC"
                                        },
                                        amount: "100"
                                    },
                                    metadata: {
                                        name: "Block 52 Deposit",
                                        description: "Deposit USDC to your Block 52 game wallet"
                                    }
                                }}
                                theme="dark"
                            />
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-gray-400">
                                Purchases are processed by Thirdweb. Card payments may require identity verification.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuyPage;
