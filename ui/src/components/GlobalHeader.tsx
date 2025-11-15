import React from "react";
import { useLocation, Link } from "react-router-dom";
import { NetworkSelector } from "./NetworkSelector";
import { colors, hexToRgba } from "../utils/colorConfig";

export const GlobalHeader: React.FC = () => {
    const location = useLocation();

    // Don't show header on table pages (they have their own layout)
    const hideOnPaths = ["/table/"];
    const shouldHide = hideOnPaths.some(path => location.pathname.startsWith(path));

    if (shouldHide) {
        return null;
    }

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
                    {/* Left side - Logo/Title (can be expanded later) */}
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-xl font-bold hover:opacity-80 transition-opacity" style={{ color: colors.brand.primary }}>
                            {import.meta.env.VITE_CLUB_NAME || "Block 52"}
                        </Link>
                    </div>

                    {/* Right side - Network Selector */}
                    <div className="flex items-center gap-4">
                        <NetworkSelector />
                    </div>
                </div>
            </div>
        </header>
    );
};
