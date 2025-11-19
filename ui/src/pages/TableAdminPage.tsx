import { useState, useEffect } from "react";
import { GameType } from "@bitcoinbrisbane/block52";
import useCosmosWallet from "../hooks/useCosmosWallet";
import { useNewTable } from "../hooks/useNewTable";
import { useFindGames } from "../hooks/useFindGames";
import { toast } from "react-toastify";
import { formatMicroAsUsdc } from "../constants/currency";

/**
 * TableAdminPage - Admin interface for creating and managing poker tables
 *
 * Features:
 * - Create new poker tables (Sit & Go, Texas Hold'em)
 * - View all tables with their settings
 * - Copy table URL to clipboard
 */

interface TableData {
    gameId: string;
    gameType: string;
    minPlayers: number;
    maxPlayers: number;
    minBuyIn: string;
    maxBuyIn: string;
    smallBlind: string;
    bigBlind: string;
    timeout: number;
    status: string;
    creator: string;
    createdAt?: string;
}

export default function TableAdminPage() {
    const cosmosWallet = useCosmosWallet();
    const { createTable, isCreating, error: createError } = useNewTable();
    const { games: fetchedGames, isLoading, error: gamesError, refetch } = useFindGames();

    // Default table settings for Cash Game, 9 players, Texas Hold'em
    const [gameType, setGameType] = useState<GameType>(GameType.CASH);
    const [minPlayers] = useState(2);
    const [maxPlayers, setMaxPlayers] = useState(9);
    const [minBuyIn, setMinBuyIn] = useState("1");
    const [maxBuyIn, setMaxBuyIn] = useState("10");
    const [smallBlind, setSmallBlind] = useState("0.01");
    const [bigBlind, setBigBlind] = useState("0.02");

    // Success modal state
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successTxHash, setSuccessTxHash] = useState<string | null>(null);

    // Transform fetched games to TableData format
    const tables: TableData[] = (fetchedGames || [])
        .map((game: any) => ({
            gameId: game.address || game.gameId || game.game_id,
            gameType: game.gameType || game.game_type || "texas-holdem",
            minPlayers: game.minPlayers || game.min_players || 2,
            maxPlayers: game.maxPlayers || game.max_players || 6,
            minBuyIn: game.minBuyIn || game.min_buy_in || "0",
            maxBuyIn: game.maxBuyIn || game.max_buy_in || "0",
            smallBlind: game.smallBlind || game.small_blind || "0",
            bigBlind: game.bigBlind || game.big_blind || "0",
            timeout: game.timeout || 60,
            status: game.status || "waiting",
            creator: game.creator || "unknown",
            createdAt: game.createdAt || game.created_at
        }))
        // Sort by creation date (newest first)
        .sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    // Create a new table using the useNewTable hook
    const handleCreateTable = async () => {
        console.log("🎮 handleCreateTable called");
        console.log("Cosmos wallet address:", cosmosWallet.address);

        if (!cosmosWallet.address) {
            toast.error("No Block52 wallet found. Please create or import a wallet first.");
            return;
        }

        console.log("📋 Table configuration:", {
            type: gameType,
            minBuyIn: parseFloat(minBuyIn),
            maxBuyIn: parseFloat(maxBuyIn),
            minPlayers,
            maxPlayers,
            smallBlind: parseFloat(smallBlind),
            bigBlind: parseFloat(bigBlind)
        });

        try {
            console.log("🚀 Calling createTable...");
            const txHash = await createTable({
                type: gameType,
                minBuyIn: parseFloat(minBuyIn),
                maxBuyIn: parseFloat(maxBuyIn),
                minPlayers,
                maxPlayers,
                smallBlind: parseFloat(smallBlind),
                bigBlind: parseFloat(bigBlind)
            });

            console.log("✅ createTable returned:", txHash);

            if (txHash) {
                // Show success modal with transaction link
                setSuccessTxHash(txHash);
                setShowSuccessModal(true);

                // Wait a moment then reload tables
                setTimeout(() => {
                    refetch();
                }, 2000);
            } else {
                console.warn("⚠️ createTable returned null/undefined");
                toast.error("Table creation failed - no transaction hash returned");
            }
        } catch (err: any) {
            console.error("❌ Failed to create table:", err);
            console.error("Error details:", {
                message: err.message,
                stack: err.stack,
                name: err.name
            });
            const errorMessage = err.message || "Unknown error occurred";
            toast.error(`Failed to create table: ${errorMessage}`);
        }
    };

    // Show error toast if createError or gamesError changes
    useEffect(() => {
        if (createError) {
            toast.error(createError.message);
        }
        if (gamesError) {
            toast.error(`Failed to load games: ${gamesError.message}`);
        }
    }, [createError, gamesError]);

    // Copy table URL to clipboard
    const handleCopyTableUrl = (gameId: string) => {
        const baseUrl = window.location.origin;
        const tableUrl = `${baseUrl}/table/${gameId}`;
        navigator.clipboard.writeText(tableUrl);
        toast.success("Table URL copied to clipboard!");
    };

    // Stats
    const totalTables = tables.length;
    const activeTables = tables.filter(t => t.status === "playing" || t.status === "waiting").length;
    const sitAndGoTables = tables.filter(t => t.maxPlayers <= 6).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Table Admin Dashboard</h1>
                    <p className="text-gray-400">Create and manage poker tables</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Total Tables</p>
                        <p className="text-2xl font-bold text-white">{totalTables}</p>
                    </div>
                    <div className="bg-green-900/30 rounded-lg p-4 border border-green-700">
                        <p className="text-green-400 text-sm mb-1">Active Tables</p>
                        <p className="text-2xl font-bold text-green-300">{activeTables}</p>
                    </div>
                    <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-700">
                        <p className="text-blue-400 text-sm mb-1">Sit & Go Tables</p>
                        <p className="text-2xl font-bold text-blue-300">{sitAndGoTables}</p>
                    </div>
                </div>

                {/* Create Table Form */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
                    <h2 className="text-2xl font-bold text-white mb-4">Create New Table</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-white text-sm mb-2 block">Game Type</label>
                            <select
                                value={gameType}
                                onChange={e => setGameType(e.target.value as GameType)}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                            >
                                <option value={GameType.SIT_AND_GO}>Sit & Go (Texas Hold'em)</option>
                                <option value={GameType.TOURNAMENT}>Tournament</option>
                                <option value={GameType.CASH}>Cash Game</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-white text-sm mb-2 block">Max Players</label>
                            <select
                                value={maxPlayers}
                                onChange={e => setMaxPlayers(parseInt(e.target.value))}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                            >
                                <option value={2}>2 Players (Heads-Up)</option>
                                <option value={4}>4 Players (Sit & Go)</option>
                                <option value={6}>6 Players (Sit & Go)</option>
                                <option value={9}>9 Players (Full Ring)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {gameType === GameType.SIT_AND_GO || gameType === GameType.TOURNAMENT ? (
                            // For Sit & Go and Tournament: Single buy-in field (fixed amount)
                            <div className="md:col-span-2">
                                <label className="text-white text-sm mb-2 block">Buy-In (USDC) - Fixed Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={minBuyIn}
                                    onChange={e => {
                                        setMinBuyIn(e.target.value);
                                        setMaxBuyIn(e.target.value); // Keep them equal
                                    }}
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                                    placeholder="e.g., 1.00"
                                />
                                <p className="text-gray-400 text-xs mt-1">All players must buy in for this exact amount</p>
                            </div>
                        ) : (
                            // For Cash Game: Separate min/max fields
                            <>
                                <div>
                                    <label className="text-white text-sm mb-2 block">Min Buy-In (USDC)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={minBuyIn}
                                        onChange={e => setMinBuyIn(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-white text-sm mb-2 block">Max Buy-In (USDC)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={maxBuyIn}
                                        onChange={e => setMaxBuyIn(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="text-white text-sm mb-2 block">Small Blind (USDC)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={smallBlind}
                                onChange={e => setSmallBlind(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="text-white text-sm mb-2 block">Big Blind (USDC)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={bigBlind}
                                onChange={e => setBigBlind(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleCreateTable}
                            disabled={isCreating || !cosmosWallet.address}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                        >
                            {isCreating ? "Creating Table..." : "🎮 Create Table"}
                        </button>
                        <button
                            onClick={refetch}
                            disabled={isLoading}
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                        >
                            {isLoading ? "Loading..." : "Refresh"}
                        </button>
                    </div>

                    {!cosmosWallet.address && <p className="mt-3 text-yellow-400 text-sm">⚠️ Please connect your Block52 wallet first</p>}
                </div>

                {/* Tables List */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-900 border-b border-gray-700">
                        <h2 className="text-xl font-bold text-white">Poker Tables</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 tracking-wider">Table ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 tracking-wider">Created</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 tracking-wider">Game Type</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 tracking-wider">Players</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 tracking-wider">Buy-In Range</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 tracking-wider">Blinds</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {tables.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                                            {isLoading ? "Loading tables..." : "No tables found. Create your first table!"}
                                        </td>
                                    </tr>
                                ) : (
                                    tables.map(table => (
                                        <tr key={table.gameId} className="hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-mono text-xs break-all max-w-[200px]" title={table.gameId}>
                                                        {table.gameId.substring(0, 16)}...
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(table.gameId);
                                                            toast.success("Table ID copied!");
                                                        }}
                                                        className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {table.createdAt ? (
                                                    <div className="text-xs">
                                                        <div className="text-white font-medium">{new Date(table.createdAt).toLocaleDateString()}</div>
                                                        <div className="text-gray-400">
                                                            {new Date(table.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-white capitalize">{table.gameType.replace("-", " ")}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="text-white font-semibold">
                                                    {table.minPlayers}-{table.maxPlayers}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="text-white font-mono text-sm">
                                                    ${formatMicroAsUsdc(table.minBuyIn, 2)} - ${formatMicroAsUsdc(table.maxBuyIn, 2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="text-white font-mono text-sm">
                                                    ${formatMicroAsUsdc(table.smallBlind, 2)} / ${formatMicroAsUsdc(table.bigBlind, 2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span
                                                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                                        table.status === "playing"
                                                            ? "bg-green-900/50 text-green-300 border border-green-700"
                                                            : table.status === "waiting"
                                                            ? "bg-yellow-900/50 text-yellow-300 border border-yellow-700"
                                                            : "bg-gray-700 text-gray-300"
                                                    }`}
                                                >
                                                    {table.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => handleCopyTableUrl(table.gameId)}
                                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                                >
                                                    📋 Copy URL
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                    <h3 className="text-blue-200 font-semibold mb-2">ℹ️ How This Works</h3>
                    <ul className="text-blue-300 text-sm space-y-1 list-disc list-inside">
                        <li>Create new poker tables with custom settings (buy-in, blinds, player count)</li>
                        <li>All tables are stored on the blockchain and queryable via REST API</li>
                        <li>Copy the table URL to share with players</li>
                        <li>Tables show real-time status (waiting, playing, finished)</li>
                        <li>Default setup: Sit & Go, 4 players, Texas Hold'em</li>
                    </ul>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && successTxHash && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                    <div className="bg-gray-800 border border-green-500 rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl">
                        <div className="flex items-center justify-center mb-6">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-white text-center mb-4">Table Created Successfully!</h2>

                        <p className="text-gray-300 text-center mb-6">Your poker table has been created on the blockchain.</p>

                        <div className="bg-gray-900 rounded-lg p-4 mb-6">
                            <p className="text-gray-400 text-sm mb-2">Transaction Hash:</p>
                            <div className="flex items-center justify-between gap-2">
                                <code className="text-green-400 text-xs font-mono break-all">{successTxHash}</code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(successTxHash);
                                        toast.success("Transaction hash copied!");
                                    }}
                                    className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                                    title="Copy transaction hash"
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
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <a
                                href={`/explorer/tx/${successTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-center"
                            >
                                View on Explorer
                            </a>
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setSuccessTxHash(null);
                                }}
                                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Powered by Block52 */}
            <div className="fixed bottom-4 left-4 flex items-center z-50 opacity-30">
                <div className="flex flex-col items-start bg-transparent px-3 py-2 rounded-lg backdrop-blur-sm border-0">
                    <div className="text-left mb-1">
                        <span className="text-xs text-white font-medium tracking-wide  ">POWERED BY</span>
                    </div>
                    <img src="/block52.png" alt="Block52 Logo" className="h-6 w-auto object-contain pointer-events-none" />
                </div>
            </div>
        </div>
    );
}
