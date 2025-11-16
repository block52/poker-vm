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

    const menuItems: MenuItem[] = [
        { path: "/wallet", label: "Block52 Wallet", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
        { path: "/explorer", label: "Block Explorer", icon: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14", badge: "50" },
        { path: "/bridge/manual", label: "Manual Bridge", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
        { path: "/test-signing", label: "Test Signing", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
        {
            path: "/bridge/admin",
            label: "Bridge Admin",
            icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        },
        {
            path: "/table/admin",
            label: "Table Admin",
            icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
        }
    ];

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
                <div className="flex items-center justify-between">
                    {/* Left side - Logo/Title */}
                    <div className="flex items-center gap-6">
                        <Link to="/" className="text-xl font-bold hover:opacity-80 transition-opacity" style={{ color: colors.brand.primary }}>
                            {import.meta.env.VITE_CLUB_NAME || "Block 52"}
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
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

                    {/* Right side - Network Selector & Mobile Menu */}
                    <div className="flex items-center gap-4">
                        {/* Block Height Indicator */}
                        {latestBlockHeight && (
                            <div
                                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg"
                                style={{ backgroundColor: hexToRgba(colors.ui.bgDark, 0.6) }}
                            >
                                <div className={`w-2 h-2 rounded-full animate-pulse ${hasError ? "bg-red-400" : "bg-green-400"}`}></div>
                                <span className="text-sm font-mono" style={{ color: colors.ui.textSecondary }}>
                                    #{latestBlockHeight}
                                </span>
                            </div>
                        )}

                        <NetworkSelector />

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 rounded-lg hover:opacity-80 transition-opacity"
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
