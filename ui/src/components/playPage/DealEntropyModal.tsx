import React, { useState, useMemo, useCallback, useEffect } from "react";
import { colors, getHexagonStroke } from "../../utils/colorConfig";
import { LoadingSpinner } from "../common";
import CryptoJS from "crypto-js";

// Static styles to avoid recreation
const STATIC_STYLES = {
    modal: {
        backgroundColor: colors.ui.bgDark,
        border: `1px solid ${colors.ui.borderColor}`
    },
    divider: {
        background: `linear-gradient(to right, transparent, ${colors.brand.primary}, transparent)`
    },
    input: {
        backgroundColor: colors.ui.bgMedium,
        border: `1px solid ${colors.ui.textSecondary}`
    },
    hashDisplay: {
        backgroundColor: colors.ui.bgMedium,
        border: `1px solid ${colors.ui.borderColor}`,
        fontFamily: "monospace"
    }
};

// Memoized hexagon pattern component
const HexagonPattern = React.memo(() => (
    <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="hexagons-deal" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(5)">
                    <path d="M25,3.4 L45,17 L45,43.4 L25,56.7 L5,43.4 L5,17 L25,3.4 z" stroke={getHexagonStroke()} strokeWidth="0.6" fill="none" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexagons-deal)" />
        </svg>
    </div>
));

interface DealEntropyModalProps {
    tableId?: string;
    onClose: () => void;
    onDeal: (entropy: string) => Promise<void>;
}

/**
 * Generates a random hex string using crypto.getRandomValues
 */
function generateSystemEntropy(): string {
    const array = new Uint8Array(32); // 256 bits
    crypto.getRandomValues(array);
    return "0x" + Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Hashes a string using SHA-256
 */
function hashString(input: string): string {
    return "0x" + CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
}

/**
 * Combines system entropy with user password hash
 */
function combineEntropy(systemEntropy: string, passwordHash: string): string {
    // Remove 0x prefix for concatenation
    const combined = systemEntropy.slice(2) + passwordHash.slice(2);
    return "0x" + CryptoJS.SHA256(combined).toString(CryptoJS.enc.Hex);
}

/**
 * Truncates a hex string for display (shows first and last few chars)
 */
function truncateHash(hash: string, chars: number = 12): string {
    if (hash.length <= chars * 2 + 4) return hash;
    return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

const DealEntropyModal: React.FC<DealEntropyModalProps> = React.memo(({ tableId, onClose, onDeal }) => {
    const [password, setPassword] = useState("");
    const [isDealing, setIsDealing] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Generate system entropy once on mount
    const [systemEntropy] = useState(() => generateSystemEntropy());

    // Compute password hash when password changes
    const passwordHash = useMemo(() => {
        if (!password) return "";
        return hashString(password);
    }, [password]);

    // Compute final entropy (combined)
    const finalEntropy = useMemo(() => {
        if (!passwordHash) return systemEntropy;
        return combineEntropy(systemEntropy, passwordHash);
    }, [systemEntropy, passwordHash]);

    // Handle input focus styling
    const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.style.borderColor = colors.brand.primary;
    }, []);

    const handleInputBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.style.borderColor = colors.ui.textSecondary;
    }, []);

    // Handle deal button click
    const handleDealClick = useCallback(async () => {
        if (!tableId) {
            setError("No table ID provided");
            return;
        }

        try {
            setIsDealing(true);
            setError("");
            await onDeal(finalEntropy);
            onClose();
        } catch (err: any) {
            console.error("Failed to deal:", err);
            setError(err.message || "Failed to deal cards");
        } finally {
            setIsDealing(false);
        }
    }, [tableId, finalEntropy, onDeal, onClose]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "Enter" && !isDealing) {
                handleDealClick();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, handleDealClick, isDealing]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative p-6 rounded-xl shadow-2xl w-[440px] max-w-[95vw] overflow-hidden" style={STATIC_STYLES.modal}>
                {/* Hexagon pattern background */}
                <HexagonPattern />

                {/* Decorative card suits */}
                <div className="absolute -right-8 -top-8 text-6xl opacity-10 rotate-12">♠</div>
                <div className="absolute -left-8 -bottom-8 text-6xl opacity-10 -rotate-12">♥</div>

                {/* Header */}
                <h2 className="text-xl font-bold mb-3 text-white flex items-center">
                    <span style={{ color: colors.brand.primary }} className="mr-2">♣</span>
                    Deal Cards
                    <span style={{ color: colors.accent.danger }} className="ml-2">♦</span>
                </h2>
                <div className="w-full h-0.5 mb-4 opacity-50" style={STATIC_STYLES.divider}></div>

                {/* System Entropy Display */}
                <div className="mb-4">
                    <label className="block text-gray-300 mb-1.5 font-medium text-sm">System Entropy</label>
                    <div
                        className="p-3 rounded-lg text-xs text-gray-300 break-all select-all cursor-text"
                        style={STATIC_STYLES.hashDisplay}
                        title={systemEntropy}
                    >
                        {truncateHash(systemEntropy, 16)}
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                        Generated from secure random source
                    </p>
                </div>

                {/* Password Input */}
                <div className="mb-4">
                    <label className="block text-gray-300 mb-1.5 font-medium text-sm">
                        Add Password <span className="text-gray-500">(optional)</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter a password to add your own entropy"
                            className="w-full p-3 pr-10 text-white rounded-lg text-sm focus:outline-none"
                            style={STATIC_STYLES.input}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            disabled={isDealing}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                        Your password is hashed and mixed with system entropy
                    </p>
                </div>

                {/* Password Hash Display (only shown if password entered) */}
                {passwordHash && (
                    <div className="mb-4">
                        <label className="block text-gray-300 mb-1.5 font-medium text-sm">Password Hash</label>
                        <div
                            className="p-3 rounded-lg text-xs text-gray-300 break-all select-all cursor-text"
                            style={STATIC_STYLES.hashDisplay}
                            title={passwordHash}
                        >
                            {truncateHash(passwordHash, 16)}
                        </div>
                    </div>
                )}

                {/* Final Entropy Display */}
                <div className="mb-5">
                    <label className="block text-gray-300 mb-1.5 font-medium text-sm">
                        Final Entropy {passwordHash ? "(combined)" : "(system only)"}
                    </label>
                    <div
                        className="p-3 rounded-lg text-xs break-all select-all cursor-text"
                        style={{
                            ...STATIC_STYLES.hashDisplay,
                            borderColor: colors.brand.primary,
                            color: colors.brand.primary
                        }}
                        title={finalEntropy}
                    >
                        {truncateHash(finalEntropy, 16)}
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                        This value will be sent with the deal transaction
                    </p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: `${colors.accent.danger}20`, color: colors.accent.danger }}>
                        {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between space-x-4">
                    <button
                        onClick={onClose}
                        disabled={isDealing}
                        className="px-5 py-3 rounded-lg text-white font-medium flex-1 transition-all duration-200 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: colors.ui.textSecondary }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDealClick}
                        disabled={isDealing}
                        className="px-5 py-3 rounded-lg text-white font-bold flex-1 transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ backgroundColor: colors.brand.primary }}
                    >
                        {isDealing ? (
                            <>
                                <LoadingSpinner size="sm" />
                                Dealing...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                    />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Deal Cards
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
});

export default DealEntropyModal;
