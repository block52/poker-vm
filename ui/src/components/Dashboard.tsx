import React, { useEffect, useState, useRef, useCallback } from "react"; // Import React, useEffect, and useRef
import { Link, useNavigate } from "react-router-dom"; // Import Link for navigation

import "./Dashboard.css"; // Import the CSS file with animations

// Web3 Wallet Imports
import useUserWalletConnect from "../hooks/DepositPage/useUserWalletConnect"; //  Keep for Web3 wallet
import { Wallet } from "ethers";

import BuyInModal from "./playPage/BuyInModal";

// game wallet and SDK imports
import { useNodeRpc } from "../context/NodeRpcContext"; // Use NodeRpcContext
import { STORAGE_PRIVATE_KEY } from "../hooks/useUserWallet";
import { GameType, Variant } from "./types";
import { formatAddress, formatBalance } from "./common/utils";
import { useFindGames } from "../hooks/useFindGames"; // Import useFindGames hook

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
    const navigate = useNavigate();
    const [typeSelected, setTypeSelected] = useState<string>("cash");
    const [variantSelected, setVariantSelected] = useState<string>("texas-holdem");
    const [seatSelected, setSeatSelected] = useState<number>(2);
    const [limitTypeSelected, setLimitTypeSelected] = useState("no-limit");
    const [publicKey, setPublicKey] = useState<string | undefined>(localStorage.getItem("user_eth_public_key") || undefined);

    // Password protection states
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [passwordInput, setPasswordInput] = useState<string>("");
    const [passwordError, setPasswordError] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const { isConnected, open, disconnect, address } = useUserWalletConnect();

    // Replace useAccountBalance with direct NodeRpcClient interaction
    const { client, isLoading: clientLoading, error: clientError } = useNodeRpc();
    const [accountBalance, setAccountBalance] = useState<string>("0");
    const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(true);
    const [balanceError, setBalanceError] = useState<Error | null>(null);
    const [accountNonce, setAccountNonce] = useState<number>(0); // Track nonce for transactions
    
    // Use the findGames hook
    const { games, isLoading: gamesLoading, error: gamesError, refetch: refetchGames } = useFindGames();

    const [showImportModal, setShowImportModal] = useState(false);
    const [importKey, setImportKey] = useState("");
    const [importError, setImportError] = useState("");
    const [showPrivateKey, setShowPrivateKey] = useState(false);

    // New game creation states
    const [showCreateGameModal, setShowCreateGameModal] = useState(false);
    const [selectedContractAddress, setSelectedContractAddress] = useState("0x22dfa2150160484310c5163f280f49e23b8fd34326");
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

    // Add this ref at the top of your component
    const initialLoadComplete = useRef(false);
    const lastFetchedPublicKey = useRef<string | undefined>(undefined);

    // Password validation function
    const handlePasswordSubmit = () => {
        if (passwordInput === "123") {
            setIsAuthenticated(true);
            setPasswordError("");
            setPasswordInput("");
        } else {
            setPasswordError("Invalid password. Please try again.");
            setPasswordInput("");
        }
    };

    // Handle Enter key press in password input
    const handlePasswordKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handlePasswordSubmit();
        }
    };

    // Add effect to track mouse movement
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!animationFrameRef.current) {
            animationFrameRef.current = requestAnimationFrame(() => {
                const x = (e.clientX / window.innerWidth) * 100;
                const y = (e.clientY / window.innerHeight) * 100;
                setMousePosition({ x, y });
                animationFrameRef.current = undefined;
            });
        }
    }, []);

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [handleMouseMove]);

    // Game contract addresses - in a real app, these would come from the API
    const DEFAULT_GAME_CONTRACT = "0x22dfa2150160484310c5163f280f49e23b8fd34326"; // Example address

    // Function to handle creating a new game using NodeRpcClient directly
    const handleCreateNewGame = async () => {
        if (!client) {
            setCreateGameError("Client not initialized");
            return;
        }

        setIsCreatingGame(true);
        setCreateGameError("");

        try {
            const gameContractAddress = selectedContractAddress || DEFAULT_GAME_CONTRACT;
            
            if (!publicKey) {
                setCreateGameError("No wallet address available. Please create or import a wallet first.");
                setIsCreatingGame(false);
                return;
            }
            
            // Create the new table using the client's newTable method
            // We use the current user's public key as the "from" parameter
            // The "to" parameter is the game contract schema address
            const result = await client.newTable(publicKey, gameContractAddress);
            
            if (result) {
                // The result is the table ID (contract address)
                setNewGameAddress(result);
                setShowCreateGameModal(false);

                // Refresh account data to get updated nonce
                fetchAccountBalance();
                
                // Refresh the games list
                await refetchGames();
            } else {
                setCreateGameError("Failed to create table - no table ID returned");
            }
        } catch (error: any) {
            console.error("Error creating table:", error);
            setCreateGameError(error.message || "An unexpected error occurred");
        } finally {
            setIsCreatingGame(false);
        }
    };

    // Function to fetch account balance directly using NodeRpcClient
    const fetchAccountBalance = useCallback(async (force = false) => {
        // Skip if no client or no public key
        if (!client || !publicKey) {
            !publicKey && setBalanceError(new Error("No address available"));
            setIsBalanceLoading(false);
            return;
        }
        
        // Skip if we've already loaded for this key and it's not forced
        if (!force && initialLoadComplete.current && lastFetchedPublicKey.current === publicKey) {
            return;
        }
        
        try {
            setIsBalanceLoading(true);
            
            const account = await client.getAccount(publicKey);
            setAccountBalance(account.balance);
            setAccountNonce(account.nonce);
            setBalanceError(null);
            
            // Mark that we've completed a load for this key
            initialLoadComplete.current = true;
            lastFetchedPublicKey.current = publicKey;
        } catch (err) {
            console.error("Error fetching account balance:", err);
            setBalanceError(err instanceof Error ? err : new Error("Failed to fetch balance"));
        } finally {
            setIsBalanceLoading(false);
        }
    }, [client, publicKey]);

    const generateNewWallet = () => {
        try {
            // Create a new random wallet
            const newWallet = Wallet.createRandom();
            
            // Save to localStorage
            localStorage.setItem(STORAGE_PRIVATE_KEY, newWallet.privateKey);
            localStorage.setItem("user_eth_public_key", newWallet.address);
            
            // Update the state
            setPublicKey(newWallet.address);
            
            // Force refresh data
            fetchAccountBalance(true);
        } catch (err) {
            console.error("Failed to generate new wallet:", err);
        }
    };

    useEffect(() => {
        const privateKey = localStorage.getItem(STORAGE_PRIVATE_KEY);
        if (!privateKey) {
            // Auto-generate a wallet if no private key exists
            generateNewWallet();
        } else {
            setPublicKey(localStorage.getItem("user_eth_public_key") || undefined);
        }
    }, []);

    // Update to fetch balance when publicKey or client changes
    useEffect(() => {
        if (publicKey && client && !clientLoading) {
            // Only fetch if public key changed or it's the initial load
            if (publicKey !== lastFetchedPublicKey.current || !initialLoadComplete.current) {
                fetchAccountBalance();
            }
        }
    }, [publicKey, clientLoading, fetchAccountBalance, client]);


    const handleGameVariant = (variant: Variant) => {
        if (variant === Variant.TEXAS_HOLDEM) {
            setVariantSelected("texas-holdem");
        }
        if (variant === Variant.OMAHA) {
            setVariantSelected("omaha");
        }
    };

    const handleSeat = (seat: number) => {
        setSeatSelected(seat);
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
            localStorage.setItem("user_eth_public_key", wallet.address);

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

    useEffect(() => {
        setLimitTypeSelected("no-limit"); // Default when changing variant
    }, [variantSelected]);

    const handleGameType = (type: GameType) => {
        if (type === GameType.CASH) {
            setTypeSelected("cash");
        } else if (type === GameType.TOURNAMENT) {
            setTypeSelected("tournament");
        }
    };

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

            {/* Password Protection Modal */}
            {!isAuthenticated && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-gray-800/90 backdrop-blur-md p-8 rounded-xl w-96 shadow-2xl border border-blue-400/20 relative overflow-hidden">
                        {/* Web3 styled background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-xl"></div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-pulse"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-center mb-4">
                                <img src="/block52.png" alt="Block52 Logo" className="h-16 w-auto object-contain" />
                            </div>
                            
                            <div className="flex items-center justify-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-400/30">
                                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                            </div>
                            
                            <h2 className="text-2xl font-bold text-white text-center mb-2 text-shadow">Secure Access</h2>
                            <p className="text-gray-300 text-center mb-6 text-sm">Enter password to access the Block52 demo</p>
                            
                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter password"
                                        value={passwordInput}
                                        onChange={e => setPasswordInput(e.target.value)}
                                        onKeyPress={handlePasswordKeyPress}
                                        className="w-full p-3 rounded-lg bg-gray-700/80 backdrop-blur-sm text-white border border-blue-500/30 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 pr-12"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                
                                {passwordError && (
                                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                                        <p className="text-red-400 text-sm text-center">{passwordError}</p>
                                    </div>
                                )}
                                
                                <button
                                    onClick={handlePasswordSubmit}
                                    className="w-full py-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white rounded-lg transition duration-300 transform hover:scale-105 shadow-md border border-blue-500/20 font-semibold"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                        </svg>
                                        Access Platform
                                    </div>
                                </button>
                            </div>
                            
                            <div className="mt-6 text-center">
                                <p className="text-xs text-gray-400">Block52 Blockchain Infrastructure Demo</p>
                                <div className="flex items-center justify-center gap-1 mt-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                                    <span className="text-xs text-gray-400">Secured by Block52</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Dashboard Content - Only show when authenticated */}
            {isAuthenticated && (
                <>
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
                                <h3 className="text-xl font-bold text-white mb-4">Create New Table</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-white text-sm mb-1">Card Game Contract</label>
                                        <select
                                            value={selectedContractAddress}
                                            onChange={e => setSelectedContractAddress(e.target.value)}
                                            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                        >
                                            <React.Fragment>
                                                <option value={DEFAULT_GAME_CONTRACT}>Texas Hold'em</option>
                                                <option value="" disabled>Omaha (Coming Soon)</option>
                                                <option value="" disabled>Seven Card Stud (Coming Soon)</option>
                                                <option value="" disabled>Blackjack (Coming Soon)</option>
                                            </React.Fragment>
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
                                                    Creating Table...
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
                                            <div className="flex items-center">
                                                <span className="text-xs text-gray-400 mr-2">Nonce: {accountNonce}</span>
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
                                            <p className="text-white font-bold">
                                                {isBalanceLoading ? (
                                                    <span className="text-gray-400">Loading...</span>
                                                ) : balanceError ? (
                                                    <span className="text-red-400">Error</span>
                                                ) : (
                                                    `$${formatBalance(accountBalance || "0")}`
                                                )}
                                            </p>
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
                                            Create New Table
                                        </button>
                                    </div>
                                    <div className="mt-2 flex justify-center">
                                        <button
                                            onClick={() => setShowImportModal(true)}
                                            className="text-blue-400 hover:text-blue-300 text-sm underline transition duration-300"
                                        >
                                            Import Private Key
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

                        {/* Available Games Section */}
                        {games && games.length > 0 && (
                            <div className="bg-gray-700/90 backdrop-blur-sm p-5 rounded-xl mb-6 shadow-lg border border-blue-500/10 hover:border-blue-500/20 transition-all duration-300">
                                <h3 className="text-lg font-bold text-white mb-2">Available Tables</h3>
                                <div className="space-y-3">
                                    {games.slice(0, 3).map((game, index) => (
                                        <div key={index} className="p-3 bg-gray-800/60 rounded-lg border border-blue-500/10 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
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
                                                    <p className="text-gray-300 text-xs">Texas Hold'em</p>
                                                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                                                        <span className="text-xs text-blue-400">Min: ${game.gameOptions?.minBuyIn ? formatBalance(game.gameOptions.minBuyIn) : "0.01"}</span>
                                                        <span className="text-xs text-blue-400">Max: ${game.gameOptions?.maxBuyIn ? formatBalance(game.gameOptions.maxBuyIn) : "1.0"}</span>
                                                        <span className="text-xs text-blue-400">Blinds: ${game.gameOptions?.smallBlind ? formatBalance(game.gameOptions.smallBlind) : "0.01"}/${game.gameOptions?.bigBlind ? formatBalance(game.gameOptions.bigBlind) : "0.02"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setShowBuyInModal(true);
                                                    setBuyInTableId(game.address);
                                                }}
                                                title="Open buy-in modal to join this table"
                                                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-300 shadow-md"
                                            >
                                                Join Table
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {gamesLoading && (
                                    <div className="flex justify-center items-center py-3">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                                    </div>
                                )}
                                {gamesError && (
                                    <div className="text-red-400 text-sm text-center py-2">
                                        Failed to load games. Please try again.
                                    </div>
                                )}
                                {games.length > 3 && (
                                    <div className="mt-2 flex justify-center">
                                        <button className="text-sm text-blue-400 hover:text-blue-300">
                                            View more tables ({games.length - 3} more)
                                        </button>
                                    </div>
                                )}
                                {games.length === 0 && !gamesLoading && !gamesError && (
                                    <div className="text-gray-300 text-sm text-center py-2">
                                        No tables found. Create your own table below!
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Display new game address if available */}
                        {/* {newGameAddress && (
                            <div className="bg-gray-700/90 backdrop-blur-sm p-5 rounded-xl mb-6 shadow-lg border border-blue-500/10 hover:border-blue-500/20 transition-all duration-300">
                                <h3 className="text-lg font-bold text-white mb-2">New Table Created!</h3>
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
                                            <p className="text-gray-300 text-xs">Table ID</p>
                                            <p className="font-mono text-blue-400 text-sm">{formatAddress(newGameAddress)}</p>
                                        </div>
                                    </div>
                                    <div className="flex">
                                        <button
                                            onClick={() => navigator.clipboard.writeText(newGameAddress)}
                                            className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                                            title="Copy table ID"
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
                                        <button
                                            onClick={() => {
                                                setShowBuyInModal(true);
                                                setBuyInTableId(DEFAULT_GAME_CONTRACT);
                                            }}
                                            className="p-2 text-green-400 hover:text-green-300 transition-colors ml-2"
                                            title="Join table"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-2 flex justify-center">
                                    <button
                                        onClick={() => {
                                            setShowBuyInModal(true);
                                            setBuyInTableId(DEFAULT_GAME_CONTRACT);
                                        }}
                                        className="text-sm text-blue-400 hover:text-blue-300"
                                    >
                                        Buy in to join this table
                                    </button>
                                </div>
                            </div>
                        )} */}

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
                                    Heads Up
                                </button>
                                <button disabled={true} className={`${disabledButtonClass} rounded-xl py-3 px-6 w-[50%] text-center`}>
                                    6 Max
                                </button>
                                <button disabled={true} className={`${disabledButtonClass} rounded-xl py-3 px-6 w-[50%] text-center`}>
                                    Full Ring
                                </button>
                            </div>
                            {games && games.length > 0 && (
                                <div className="flex justify-between gap-6">
                                    <button
                                        onClick={() => {
                                            setShowBuyInModal(true);
                                            setBuyInTableId(games[0].address);
                                        }}
                                        className="w-full block text-center text-white bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 rounded-xl py-3 px-6 text-lg transition duration-300 transform hover:scale-105 shadow-md border border-blue-500/20"
                                    >
                                        Choose Table
                                    </button>
                                </div>
                            )}
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
                </>
            )}
        </div>
    );
};

export default Dashboard;
