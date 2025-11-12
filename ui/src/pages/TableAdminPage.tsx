import { useState, useEffect } from "react";
import { GameType } from "@bitcoinbrisbane/block52";
import useCosmosWallet from "../hooks/useCosmosWallet";
import { useNewTable } from "../hooks/useNewTable";
import { useFindGames } from "../hooks/useFindGames";
import { toast } from "react-toastify";

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
}

// Helper function to format USDC amounts (6 decimals)
const formatUSDC = (microAmount: string | number): string => {
    const amount = typeof microAmount === "string" ? parseFloat(microAmount) : microAmount;
    return (amount / 1_000_000).toFixed(2);
};

export default function TableAdminPage() {
    const cosmosWallet = useCosmosWallet();
    const { createTable, isCreating, error: createError, newGameId } = useNewTable();
    const { games: fetchedGames, isLoading, error: gamesError, refetch } = useFindGames();

    // Default table settings for Sit & Go, 4 players, Texas Hold'em
    const [gameType, setGameType] = useState<GameType>(GameType.SIT_AND_GO);
    const [minPlayers] = useState(2);
    const [maxPlayers, setMaxPlayers] = useState(4);
    const [minBuyIn, setMinBuyIn] = useState("1");
    const [maxBuyIn, setMaxBuyIn] = useState("10");
    const [smallBlind, setSmallBlind] = useState("0.01");
    const [bigBlind, setBigBlind] = useState("0.02");

    // Transform fetched games to TableData format
    const tables: TableData[] = fetchedGames.map((game: any) => ({
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
        creator: game.creator || "unknown"
    }));

    // Create a new table using the useNewTable hook
    const handleCreateTable = async () => {
        if (!cosmosWallet.address) {
            toast.error("No Cosmos wallet found. Please create or import a wallet first.");
            return;
        }

        try {
            const txHash = await createTable({
                type: gameType,
                minBuyIn: parseFloat(minBuyIn),
                maxBuyIn: parseFloat(maxBuyIn),
                minPlayers,
                maxPlayers,
                smallBlind: parseFloat(smallBlind),
                bigBlind: parseFloat(bigBlind)
            });

            if (txHash) {
                toast.success(`Table created successfully! TX: ${txHash.substring(0, 10)}...`);

                // Wait a moment then reload tables
                setTimeout(() => {
                    refetch();
                }, 2000);
            }
        } catch (err: any) {
            console.error("Failed to create table:", err);
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
                                onChange={(e) => setGameType(e.target.value as GameType)}
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
                                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
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
                        <div>
                            <label className="text-white text-sm mb-2 block">Min Buy-In (USDC)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={minBuyIn}
                                onChange={(e) => setMinBuyIn(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="text-white text-sm mb-2 block">Max Buy-In (USDC)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={maxBuyIn}
                                onChange={(e) => setMaxBuyIn(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="text-white text-sm mb-2 block">Small Blind (USDC)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={smallBlind}
                                onChange={(e) => setSmallBlind(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="text-white text-sm mb-2 block">Big Blind (USDC)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={bigBlind}
                                onChange={(e) => setBigBlind(e.target.value)}
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

                    {!cosmosWallet.address && (
                        <p className="mt-3 text-yellow-400 text-sm">
                            ⚠️ Please connect your Cosmos wallet first
                        </p>
                    )}
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
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Table ID
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Game Type
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Players
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Buy-In Range
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Blinds
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {tables.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                                            {isLoading ? "Loading tables..." : "No tables found. Create your first table!"}
                                        </td>
                                    </tr>
                                ) : (
                                    tables.map((table) => (
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
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                </div>
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
                                                    ${formatUSDC(table.minBuyIn)} - ${formatUSDC(table.maxBuyIn)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="text-white font-mono text-sm">
                                                    ${formatUSDC(table.smallBlind)} / ${formatUSDC(table.bigBlind)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                                    table.status === "playing"
                                                        ? "bg-green-900/50 text-green-300 border border-green-700"
                                                        : table.status === "waiting"
                                                        ? "bg-yellow-900/50 text-yellow-300 border border-yellow-700"
                                                        : "bg-gray-700 text-gray-300"
                                                }`}>
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

                {/* Back to Dashboard */}
                <div className="mt-6 text-center">
                    <a
                        href="/"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        ← Back to Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}
