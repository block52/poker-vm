import React, { useEffect, useState } from "react"; // Import React and useEffect
import { Link, useNavigate } from "react-router-dom"; // Import Link for navigation
import { STORAGE_PUBLIC_KEY, STORAGE_PRIVATE_KEY } from "../hooks/useUserWallet";
import "./Dashboard.css";
import useUserWalletConnect from "../hooks/DepositPage/useUserWalletConnect"; // Add this import
import useUserWallet from "../hooks/useUserWallet"; // Add this import
import useNewCommand from "../hooks/DashboardPage/useNewCommand"; // Import the new hook
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { Wallet } from "ethers";
// Create an enum of game types
enum GameType {
    CASH = "cash",
    TOURNAMENT = "tournament"
}

enum Variant {
    TEXAS_HOLDEM = "texas-holdem",
    OMAHA = "omaha"
}

const Dashboard: React.FC = () => {
    const seats = [2, 6, 8];

    const navigate = useNavigate();
    const [publicKey, setPublicKey] = useState<string>();
    const [typeSelected, setTypeSelected] = useState<string>("cash");
    const [variantSelected, setVariantSelected] = useState<string>("texas-holdem");
    const [seatSelected, setSeatSelected] = useState<number>(2);
    const { isConnected, open, disconnect, address } = useUserWalletConnect();
    const { balance: b52Balance } = useUserWallet();
    const [games, setGames] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importKey, setImportKey] = useState("");
    const [importError, setImportError] = useState("");
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    
    // New game creation states
    const [showCreateGameModal, setShowCreateGameModal] = useState(false);
    const [selectedContractAddress, setSelectedContractAddress] = useState("");
    const [isCreatingGame, setIsCreatingGame] = useState(false);
    const [createGameError, setCreateGameError] = useState("");
    const [newGameAddress, setNewGameAddress] = useState("");

    // Game contract addresses - in a real app, these would come from the API
    const DEFAULT_GAME_CONTRACT = "0x22dfa2150160484310c5163f280f49e23b8fd343"; // Example address
    
    // Initialize the useNewCommand hook with the selected contract address
    const { createNewGame, isCreating } = useNewCommand({ 
        gameContractAddress: selectedContractAddress || DEFAULT_GAME_CONTRACT 
    });

    // Function to handle creating a new game
    const handleCreateNewGame = async () => {
        setIsCreatingGame(true);
        setCreateGameError("");
        
        try {
            // Generate a random seed for the game (optional)
            const randomSeed = Math.random().toString(36).substring(2, 15);
            
            const result = await createNewGame(randomSeed);
            
            if (result.success && result.gameAddress) {
                setNewGameAddress(result.gameAddress);
                setShowCreateGameModal(false);
                
                // Show success message
                alert(`Game created successfully! Game address: ${result.gameAddress}`);
                
                // You could automatically navigate to the game or update the UI
                // navigate(`/table/${result.gameAddress}`);
            } else {
                setCreateGameError(result.error || "Failed to create game");
            }
        } catch (error: any) {
            setCreateGameError(error.message || "An unexpected error occurred");
        } finally {
            setIsCreatingGame(false);
        }
    };

    // Add function to reset blockchain
    const resetBlockchain = async () => {
        if (!confirm("Are you sure you want to reset the blockchain? This will clear all data.")) {
            return;
        }

        setIsResetting(true);
        try {
            // Determine API endpoint based on current URL
            const apiUrl = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
                ? "http://localhost:3000"
                : "https://node1.block52.xyz";
            
            // According to the SDK, RESET_BLOCKCHAIN expects [username, password] params
            // but our implementation doesn't currently require them
            const response = await axios.post(apiUrl, {
                id: 1,
                method: "reset_blockchain",
                params: ["admin", "admin"] // Using placeholder values since our implementation ignores them
            }, {
                headers: {
                    "Content-Type": "application/json"
                }
            });
            
            console.log("Reset response:", response.data);
            
            // Check if the response indicates success - could be in various formats
            // Look for error first, then check if data is true, or if there's a result object at all
            if (response.data.error) {
                alert(`Blockchain reset failed: ${response.data.error}`);
            } else if (response.data.result === true) {
                // Direct boolean result - the new format
                alert("Blockchain reset successful! All data has been cleared and accounts recreated.");
            } else if (response.data.result && response.data.result.data) {
                // Old format with nested data property
                if (response.data.result.data === true || response.data.result.data === "true") {
                    alert("Blockchain reset successful! All data has been cleared and account on layer 2 have been resynced with layer 1.");
                } else {
                    alert("Blockchain reset completed but with an unexpected response. Check console for details.");
                }
            } else {
                alert("Blockchain reset response format unexpected. Check console for details.");
            }
            
            // Refresh the page to update any UI components
            window.location.reload();
        } catch (error: any) {
            console.error("Error resetting blockchain:", error);
            alert(`Error resetting blockchain: ${error.message || "Unknown error"}`);
        } finally {
            setIsResetting(false);
        }
    };

    // Add logging to fetch games
    const fetchGames = async () => {
        // console.log("\n=== Fetching Games from Proxy ===");
        try {
            const response = await axios.get(`${PROXY_URL}/games`);
            // console.log("Games Response:", response.data);

            // Map the response to our game types
            const games = response.data.map((game: any) => ({
                id: game.id,
                variant: game.variant,
                type: game.type,
                limit: game.limit,
                maxPlayers: game.max_players,
                minBuy: game.min,
                maxBuy: game.max
            }));

            // console.log("Processed Games:", games);
            setGames(games);
        } catch (error) {
            console.error("Error fetching games:", error);
        }
    };

    useEffect(() => {
        //  console.log("Dashboard mounted, fetching games...");
        fetchGames();
    }, []);

    useEffect(() => {
        // console.log("\n=== Dashboard Mounted ===");
        // console.log("Connected Wallet:", address);
        // console.log("Balance:", b52Balance);
        // console.log("======================\n");

        const localKey = localStorage.getItem(STORAGE_PUBLIC_KEY);
        // console.log("Local Storage Key:", localKey);
        if (!localKey) return setPublicKey(undefined);

        setPublicKey(localKey);
    }, []);

    useEffect(() => {
        // console.log('\n=== Dashboard Balance Check ===');
        // console.log('Connected Address:', address);
        // console.log('Raw B52 Balance:', b52Balance);
        // console.log('Formatted Balance:', b52Balance ? formatBalance(b52Balance) : '0');
        // console.log('============================\n');
    }, [address, b52Balance]);

    const handleGameType = (type: GameType) => {
        console.log("\n=== Game Type Selected ===");
        console.log("Type:", type);

        if (type === GameType.CASH) {
            console.log("Setting type to CASH");
            setTypeSelected("cash");
        }

        if (type === GameType.TOURNAMENT) {
            console.log("Setting type to TOURNAMENT");
            setTypeSelected("tournament");
        }
    };

    const handleGameVariant = (variant: Variant) => {
        console.log("\n=== Game Variant Selected ===");
        console.log("Variant:", variant);

        if (variant === Variant.TEXAS_HOLDEM) {
            console.log("Setting variant to TEXAS HOLDEM");
            setVariantSelected("texas-holdem");
        }

        if (variant === Variant.OMAHA) {
            console.log("Setting variant to OMAHA");
            setVariantSelected("omaha");
        }
    };

    const handleSeat = (seat: number) => {
        setSeatSelected(seat);
    };

    const buildUrl = () => {
        if (newGameAddress) {
            return `/table/${newGameAddress}`;
        }
        // return `/table/${typeSelected}?variant=${variantSelected}&seats=${seatSelected}`;
        return "/table/0x22dfa2150160484310c5163f280f49e23b8fd34326";
    };

    const handleNext = () => {
        const url = buildUrl();
        console.log("Next button clicked");

        // Redirect to the sit page
        navigate(url);
    };

    // const [loading, setLoading] = useState(true);
    // const [gameType, setGameType] = useState<string | null>(null);

    // Add function to format address
    const formatAddress = (address: string | undefined) => {
        if (!address) return "";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    // Modify formatBalance to add logging
    const formatBalance = (rawBalance: string | number) => {
        console.log("\n=== Format Balance Called ===");
        console.log("Input Balance:", rawBalance);
        const value = Number(rawBalance) / 1e18;
        console.log("Converted Value:", value);
        const formatted = value.toFixed(2);
        console.log("Formatted Result:", formatted);
        console.log("==========================\n");
        return formatted;
    };

    const handleImportPrivateKey = () => {
        try {
            // Validate private key format
            if (!importKey.startsWith("0x")) {
                setImportError("Private key must start with 0x");
                return;
            }
            if (importKey.length !== 66) {
                setImportError("Invalid private key length");
                return;
            }

            // Create wallet from private key to validate and get address
            const wallet = new Wallet(importKey);

            // Save to localStorage
            localStorage.setItem(STORAGE_PRIVATE_KEY, importKey);
            localStorage.setItem(STORAGE_PUBLIC_KEY, wallet.address);

            // Reset form and close modal
            setImportKey("");
            setImportError("");
            setShowImportModal(false);

            // Refresh page to update wallet
            window.location.reload();
        } catch (err) {
            setImportError("Invalid private key format");
        }
    };

    const handleCopyPrivateKey = async () => {
        const privateKey = localStorage.getItem(STORAGE_PRIVATE_KEY);
        if (privateKey) {
            try {
                await navigator.clipboard.writeText(privateKey);
                // Could add a toast notification here if you want
            } catch (err) {
                console.error("Failed to copy private key:", err);
            }
        }
    };

    // CSS for disabled buttons
    const disabledButtonClass = "text-gray-400 bg-gray-600 cursor-not-allowed opacity-60";

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-gray-800 via-gray-900 to-black relative">
            {/* Import Private Key Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-xl w-96">
                        <h3 className="text-xl font-bold text-white mb-4">Import Private Key</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Enter private key (0x...)"
                                value={importKey}
                                onChange={e => setImportKey(e.target.value)}
                                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-pink-500 focus:outline-none"
                            />
                            {importError && <p className="text-red-500 text-sm">{importError}</p>}
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setImportKey("");
                                        setImportError("");
                                    }}
                                    className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImportPrivateKey}
                                    className="px-4 py-2 text-sm bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition duration-300"
                                >
                                    Import
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create New Game Modal */}
            {showCreateGameModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-xl w-96">
                        <h3 className="text-xl font-bold text-white mb-4">Create New Game</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-white text-sm mb-1">Game Contract</label>
                                <select 
                                    value={selectedContractAddress}
                                    onChange={(e) => setSelectedContractAddress(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-pink-500 focus:outline-none"
                                >
                                    <option value={DEFAULT_GAME_CONTRACT}>Default Texas Hold'em</option>
                                    {/* Additional contracts could be added here */}
                                </select>
                            </div>
                            
                            {createGameError && <p className="text-red-500 text-sm">{createGameError}</p>}
                            
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowCreateGameModal(false);
                                        setCreateGameError("");
                                    }}
                                    className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateNewGame}
                                    disabled={isCreatingGame}
                                    className={`px-4 py-2 text-sm ${isCreatingGame ? "bg-gray-500" : "bg-pink-600 hover:bg-pink-700"} text-white rounded-lg transition duration-300 flex items-center`}
                                >
                                    {isCreatingGame ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating...
                                        </>
                                    ) : "Create Game"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-gray-800 p-10 rounded-xl shadow-2xl w-full max-w-xl">
                <h1 className="text-4xl font-extrabold text-center text-white mb-8">Start Playing Now</h1>

                {/* Block52 Wallet Section */}
                <div className="bg-gray-700 p-4 rounded-lg mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-xl font-bold text-white">Block52 Game Wallet</h2>
                        <div className="relative group">
                            <svg
                                className="w-5 h-5 text-gray-400 hover:text-white cursor-help transition-colors"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <p className="mb-2">This is your Layer 2 gaming wallet, automatically created for you. No Web3 wallet required!</p>
                                <p className="mb-2">You can deposit funds using ERC20 tokens, and the bridge will automatically credit your game wallet.</p>
                                <p>All your in-game funds are secured and can be withdrawn at any time.</p>
                                <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>
                    </div>
                    {publicKey && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <p className="text-white text-sm">
                                    Address: <span className="font-mono text-pink-500">{formatAddress(publicKey)}</span>
                                </p>
                                <button onClick={() => setShowImportModal(true)} className="text-sm text-blue-400 hover:text-blue-300 transition duration-300">
                                    Import Private Key
                                </button>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-white text-sm">
                                    Balance: <span className="font-bold text-pink-500">${formatBalance(b52Balance || "0")} USDC</span>
                                </p>
                                <button
                                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                                    className="text-sm text-blue-400 hover:text-blue-300 transition duration-300"
                                >
                                    {showPrivateKey ? "Hide Private Key" : "Show Private Key"}
                                </button>
                            </div>
                            {showPrivateKey && (
                                <div className="mt-2 p-2 bg-gray-800 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <p className="text-white text-sm font-mono break-all">{localStorage.getItem(STORAGE_PRIVATE_KEY)}</p>
                                        <button
                                            onClick={handleCopyPrivateKey}
                                            className="ml-2 px-2 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition duration-300"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Link
                                    to="/qr-deposit"
                                    className="block flex-1 text-center text-white bg-green-600 hover:bg-green-700 rounded-xl py-2 px-4 text-sm font-bold transition duration-300 transform hover:scale-105 shadow-lg"
                                >
                                    Deposit
                                </Link>
                                <button
                                    onClick={() => setShowCreateGameModal(true)}
                                    className="block flex-1 text-center text-white bg-blue-600 hover:bg-blue-700 rounded-xl py-2 px-4 text-sm font-bold transition duration-300 transform hover:scale-105 shadow-lg"
                                >
                                    Create New Game
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Web3 Wallet Section */}
                <div className="bg-gray-700 p-4 rounded-lg mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-xl font-bold text-white">Web3 Wallet</h2>
                        <div className="relative group">
                            <svg
                                className="w-5 h-5 text-gray-400 hover:text-white cursor-help transition-colors"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <p className="mb-2">Optional: Connect your Web3 wallet (like MetaMask) for additional features.</p>
                                <p>Not required to play - you can use the Block52 Game Wallet instead!</p>
                                <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-white text-sm">
                                Status:{" "}
                                <span className={`font-bold ${isConnected ? "text-green-500" : "text-red-500"}`}>
                                    {isConnected ? "Connected" : "Not Connected"}
                                </span>
                            </p>
                            {isConnected && address && (
                                <p className="text-white text-sm">
                                    Address: <span className="font-mono text-pink-500">{formatAddress(address)}</span>
                                </p>
                            )}
                        </div>
                        <div>
                            {!isConnected ? (
                                <button
                                    onClick={open}
                                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-300"
                                >
                                    Connect
                                </button>
                            ) : (
                                <button
                                    onClick={disconnect}
                                    className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-300"
                                >
                                    Disconnect
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Display new game address if available */}
                {newGameAddress && (
                    <div className="bg-gray-700 p-4 rounded-lg mb-6">
                        <h3 className="text-lg font-bold text-white mb-2">New Game Created!</h3>
                        <p className="text-white text-sm mb-2">
                            Game Address: <span className="font-mono text-pink-500">{formatAddress(newGameAddress)}</span>
                        </p>
                        <div className="flex justify-between">
                            <button
                                onClick={() => navigator.clipboard.writeText(newGameAddress)}
                                className="text-blue-400 hover:text-blue-300 text-sm transition"
                            >
                                Copy Address
                            </button>
                            <Link
                                to={`/table/${newGameAddress}`}
                                className="text-green-400 hover:text-green-300 text-sm transition"
                            >
                                Go to Game
                            </Link>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Game options always visible */}
                    <div className="flex justify-between gap-6">
                        <button
                            onClick={() => handleGameType(GameType.CASH)}
                            className={`text-white hover:bg-gray-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md ${
                                typeSelected === "cash" ? "bg-pink-600" : "bg-gray-600"
                            }`}
                        >
                            Cash
                        </button>
                        <button
                            disabled={true}
                            className={`${disabledButtonClass} rounded-xl py-3 px-6 w-[50%] text-center shadow-md relative`}
                        >
                            Tournament
                            <div className="absolute top-1 right-1 bg-yellow-600 text-xs rounded px-1 text-white">Coming Soon</div>
                        </button>
                    </div>

                    <div className="flex justify-between gap-6">
                        <button
                            onClick={() => handleGameVariant(Variant.TEXAS_HOLDEM)}
                            className={`text-white hover:bg-gray-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md ${
                                variantSelected === "texas-holdem" ? "bg-pink-600" : "bg-gray-600"
                            }`}
                        >
                            Texas Holdem
                        </button>
                        <button
                            disabled={true}
                            className={`${disabledButtonClass} rounded-xl py-3 px-6 w-[50%] text-center shadow-md relative`}
                        >
                            Omaha
                            <div className="absolute top-1 right-1 bg-yellow-600 text-xs rounded px-1 text-white">Coming Soon</div>
                        </button>
                    </div>

                    <div className="flex justify-between gap-6">
                        <button
                            onClick={() => handleSeat(2)}
                            className={`text-white hover:bg-gray-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md ${
                                seatSelected === 2 ? "bg-pink-600" : "bg-gray-600"
                            }`}
                        >
                            2 Seats
                        </button>
                        <button
                            disabled={true}
                            className={`${disabledButtonClass} rounded-xl py-3 px-6 w-[50%] text-center shadow-md relative`}
                        >
                            6-9 Seats
                            <div className="absolute top-1 right-1 bg-yellow-600 text-xs rounded px-1 text-white">Coming Soon</div>
                        </button>
                    </div>

                    <Link
                        to={buildUrl()}
                        className="block text-center text-white bg-pink-600 hover:bg-pink-700 rounded-xl py-3 px-6 text-lg transition duration-300 transform hover:scale-105 shadow-md"
                    >
                        Next
                    </Link>
                </div>
            </div>

            {/* Reset Blockchain Button */}
            <div className="fixed bottom-4 right-4 flex flex-col items-end">
                <button
                    onClick={resetBlockchain}
                    disabled={isResetting}
                    className={`px-3 py-2 text-xs ${isResetting ? "bg-gray-600" : "bg-red-600 hover:bg-red-700"} text-white rounded-lg transition duration-300 opacity-70 hover:opacity-100 flex items-center`}
                >
                    {isResetting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Resetting Blockchain...
                        </>
                    ) : (
                        "Developer Testing Tool: Reset Blockchain"
                    )}
                </button>
                {isResetting && (
                    <div className="mt-2 p-2 bg-gray-800 bg-opacity-90 rounded text-xs text-white max-w-xs">
                        <p className="font-bold mb-1">Reset in progress:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-300">
                            <li>Clearing database collections</li>
                            <li>Purging transaction mempool</li>
                            <li>Creating genesis block</li>
                            <li>Reprocessing deposits</li>
                        </ul>
                        <p className="mt-1 text-yellow-300 text-[10px]">Please wait, this may take a minute...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
