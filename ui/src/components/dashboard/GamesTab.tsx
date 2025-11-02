import React from "react";
import { colors, hexToRgba } from "../../utils/colorConfig";
import { formatAddress } from "../common/utils";
import { GameType } from "@bitcoinbrisbane/block52";
import { formatUSDCToSimpleDollars } from "../../utils/numberUtils";

interface GamesTabProps {
    // Games data
    games: any[];
    gamesLoading: boolean;
    gamesError: any;
    playerCounts: Map<string, any>;
    showAllTables: boolean;
    setShowAllTables: (show: boolean) => void;
    copiedTableId: string | null;
    setCopiedTableId: (id: string | null) => void;

    // Game creation
    handleCreateTableClick: () => void;
    handleChooseTableClick: () => void;

    // Join table
    setShowBuyInModal: (show: boolean) => void;
    setBuyInTableId: (id: string) => void;
    setSelectedGameForBuyIn: (game: any) => void;

    // Memoized components
    CreateTableButton: React.ComponentType<{ onClick: () => void }>;
}

export const GamesTab: React.FC<GamesTabProps> = ({
    games,
    gamesLoading,
    gamesError,
    playerCounts,
    showAllTables,
    setShowAllTables,
    copiedTableId,
    setCopiedTableId,
    handleCreateTableClick,
    handleChooseTableClick,
    setShowBuyInModal,
    setBuyInTableId,
    setSelectedGameForBuyIn,
    CreateTableButton
}) => {
    return (
        <div className="space-y-6">
            {/* Create Table Action */}
            <div className="flex justify-center">
                <CreateTableButton onClick={handleCreateTableClick} />
            </div>

            {/* Available Games Section */}
            {games && games.length > 0 && (
                <div className="bg-gray-700/90 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-blue-500/10 hover:border-blue-500/20 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" style={{ color: colors.brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                            />
                        </svg>
                        Available Tables
                    </h3>

                    <div className="space-y-3">
                        {games.slice(0, showAllTables ? undefined : 3).map((game, index) => (
                            <div
                                key={index}
                                className="p-4 bg-gray-800/60 rounded-lg border border-blue-500/10 hover:border-blue-500/20 transition-all duration-300"
                                style={{
                                    background: `linear-gradient(135deg, ${hexToRgba(colors.ui.bgDark, 0.8)} 0%, ${hexToRgba(colors.ui.bgDark, 0.6)} 100%)`
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: hexToRgba(colors.brand.primary, 0.2) }}
                                        >
                                            <svg
                                                className="w-5 h-5"
                                                style={{ color: colors.brand.primary }}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-white font-semibold">Texas Hold&apos;em</h4>
                                                {game.gameOptions?.maxPlayers && (
                                                    <span
                                                        className="px-2 py-1 rounded-full text-xs font-medium"
                                                        style={{
                                                            backgroundColor: hexToRgba(colors.brand.primary, 0.2),
                                                            color: colors.brand.primary
                                                        }}
                                                    >
                                                        {playerCounts.get(game.address)?.currentPlayers || 0}/{game.gameOptions.maxPlayers} Players
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-400 text-xs font-mono mb-2">{formatAddress(game.address)}</p>

                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {/* Check if it's a Sit & Go (minBuyIn equals maxBuyIn) */}
                                                {game.gameOptions?.type === GameType.SIT_AND_GO ||
                                                (game.gameOptions?.minBuyIn === game.gameOptions?.maxBuyIn &&
                                                    game.gameOptions?.smallBlind === "100000000000000000000" &&
                                                    game.gameOptions?.bigBlind === "200000000000000000000") ? (
                                                    <>
                                                        <span
                                                            className="px-2 py-1 rounded-full font-medium"
                                                            style={{
                                                                backgroundColor: hexToRgba(colors.accent.success, 0.2),
                                                                color: colors.accent.success
                                                            }}
                                                        >
                                                            Buy-in: $
                                                            {game.gameOptions?.maxBuyIn && game.gameOptions.maxBuyIn !== "0"
                                                                ? formatUSDCToSimpleDollars(game.gameOptions.maxBuyIn)
                                                                : "1.00"}
                                                        </span>
                                                        <span
                                                            className="px-2 py-1 rounded-full font-medium"
                                                            style={{
                                                                backgroundColor: hexToRgba(colors.brand.primary, 0.2),
                                                                color: colors.brand.primary
                                                            }}
                                                        >
                                                            Blinds: 100/200
                                                        </span>
                                                        <span
                                                            className="px-2 py-1 rounded-full font-medium"
                                                            style={{
                                                                backgroundColor: hexToRgba(colors.accent.glow, 0.2),
                                                                color: colors.accent.glow
                                                            }}
                                                        >
                                                            10,000 tokens
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span
                                                            className="px-2 py-1 rounded-full font-medium"
                                                            style={{
                                                                backgroundColor: hexToRgba(colors.accent.success, 0.2),
                                                                color: colors.accent.success
                                                            }}
                                                        >
                                                            Min: $
                                                            {game.gameOptions?.minBuyIn && game.gameOptions.minBuyIn !== "0"
                                                                ? formatUSDCToSimpleDollars(game.gameOptions.minBuyIn)
                                                                : "1.00"}
                                                        </span>
                                                        <span
                                                            className="px-2 py-1 rounded-full font-medium"
                                                            style={{
                                                                backgroundColor: hexToRgba(colors.accent.success, 0.2),
                                                                color: colors.accent.success
                                                            }}
                                                        >
                                                            Max: $
                                                            {game.gameOptions?.maxBuyIn && game.gameOptions.maxBuyIn !== "0"
                                                                ? formatUSDCToSimpleDollars(game.gameOptions.maxBuyIn)
                                                                : "100.00"}
                                                        </span>
                                                        <span
                                                            className="px-2 py-1 rounded-full font-medium"
                                                            style={{
                                                                backgroundColor: hexToRgba(colors.brand.primary, 0.2),
                                                                color: colors.brand.primary
                                                            }}
                                                        >
                                                            Blinds: $
                                                            {game.gameOptions?.smallBlind && game.gameOptions.smallBlind !== "0"
                                                                ? formatUSDCToSimpleDollars(game.gameOptions.smallBlind)
                                                                : "0.50"}
                                                            /$
                                                            {game.gameOptions?.bigBlind && game.gameOptions.bigBlind !== "0"
                                                                ? formatUSDCToSimpleDollars(game.gameOptions.bigBlind)
                                                                : "1.00"}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Copy Table URL Button */}
                                        <div className="relative">
                                            <button
                                                onClick={() => {
                                                    const tableUrl = `${window.location.origin}/table/${game.address}`;
                                                    navigator.clipboard.writeText(tableUrl);
                                                    setCopiedTableId(game.address);
                                                    setTimeout(() => setCopiedTableId(null), 2000);
                                                }}
                                                title="Copy table URL"
                                                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                                    />
                                                </svg>
                                            </button>
                                            {copiedTableId === game.address && (
                                                <div
                                                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white rounded shadow-lg whitespace-nowrap z-10"
                                                    style={{ backgroundColor: colors.accent.success }}
                                                >
                                                    Table link copied!
                                                    <div
                                                        className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent"
                                                        style={{ borderTopColor: colors.accent.success }}
                                                    ></div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Join Table Button */}
                                        <button
                                            onClick={() => {
                                                setShowBuyInModal(true);
                                                setBuyInTableId(game.address);
                                                setSelectedGameForBuyIn(game);
                                            }}
                                            title="Join this table"
                                            className="px-4 py-2 text-sm text-white rounded-lg transition duration-300 shadow-md hover:opacity-90 hover:scale-105 transform"
                                            style={{ backgroundColor: colors.brand.primary }}
                                        >
                                            Join Table
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Loading State */}
                    {gamesLoading && (
                        <div className="flex justify-center items-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderBottomColor: colors.brand.primary }} />
                            <span className="ml-2 text-gray-400">Loading tables...</span>
                        </div>
                    )}

                    {/* Error State */}
                    {gamesError && (
                        <div className="text-red-400 text-sm text-center py-4 rounded-lg" style={{ backgroundColor: hexToRgba(colors.accent.danger, 0.1) }}>
                            ⚠️ Failed to load games. Please try again.
                        </div>
                    )}

                    {/* Show More/Less Button */}
                    {games.length > 3 && (
                        <div className="mt-4 flex justify-center">
                            <button
                                onClick={() => setShowAllTables(!showAllTables)}
                                className="text-sm transition duration-300 hover:opacity-80 px-4 py-2 rounded-lg"
                                style={{
                                    color: colors.brand.primary,
                                    backgroundColor: hexToRgba(colors.brand.primary, 0.1),
                                    border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                                }}
                            >
                                {showAllTables ? "Show less" : `View more tables (${games.length - 3} more)`}
                            </button>
                        </div>
                    )}

                    {/* Empty State */}
                    {games.length === 0 && !gamesLoading && !gamesError && (
                        <div className="text-center py-8">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                                style={{ backgroundColor: hexToRgba(colors.brand.primary, 0.1) }}
                            >
                                <svg className="w-8 h-8" style={{ color: colors.brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                                    />
                                </svg>
                            </div>
                            <p className="text-gray-300 text-lg font-medium mb-2">No tables found</p>
                            <p className="text-gray-400 text-sm mb-4">Create your own table to start playing!</p>
                            <CreateTableButton onClick={handleCreateTableClick} />
                        </div>
                    )}
                </div>
            )}

            {/* Choose Table Action (when tables exist) */}
            {games && games.length > 0 && (
                <div className="flex justify-center">
                    <button
                        onClick={handleChooseTableClick}
                        title="Choose from available tables"
                        className="w-full max-w-md text-center text-white rounded-xl py-3 px-6 text-lg transition duration-300 transform hover:scale-105 shadow-md hover:opacity-90"
                        style={{
                            background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${hexToRgba(colors.brand.primary, 0.8)} 100%)`,
                            border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                        }}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                                />
                            </svg>
                            Choose Table
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
};

export default GamesTab;
