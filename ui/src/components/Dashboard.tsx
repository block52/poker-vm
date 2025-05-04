import React, { useEffect, useState, useRef } from "react"; // Import React, useEffect, and useRef
import { Link, useNavigate } from "react-router-dom"; // Import Link for navigation
import { STORAGE_PUBLIC_KEY, STORAGE_PRIVATE_KEY } from "../hooks/useUserWallet";
import "./Dashboard.css"; // Import the CSS file with animations
import useUserWalletConnect from "../hooks/DepositPage/useUserWalletConnect"; // Add this import
import useUserWallet from "../hooks/useUserWallet"; // Add this import
import useNewCommand from "../hooks/DashboardPage/useNewCommand"; // Import the new hook
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { Wallet } from "ethers";
import BuyInModal from "./playPage/BuyInModal";
// Create an enum of game types
enum GameType {
    CASH = "cash",
    TOURNAMENT = "tournament"
}

enum Variant {
    TEXAS_HOLDEM = "texas-holdem",
    OMAHA = "omaha"
}

// Add network display component
const NetworkDisplay = ({ isMainnet = false }) => {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/60 rounded-full text-xs border border-blue-500/20">
            <div className={`w-2 h-2 rounded-full ${isMainnet ? "bg-green-500" : "bg-blue-400"}`}></div>
            <span className="text-gray-300">Block52 Chain</span>
        </div>
    );
};

// Add hexagon pattern SVG background
const HexagonPattern = () => {
    return (
        <div className="absolute inset-0 z-0 opacity-5 overflow-hidden pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(5)">
                        <path d="M25,3.4 L45,17 L45,43.4 L25,56.7 L5,43.4 L5,17 L25,3.4 z" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="0.6" fill="none" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hexagons)" />
            </svg>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const seats = [2, 6, 8];

    const navigate = useNavigate();
    const [publicKey, setPublicKey] = useState<string>();
    const [typeSelected, setTypeSelected] = useState<string>("cash");
    const [variantSelected, setVariantSelected] = useState<string>("texas-holdem");
    const [seatSelected, setSeatSelected] = useState<number>(2);
    const [limitTypeSelected, setLimitTypeSelected] = useState("no-limit");

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

    // Buy In Modal
    const [showBuyInModal, setShowBuyInModal] = useState(false);
    const [buyInTableId, setBuyInTableId] = useState(""); // Optional, if needed later

    // Add state for mouse position
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Add a ref for the animation frame ID
    const animationFrameRef = useRef<number | undefined>(undefined);

    // Add effect to track mouse movement
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Only update if no animation frame is pending
            if (!animationFrameRef.current) {
                animationFrameRef.current = requestAnimationFrame(() => {
                    // Calculate mouse position as percentage of window
                    const x = (e.clientX / window.innerWidth) * 100;
                    const y = (e.clientY / window.innerHeight) * 100;
                    setMousePosition({ x, y });
                    animationFrameRef.current = undefined;
                });
            }
        };

        window.addEventListener("mousemove", handleMouseMove);

        // Cleanup function to remove event listener and cancel any pending animation frames
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

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
            const apiUrl =
                window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:3000" : "https://node1.block52.xyz";

            // According to the SDK, RESET_BLOCKCHAIN expects [username, password] params
            // but our implementation doesn't currently require them
            const response = await axios.post(
                apiUrl,
                {
                    id: 1,
                    method: "reset_blockchain",
                    params: ["admin", "admin"] // Using placeholder values since our implementation ignores them
                },
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

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
    const disabledButtonClass = "text-gray-300 bg-gradient-to-br from-gray-600 to-gray-700 cursor-not-allowed shadow-inner border border-gray-600/30";

    function handleCashLimitType(arg0: number): void {
        throw new Error("Function not implemented.");
    }

    useEffect(() => {
        setLimitTypeSelected("no-limit"); // Default when changing variant
    }, [variantSelected]);

    return (
        <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden">
            {/* Background animations */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(61, 89, 161, 0.8) 0%, transparent 60%),
                        radial-gradient(circle at 0% 0%, rgba(42, 72, 143, 0.7) 0%, transparent 50%),
                        radial-gradient(circle at 100% 0%, rgba(66, 99, 175, 0.7) 0%, transparent 50%),
                        radial-gradient(circle at 0% 100%, rgba(30, 52, 107, 0.7) 0%, transparent 50%),
                        radial-gradient(circle at 100% 100%, rgba(50, 79, 151, 0.7) 0%, transparent 50%)
                    `,
                    backgroundColor: "#111827",
                    filter: "blur(40px)",
                    transition: "all 0.3s ease-out"
                }}
            />

            {/* Add hexagon pattern overlay */}
            <HexagonPattern />

            {/* Animated pattern overlay */}
            <div
                className="fixed inset-0 z-0 opacity-20"
                style={{
                    backgroundImage: `
                        repeating-linear-gradient(
                            ${45 + mousePosition.x / 10}deg,
                            rgba(42, 72, 143, 0.1) 0%,
                            rgba(61, 89, 161, 0.1) 25%,
                            rgba(30, 52, 107, 0.1) 50%,
                            rgba(50, 79, 151, 0.1) 75%,
                            rgba(42, 72, 143, 0.1) 100%
                        )
                    `,
                    backgroundSize: "400% 400%",
                    animation: "gradient 15s ease infinite",
                    transition: "background 0.5s ease"
                }}
            />

            {/* Moving light animation */}
            <div
                className="fixed inset-0 z-0 opacity-30"
                style={{
                    backgroundImage:
                        "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(59,130,246,0.1) 25%, rgba(0,0,0,0) 50%, rgba(59,130,246,0.1) 75%, rgba(0,0,0,0) 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 8s infinite linear"
                }}
            />

            {/* Import Private Key Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-gray-800 p-6 rounded-xl w-96 shadow-2xl border border-blue-400/20">
                        <h3 className="text-xl font-bold text-white mb-4">Import Private Key</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Enter private key (0x...)"
                                value={importKey}
                                onChange={e => setImportKey(e.target.value)}
                                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                            />
                            {importError && <p className="text-red-500 text-sm">{importError}</p>}
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setImportKey("");
                                        setImportError("");
                                    }}
                                    className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-300 shadow-inner"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImportPrivateKey}
                                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-300 shadow-md"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-gray-800 p-6 rounded-xl w-96 shadow-2xl border border-blue-400/20">
                        <h3 className="text-xl font-bold text-white mb-4">Create New Game</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-white text-sm mb-1">Game Contract</label>
                                <select
                                    value={selectedContractAddress}
                                    onChange={e => setSelectedContractAddress(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
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
                                    className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-300 shadow-inner"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateNewGame}
                                    disabled={isCreatingGame}
                                    className={`px-4 py-2 text-sm ${
                                        isCreatingGame ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
                                    } text-white rounded-lg transition duration-300 shadow-md flex items-center`}
                                >
                                    {isCreatingGame ? (
                                        <>
                                            <svg
                                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Game"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-gray-800/80 backdrop-blur-md p-10 rounded-xl shadow-2xl w-full max-w-xl border border-blue-400/20 z-10 transition-all duration-300 hover:shadow-blue-500/10">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-extrabold text-white text-shadow">Start Playing Now</h1>
                    <NetworkDisplay isMainnet={false} />
                </div>

                {/* Block52 Wallet Section */}
                <div className="bg-gray-700/90 backdrop-blur-sm p-5 rounded-xl mb-6 shadow-lg border border-blue-500/10 hover:border-blue-500/20 transition-all duration-300">
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
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 border border-blue-500/20">
                                <h3 className="text-blue-400 font-bold mb-2">Layer 2 Gaming Wallet</h3>
                                <p className="mb-2">This is your Layer 2 gaming wallet, automatically created for you with no Web3 wallet required!</p>
                                <p className="mb-2">You can deposit funds using ERC20 tokens, and the bridge will automatically credit your game wallet.</p>
                                <p>All your in-game funds are secured on the blockchain and can be withdrawn at any time.</p>
                                <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>
                    </div>

                    {publicKey && (
                        <div className="space-y-3">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center">
                                    <span className="text-gray-400 text-xs mr-2">Address</span>
                                    <div className="flex-1"></div>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-gray-800/60 rounded-lg border border-blue-500/10">
                                    <p className="font-mono text-blue-400 text-sm tracking-wider">{formatAddress(publicKey)}</p>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(publicKey || "");
                                        }}
                                        className="ml-2 p-1 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                                        title="Copy address"
                                    >
                                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                            <div className="flex items-center justify-between p-3 bg-gray-800/60 rounded-lg border border-blue-500/10">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                                        <span className="text-blue-400 font-bold">$</span>
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-bold">USDC</p>
                                        <p className="text-gray-400 text-xs">USD Coin</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-bold">${formatBalance(b52Balance || "0")}</p>
                                    <button
                                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                                        className="text-xs text-blue-400 hover:text-blue-300 transition duration-300"
                                    >
                                        {showPrivateKey ? "Hide Private Key" : "Show Private Key"}
                                    </button>
                                </div>
                            </div>

                            {showPrivateKey && (
                                <div className="p-2 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-blue-500/10">
                                    <div className="flex justify-between items-center">
                                        <p className="text-white text-sm font-mono break-all">{localStorage.getItem(STORAGE_PRIVATE_KEY)}</p>
                                        <button
                                            onClick={handleCopyPrivateKey}
                                            className="ml-2 p-1 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                                            title="Copy private key"
                                        >
                                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            )}
                            <div className="flex gap-2 pt-2">
                                <Link
                                    to="/qr-deposit"
                                    className="block flex-1 text-center text-white bg-gradient-to-br from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 rounded-xl py-2 px-4 text-sm font-bold transition duration-300 transform hover:scale-105 shadow-md"
                                >
                                    Deposit
                                </Link>
                                <button
                                    onClick={() => setShowCreateGameModal(true)}
                                    className="block flex-1 text-center text-white bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 rounded-xl py-2 px-4 text-sm font-bold transition duration-300 transform hover:scale-105 shadow-md"
                                >
                                    Create New Game
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Web3 Wallet Section */}
                <div className="bg-gray-700/90 backdrop-blur-sm p-5 rounded-xl mb-6 shadow-lg border border-blue-500/10 hover:border-blue-500/20 transition-all duration-300 opacity-80">
                    <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-xl font-bold text-white">
                            Web3 Wallet <span className="text-xs font-normal text-gray-400">(Optional)</span>
                        </h2>
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
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 border border-blue-500/20">
                                <h3 className="text-blue-400 font-bold mb-2">External Web3 Wallet</h3>
                                <p className="mb-2">Connect your favorite Web3 wallet like MetaMask, WalletConnect, or Coinbase Wallet.</p>
                                <p className="mb-2">This is completely optional - you can play using only the Block52 Game Wallet.</p>
                                <p>Having a connected wallet provides additional features and easier withdrawals in the future.</p>
                                <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-sm">Status:</span>
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                        isConnected ? "bg-green-500/20 text-green-400" : "bg-blue-500/10 text-blue-400"
                                    }`}
                                >
                                    {isConnected ? "Connected" : "Not Connected"}
                                </span>
                            </div>
                            {isConnected && address && (
                                <div className="flex items-center mt-2 bg-gray-800/40 rounded p-1.5 border border-blue-500/10">
                                    <span className="font-mono text-blue-400 text-xs">{formatAddress(address)}</span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(address || "");
                                        }}
                                        className="ml-2 p-0.5 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                                    >
                                        <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            {!isConnected ? (
                                <button
                                    onClick={open}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-br from-blue-500/70 to-blue-600/70 hover:from-blue-400 hover:to-blue-500 text-white rounded-lg transition duration-300 shadow-md"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Connect
                                </button>
                            ) : (
                                <button
                                    onClick={disconnect}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-lg transition duration-300 shadow-md"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                    </svg>
                                    Disconnect
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Display new game address if available */}
                {newGameAddress && (
                    <div className="bg-gray-700/90 backdrop-blur-sm p-5 rounded-xl mb-6 shadow-lg border border-blue-500/10 hover:border-blue-500/20 transition-all duration-300">
                        <h3 className="text-lg font-bold text-white mb-2">New Game Created!</h3>
                        <div className="p-3 bg-gray-800/60 rounded-lg border border-blue-500/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
                                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-gray-300 text-xs">Contract</p>
                                    <p className="font-mono text-blue-400 text-sm">{formatAddress(newGameAddress)}</p>
                                </div>
                            </div>
                            <div className="flex">
                                <button
                                    onClick={() => navigator.clipboard.writeText(newGameAddress)}
                                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                                    title="Copy address"
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
                                <Link
                                    to={`/table/${newGameAddress}`}
                                    className="p-2 text-green-400 hover:text-green-300 transition-colors ml-2"
                                    title="Go to game"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Game options always visible */}
                    <div className="flex justify-between gap-6">
                        <button
                            onClick={() => handleGameType(GameType.CASH)}
                            className={`text-white hover:bg-blue-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md ${
                                typeSelected === "cash" ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gray-600"
                            }`}
                        >
                            Cash
                        </button>
                        <button disabled={true} className={`${disabledButtonClass} rounded-xl py-3 px-6 w-[50%] text-center`}>
                            Tournament
                        </button>
                    </div>

                    <div className="flex justify-between gap-6">
                        <button
                            onClick={() => handleGameVariant(Variant.TEXAS_HOLDEM)}
                            className={`text-white hover:bg-blue-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md ${
                                variantSelected === "texas-holdem" ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gray-600"
                            }`}
                        >
                            Texas Holdem
                        </button>
                        <button disabled={true} className={`${disabledButtonClass} rounded-xl py-3 px-6 w-[50%] text-center`}>
                            Omaha
                        </button>
                    </div>
                    <div className="flex justify-between gap-6">
                        {["no-limit", "pot-limit", "fixed-limit"].map(limit => (
                            <button
                                key={limit}
                                onClick={() => {
                                    console.log("=== Limit Type Selected ===");
                                    console.log("Limit:", limit);
                                    setLimitTypeSelected(limit);
                                    // TODO: Wire limitTypeSelected into game creation logic
                                }}
                                className={`text-white capitalize hover:bg-blue-700 rounded-xl py-3 px-4 w-[33%] text-center transition duration-300 transform hover:scale-105 shadow-md ${
                                    limitTypeSelected === limit ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gray-600"
                                }`}
                            >
                                {limit.replace("-", " ")}
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-between gap-6">
                        <button
                            onClick={() => handleSeat(2)}
                            className={`text-white hover:bg-blue-700 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md ${
                                seatSelected === 2 ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gray-600"
                            }`}
                        >
                            2 Seats
                        </button>
                        <button disabled={true} className={`${disabledButtonClass} rounded-xl py-3 px-6 w-[50%] text-center`}>
                            6 Max
                        </button>
                        <button disabled={true} className={`${disabledButtonClass} rounded-xl py-3 px-6 w-[50%] text-center`}>
                            Full Ring
                        </button>
                    </div>
                    <div className="flex justify-between gap-6">
                    <button
                        onClick={() => {
                            setShowBuyInModal(true);
                            setBuyInTableId("0x22dfa2150160484310c5163f280f49e23b8fd34326"); //Change to selected Contract for dynamic
                        }}
                        className="w-full block text-center text-white bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 rounded-xl py-3 px-6 text-lg transition duration-300 transform hover:scale-105 shadow-md border border-blue-500/20"
                    >
                        Choose Table
                    </button>
                    </div>
                </div>
            </div>

            {/* Reset blockchain button was here, now commented out by user */}

            {/* Powered by Block52 */}
            <div className="fixed bottom-4 left-4 flex items-center z-10 opacity-30">
                <div className="flex flex-col items-start bg-transparent px-3 py-2 rounded-lg backdrop-blur-sm border-0">
                    <div className="text-left mb-1">
                        <span className="text-xs text-white font-medium tracking-wide  ">POWERED BY</span>
                    </div>
                    <img src="/block52.png" alt="Block52 Logo" className="h-12 w-auto object-contain interaction-none" />
                </div>
            </div>
            {showBuyInModal && (
                <BuyInModal
                    tableId={buyInTableId}
                    onClose={() => setShowBuyInModal(false)}
                    onJoin={(buyInAmount, waitForBigBlind) => {
                        localStorage.setItem("buy_in_amount", buyInAmount);
                        localStorage.setItem("wait_for_big_blind", JSON.stringify(waitForBigBlind));
                        navigate(`/table/${buyInTableId}`);
                    }}
                />
            )}
        </div>
    );
};

export default Dashboard;
