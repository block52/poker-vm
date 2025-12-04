import React, { useState, useCallback } from "react";
import { colors, getHexagonStroke } from "../../utils/colorConfig";
import { formatUSDCToSimpleDollars } from "../../utils/numberUtils";

// Static styles
const STATIC_STYLES = {
    modal: {
        backgroundColor: colors.ui.bgDark,
        border: `1px solid ${colors.ui.borderColor}`
    },
    divider: {
        background: `linear-gradient(to right, transparent, ${colors.accent.danger}, transparent)`
    }
};

// Memoized hexagon pattern component
const HexagonPattern = React.memo(() => (
    <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="hexagons-leave" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(5)">
                    <path d="M25,3.4 L45,17 L45,43.4 L25,56.7 L5,43.4 L5,17 L25,3.4 z" stroke={getHexagonStroke()} strokeWidth="0.6" fill="none" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexagons-leave)" />
        </svg>
    </div>
));

HexagonPattern.displayName = "HexagonPattern";

// Spinner component
const Spinner = React.memo(() => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
    </svg>
));

Spinner.displayName = "Spinner";

interface LeaveTableModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    playerStack: string; // In microunits
    isInActiveHand: boolean;
}

const LeaveTableModal: React.FC<LeaveTableModalProps> = React.memo(({ isOpen, onClose, onConfirm, playerStack, isInActiveHand }) => {
    const [isLeaving, setIsLeaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = useCallback(async () => {
        setIsLeaving(true);
        setError(null);
        try {
            await onConfirm();
            onClose();
        } catch (err) {
            console.error("Error leaving table:", err);
            setError(err instanceof Error ? err.message : "Failed to leave table. Please try again.");
            setIsLeaving(false);
        }
    }, [onConfirm, onClose]);

    const handleCancelMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.backgroundColor = colors.ui.bgMedium;
    }, []);

    const handleCancelMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.backgroundColor = colors.ui.textSecondary;
    }, []);

    if (!isOpen) return null;

    const stackFormatted = formatUSDCToSimpleDollars(playerStack);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={!isLeaving ? onClose : undefined} />

            {/* Modal */}
            <div className="relative p-8 rounded-xl shadow-2xl w-96 overflow-hidden" style={STATIC_STYLES.modal}>
                {/* Hexagon pattern background */}
                <HexagonPattern />

                {/* Decorative card suits */}
                <div className="absolute -right-8 -top-8 text-6xl opacity-10 rotate-12">♠</div>
                <div className="absolute -left-8 -bottom-8 text-6xl opacity-10 -rotate-12">♥</div>

                {/* Header */}
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                    <span style={{ color: colors.accent.danger }} className="mr-2">
                        ⚠
                    </span>
                    Leave Table
                </h2>
                <div className="w-full h-0.5 mb-6 opacity-50" style={STATIC_STYLES.divider}></div>

                {/* Warning Message */}
                <div className="mb-6">
                    <p className="text-gray-300 text-sm mb-4">Are you sure you want to leave this table?</p>

                    {isInActiveHand && (
                        <div
                            className="p-4 rounded-lg mb-4"
                            style={{
                                backgroundColor: `${colors.accent.danger}20`,
                                border: `1px solid ${colors.accent.danger}`
                            }}
                        >
                            <p className="text-white text-sm font-semibold mb-2">⚠️ Active Hand Warning</p>
                            <p className="text-gray-300 text-xs">
                                You are currently in an active hand. Leaving now will automatically <strong>fold your hand</strong> and forfeit any
                                chips you have bet this round.
                            </p>
                        </div>
                    )}

                    {/* Stack info */}
                    <div
                        className="p-4 rounded-lg"
                        style={{
                            backgroundColor: colors.ui.bgMedium,
                            border: `1px solid ${colors.ui.borderColor}`
                        }}
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Your Stack:</span>
                            <span className="text-white font-bold text-lg">${stackFormatted}</span>
                        </div>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: `${colors.accent.danger}20` }}>
                        <p style={{ color: colors.accent.danger }} className="text-sm">
                            ⚠️ {error}
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col space-y-3">
                    <button
                        onClick={handleConfirm}
                        disabled={isLeaving}
                        className="w-full px-5 py-3 rounded-lg font-medium text-white shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-80"
                        style={{
                            backgroundColor: colors.accent.danger,
                            cursor: isLeaving ? "not-allowed" : "pointer"
                        }}
                    >
                        {isLeaving ? (
                            <>
                                <Spinner />
                                <span>Leaving...</span>
                            </>
                        ) : (
                            <>
                                <span>Leave Table</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isLeaving}
                        className="w-full px-5 py-3 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50"
                        style={{ backgroundColor: colors.ui.textSecondary }}
                        onMouseEnter={!isLeaving ? handleCancelMouseEnter : undefined}
                        onMouseLeave={!isLeaving ? handleCancelMouseLeave : undefined}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
});

LeaveTableModal.displayName = "LeaveTableModal";

export default LeaveTableModal;
