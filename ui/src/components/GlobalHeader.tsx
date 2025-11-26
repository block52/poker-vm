import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { NetworkSelector } from "./NetworkSelector";
import { colors, hexToRgba } from "../utils/colorConfig";
import { useNetwork } from "../context/NetworkContext";
import { getCosmosClient } from "../utils/cosmos/client";

interface MenuItem {
    path: string;
    label: string;
    icon: string;
    badge?: string;
}

// Reusable component for network status and selector (extracted to avoid recreation on every render)
const NetworkStatusAndSelector: React.FC<{ latestBlockHeight: string | null; hasError: boolean }> = ({ latestBlockHeight, hasError }) => (
    <>
        {/* Block Height Indicator */}
        {latestBlockHeight && (
            <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: hexToRgba(colors.ui.bgDark, 0.6) }}
            >
                <div className={`w-2 h-2 rounded-full animate-pulse ${hasError ? "bg-red-400" : "bg-green-400"}`}></div>
                <span className="text-sm font-mono" style={{ color: colors.ui.textSecondary }}>
                    #{latestBlockHeight}
                </span>
            </div>
        )}

        <NetworkSelector />
    </>
);

export const GlobalHeader: React.FC = () => {
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { currentNetwork } = useNetwork();
    const [latestBlockHeight, setLatestBlockHeight] = useState<string | null>(null);
    const [hasError, setHasError] = useState(false);

    // Fetch latest block height
    useEffect(() => {
        const fetchBlockHeight = async () => {
            try {
                const cosmosClient = getCosmosClient({
                    rpc: currentNetwork.rpc,
                    rest: currentNetwork.rest
                });

                if (!cosmosClient) return;

                const blocks = await cosmosClient.getLatestBlocks(1);
                if (blocks.length > 0) {
                    setLatestBlockHeight(blocks[0].block.header.height);
                    setHasError(false);
                }
            } catch (error) {
                console.debug("Failed to fetch block height:", error);
                setHasError(true);
            }
        };

        fetchBlockHeight();
        const interval = setInterval(fetchBlockHeight, 10000); // Update every 10 seconds

        return () => clearInterval(interval);
    }, [currentNetwork]);

    // Don't show header on game table pages (they have their own layout)
    // But DO show it on /table/admin
    const hideOnPaths = ["/table/"];
    const shouldHide = hideOnPaths.some(path => location.pathname.startsWith(path)) && location.pathname !== "/table/admin";

    if (shouldHide) {
        return null;
    }

    // Check if we're in development mode
    const isDevelopment = import.meta.env.VITE_NODE_ENV === "development";

    // User-facing menu items (always visible)
    const userMenuItems: MenuItem[] = [
        { path: "/wallet", label: "Block52 Wallet", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
        { path: "/bridge/withdrawals", label: "Withdrawals", icon: "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" },
        { path: "/explorer", label: "Block Explorer", icon: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" }
    ];

    // Admin/dev menu items (only in development mode)
    const adminMenuItems: MenuItem[] = [
        { path: "/admin", label: "Admin", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }
    ];

    // Combine menu items based on environment
    const menuItems: MenuItem[] = isDevelopment
        ? [...userMenuItems, ...adminMenuItems]
        : userMenuItems;

    return (
        <header
            className="sticky top-0 z-40 w-full"
            style={{
                backgroundColor: hexToRgba(colors.ui.bgDark, 0.95),
                borderBottom: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`,
                backdropFilter: "blur(10px)"
            }}
        >
            <div className="container mx-auto px-4 py-3">
                {/* Desktop Layout: Centered navigation group with right-aligned NetworkSelector */}
                <div className="hidden lg:flex items-center justify-center relative">
                    {/* Centered Navigation Group - max-w prevents overlap with right-aligned content */}
                    <div className="flex items-center gap-6 max-w-[calc(100%-300px)]">
                        <Link to="/" className="text-xl font-bold hover:opacity-80 transition-opacity" style={{ color: colors.brand.primary }}>
                            {import.meta.env.VITE_CLUB_NAME || "Block 52"}
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="flex items-center gap-1">
                            {menuItems.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-80 flex items-center gap-1.5"
                                    style={{
                                        color: location.pathname === item.path ? colors.brand.primary : colors.ui.textSecondary,
                                        backgroundColor: location.pathname === item.path ? hexToRgba(colors.brand.primary, 0.1) : "transparent"
                                    }}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                    </svg>
                                    {item.label}
                                    {item.badge && (
                                        <span
                                            className="ml-1 px-1.5 py-0.5 rounded text-xs font-semibold"
                                            style={{
                                                backgroundColor: hexToRgba(colors.brand.primary, 0.2),
                                                color: colors.brand.primary
                                            }}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Right-aligned Network Selector - positioned absolutely */}
                    <div className="absolute right-0 flex items-center gap-4">
                        <NetworkStatusAndSelector latestBlockHeight={latestBlockHeight} hasError={hasError} />
                    </div>
                </div>

                {/* Mobile/Tablet Layout: Keep original structure */}
                <div className="flex lg:hidden items-center justify-between">
                    {/* Left side - Logo/Title */}
                    <Link to="/" className="text-xl font-bold hover:opacity-80 transition-opacity" style={{ color: colors.brand.primary }}>
                        {import.meta.env.VITE_CLUB_NAME || "Block 52"}
                    </Link>

                    {/* Right side - Network Selector & Mobile Menu */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-4">
                            <NetworkStatusAndSelector latestBlockHeight={latestBlockHeight} hasError={hasError} />
                        </div>
                        <div className="md:hidden">
                            <NetworkSelector />
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-lg hover:opacity-80 transition-opacity"
                            style={{ color: colors.brand.primary }}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMenuOpen && (
                    <nav className="lg:hidden mt-4 pb-2 border-t pt-4" style={{ borderColor: hexToRgba(colors.brand.primary, 0.2) }}>
                        <div className="flex flex-col gap-2">
                            {menuItems.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-80 flex items-center gap-2"
                                    style={{
                                        color: location.pathname === item.path ? colors.brand.primary : colors.ui.textSecondary,
                                        backgroundColor: location.pathname === item.path ? hexToRgba(colors.brand.primary, 0.1) : "transparent"
                                    }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                    </svg>
                                    {item.label}
                                    {item.badge && (
                                        <span
                                            className="ml-auto px-2 py-0.5 rounded text-xs font-semibold"
                                            style={{
                                                backgroundColor: hexToRgba(colors.brand.primary, 0.2),
                                                color: colors.brand.primary
                                            }}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
};
