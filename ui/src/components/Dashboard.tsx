import React, { useEffect, useState, useRef, useCallback, useMemo } from "react"; // Import React, useEffect, and useRef
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation

import "./Dashboard.css"; // Import the CSS file with animations

// Web3 Wallet Imports
import useUserWalletConnect from "../hooks/DepositPage/useUserWalletConnect"; //  Keep for Web3 wallet
import { Wallet, ethers } from "ethers";
import { TOKEN_ADDRESS } from "../config/constants";

const RPC_URL = import.meta.env.VITE_MAINNET_RPC_URL || "https://eth.llamarpc.com";
const USDC_ABI = [
    "function balanceOf(address account) view returns (uint256)"
];

import BuyInModal from "./playPage/BuyInModal";
import WithdrawalModal from "./WithdrawalModal";

// game wallet and SDK imports
import { STORAGE_PRIVATE_KEY } from "../hooks/useUserWallet";
import { Variant } from "./types";
import { formatAddress } from "./common/utils";
import { GameType } from "@bitcoinbrisbane/block52";
import { formatBalance } from "../utils/numberUtils"; // Import formatBalance utility function
import { useFindGames } from "../hooks/useFindGames"; // Import useFindGames hook
import { FindGamesReturn } from "../types/index"; // Import FindGamesReturn type
import { useAccount } from "../hooks/useAccount"; // Import useAccount hook
import { CreateTableOptions, useNewTable } from "../hooks/useNewTable"; // Import useNewTable hook

// Password protection utils
import { 
    checkAuthCookie, 
    handlePasswordSubmit as utilHandlePasswordSubmit,
    handlePasswordKeyPress as utilHandlePasswordKeyPress 
} from "../utils/passwordProtectionUtils";

// Club branding imports
import defaultLogo from "../assets/YOUR_CLUB.png";
import { colors, getAnimationGradient, getHexagonStroke, hexToRgba } from "../utils/colorConfig";

// Add network display component - Memoized to prevent re-renders
const NetworkDisplay = React.memo(({ isMainnet = false }: { isMainnet?: boolean }) => {
    const containerStyle = useMemo(() => ({ 
        backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
        border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
    }), []);
    
    const dotStyle = useMemo(() => 
        !isMainnet ? { backgroundColor: colors.brand.primary } : {}, 
    [isMainnet]);
    
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs" style={containerStyle}>
            <div className={`w-2 h-2 rounded-full ${isMainnet ? "bg-green-500" : ""}`}
                 style={dotStyle}></div>
            <span className="text-gray-300">Block52 Chain</span>
        </div>
    );
});

// Memoized Deposit button component  
const DepositButton = React.memo(({ onClick }: { onClick: () => void }) => {
    const buttonStyle = useMemo(() => ({ 
        background: `linear-gradient(135deg, ${colors.accent.success} 0%, ${hexToRgba(colors.accent.success, 0.8)} 100%)` 
    }), []);
    
    const handleClick = useCallback(() => {
        onClick();
    }, [onClick]);
    
    return (
        <button
            type="button"
            onClick={handleClick}
            className="flex-1 min-h-[60px] flex items-center justify-center text-white rounded-xl py-2 px-4 text-sm font-bold transition duration-300 transform hover:scale-105 shadow-md hover:opacity-90"
            style={buttonStyle}
        >
            Deposit
        </button>
    );
});

// Memoized Withdraw button component
const WithdrawButton = React.memo(({ onClick }: { onClick: () => void }) => {
    const buttonStyle = useMemo(() => ({ 
        background: `linear-gradient(135deg, ${colors.accent.withdraw} 0%, ${hexToRgba(colors.accent.withdraw, 0.8)} 100%)` 
    }), []);
    
    const handleClick = useCallback(() => {
        onClick();
    }, [onClick]);
    
    return (
        <button
            type="button"
            onClick={handleClick}
            className="flex-1 min-h-[60px] flex items-center justify-center text-white rounded-xl py-2 px-4 text-sm font-bold transition duration-300 transform hover:scale-105 shadow-md hover:opacity-90"
            style={buttonStyle}
        >
            Withdraw
        </button>
    );
});

// Memoized Create New Table button component
const CreateTableButton = React.memo(({ onClick }: { onClick: () => void }) => {
    const buttonStyle = useMemo(() => ({ 
        background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${hexToRgba(colors.brand.primary, 0.8)} 100%)` 
    }), []);
    
    const handleClick = useCallback(() => {
        onClick();
    }, [onClick]);
    
    return (
        <button
            type="button"
            onClick={handleClick}
            className="flex-1 min-h-[60px] flex items-center justify-center text-white rounded-xl py-2 px-4 text-sm font-bold transition duration-300 transform hover:scale-105 shadow-md hover:opacity-90"
            style={buttonStyle}
        >
            Create New Table
        </button>
    );
});

// Add hexagon pattern SVG background
const HexagonPattern = React.memo(() => {
    return (
        <div className="absolute inset-0 z-0 opacity-5 overflow-hidden pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(5)">
                        <path d="M25,3.4 L45,17 L45,43.4 L25,56.7 L5,43.4 L5,17 L25,3.4 z" stroke={getHexagonStroke()} strokeWidth="0.6" fill="none" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hexagons)" />
            </svg>
        </div>
    );
});

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
    
    // Use the findGames hook
    const { games, isLoading: gamesLoading, error: gamesError, refetch: refetchGames }: FindGamesReturn = useFindGames();

    // Add useAccount hook to get account nonce
    const { account, isLoading: accountLoading, error: accountError, refetch: refetchAccount } = useAccount(publicKey);
    
    // Use the new useNewTable hook from hooks directory
    const { createTable, isCreating: isCreatingTable, error: createTableError } = useNewTable();

    const [showImportModal, setShowImportModal] = useState(false);
    const [importKey, setImportKey] = useState("");
    const [importError, setImportError] = useState("");
    const [showPrivateKey, setShowPrivateKey] = useState(false);

    // New game creation states
    const [showCreateGameModal, setShowCreateGameModal] = useState(false);
    const [selectedContractAddress, setSelectedContractAddress] = useState("0x4c1d6ea77a2ba47dcd0771b7cde0df30a6df1bfaa7");
    const [createGameError, setCreateGameError] = useState("");
    // Modal game options
    const [modalGameType, setModalGameType] = useState<GameType>(GameType.CASH);
    const [modalMinBuyIn, setModalMinBuyIn] = useState(10);
    const [modalMaxBuyIn, setModalMaxBuyIn] = useState(100);
    const [modalSitAndGoBuyIn, setModalSitAndGoBuyIn] = useState(10); // Single buy-in for Sit & Go
    const [modalPlayerCount, setModalPlayerCount] = useState(4);

    // Buy In Modal
    const [showBuyInModal, setShowBuyInModal] = useState(false);
    const [buyInTableId, setBuyInTableId] = useState(""); // Optional, if needed later
    
    // Withdrawal Modal
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    
    // State for showing all tables
    const [showAllTables, setShowAllTables] = useState(false);
    
    // State for copy notification
    const [copiedTableId, setCopiedTableId] = useState<string | null>(null);

    // Add state for mouse position
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    
    // Web3 wallet balance state
    const [web3Balance, setWeb3Balance] = useState<string>("0.00");
    
    // Function to get USDC balance of connected wallet
    const fetchWeb3Balance = useCallback(async () => {
        if (!address) return;

        try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const usdcContract = new ethers.Contract(TOKEN_ADDRESS, USDC_ABI, provider);
            const balance = await usdcContract.balanceOf(address);
            const formattedBalance = ethers.formatUnits(balance, 6); // USDC has 6 decimals
            const roundedBalance = parseFloat(formattedBalance).toFixed(2);
            setWeb3Balance(roundedBalance);
        } catch (error) {
            console.error("Error fetching USDC balance:", error);
            setWeb3Balance("0.00");
        }
    }, [address]);

    // Fetch balance when wallet connects
    useEffect(() => {
        if (address) {
            fetchWeb3Balance();
        }
    }, [fetchWeb3Balance, address]);

    // Add a ref for the animation frame ID
    const animationFrameRef = useRef<number | undefined>(undefined);

    // Password validation function
    const handlePasswordSubmit = () => {
        utilHandlePasswordSubmit(passwordInput, setIsAuthenticated, setPasswordError, setPasswordInput);
    };

    // Handle Enter key press in password input
    const handlePasswordKeyPress = (e: React.KeyboardEvent) => {
        utilHandlePasswordKeyPress(e, passwordInput, setIsAuthenticated, setPasswordError, setPasswordInput);
    };

    // Check for existing auth cookie on component mount
    useEffect(() => {
        if (checkAuthCookie()) {
            setIsAuthenticated(true);
        }
    }, []);

    // Add effect to track mouse movement - throttled to reduce re-renders
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!animationFrameRef.current) {
            animationFrameRef.current = requestAnimationFrame(() => {
                const x = Math.round((e.clientX / window.innerWidth) * 100);
                const y = Math.round((e.clientY / window.innerHeight) * 100);
                // Only update if position changed significantly (2% threshold)
                setMousePosition(prev => {
                    if (Math.abs(prev.x - x) > 2 || Math.abs(prev.y - y) > 2) {
                        return { x, y };
                    }
                    return prev;
                });
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


    const DEFAULT_GAME_CONTRACT = "0x4c1d6ea77a2ba47dcd0771b7cde0df30a6df1bfaa7"; // Example address

    // Function to handle creating a new game using the new hook
    const handleCreateNewGame = async () => {
        if (!publicKey) {
            setCreateGameError("No wallet address available. Please create or import a wallet first.");
            return;
        }

        if (!account) {
            setCreateGameError("Account data not loaded. Please wait and try again.");
            return;
        }

        setCreateGameError("");

        try {
            // Build game options from modal selections
            // For Sit & Go/Tournament, use the same value for min and max buy-in
            // const isTournament = modalGameType === GameType.SIT_AND_GO || modalGameType === GameType.TOURNAMENT;

            const gameOptions: CreateTableOptions = {
                type: modalGameType,
                minBuyIn: modalMinBuyIn,
                maxBuyIn: modalMaxBuyIn,
                minPlayers: modalPlayerCount,
                maxPlayers: modalPlayerCount
            };
            
            // Use the createTable function from the hook
            const tableAddress = await createTable(publicKey, account.nonce, gameOptions);
            
            if (tableAddress) {
                setShowCreateGameModal(false);
                
                // Refresh account data to get updated nonce
                await refetchAccount();
                
                // Refresh the games list
                await refetchGames();
            }
        } catch (error: any) {
            console.error("Error creating table:", error);
            setCreateGameError(error.message || "An unexpected error occurred");
        }
    };

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
            // fetchAccountBalance(true);
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
            console.error("Failed to import private key:", err);
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
    
    // Memoized background styles to prevent re-renders
    const backgroundStyle1 = useMemo(() => ({
        backgroundImage: getAnimationGradient(mousePosition.x, mousePosition.y),
        backgroundColor: colors.table.bgBase,
        filter: "blur(40px)",
        transition: "all 0.3s ease-out"
    }), [mousePosition.x, mousePosition.y]);
    
    const backgroundStyle2 = useMemo(() => ({
        backgroundImage: `
            repeating-linear-gradient(
                ${45 + mousePosition.x / 10}deg,
                ${hexToRgba(colors.animation.color2, 0.1)} 0%,
                ${hexToRgba(colors.animation.color1, 0.1)} 25%,
                ${hexToRgba(colors.animation.color4, 0.1)} 50%,
                ${hexToRgba(colors.animation.color5, 0.1)} 75%,
                ${hexToRgba(colors.animation.color2, 0.1)} 100%
            )
        `,
        backgroundSize: "400% 400%",
        animation: "gradient 15s ease infinite",
        transition: "background 0.5s ease"
    }), [mousePosition.x]);
    
    const backgroundStyle3 = useMemo(() => ({
        backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${hexToRgba(colors.brand.primary, 0.1)} 25%, rgba(0,0,0,0) 50%, ${hexToRgba(colors.brand.primary, 0.1)} 75%, rgba(0,0,0,0) 100%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 8s infinite linear"
    }), []);
    
    // Memoized card styles
    const mainCardStyle = useMemo(() => ({
        borderColor: hexToRgba(colors.brand.primary, 0.2)
    }), []);
    
    const walletSectionStyle = useMemo(() => ({
        backgroundColor: hexToRgba(colors.ui.bgMedium, 0.9),
        border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
    }), []);

    useEffect(() => {
        setLimitTypeSelected("no-limit"); // Default when changing variant
    }, [variantSelected]);

    const handleGameType = (type: string) => {
        if (type === GameType.CASH) {
            setTypeSelected("cash");
        } 
        if (type === GameType.TOURNAMENT) {
            setTypeSelected("tournament");
        }
    };
    
    // Memoized hover handlers
    const handleWalletMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.2);
    }, []);
    
    const handleWalletMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.1);
    }, []);
    
    // Memoized BuyInModal callbacks
    const handleBuyInModalClose = useCallback(() => {
        setShowBuyInModal(false);
    }, []);
    
    const handleBuyInModalJoin = useCallback((buyInAmount: string, waitForBigBlind: boolean) => {
        localStorage.setItem("buy_in_amount", buyInAmount);
        localStorage.setItem("wait_for_big_blind", JSON.stringify(waitForBigBlind));
        navigate(`/table/${buyInTableId}`);
    }, [navigate, buyInTableId]);
    
    // Memoized Create Table callback
    const handleCreateTableClick = useCallback(() => {
        // Reset modal values to defaults when opening
        setModalGameType(GameType.CASH);
        setModalMinBuyIn(10);
        setModalMaxBuyIn(100);
        setModalSitAndGoBuyIn(10);
        setModalPlayerCount(4);
        setShowCreateGameModal(true);
    }, []);
    
    // Memoized Deposit callback
    const handleDepositClick = useCallback(() => {
        navigate("/qr-deposit");
    }, [navigate]);
    
    // Memoized Withdrawal callback
    const handleWithdrawClick = useCallback(() => {
        setShowWithdrawalModal(true);
    }, []);
    
    // Memoized Import Modal callback
    const handleImportModalClick = useCallback(() => {
        setShowImportModal(true);
    }, []);
    
    // Memoized game selection callbacks
    const handleCashGameClick = useCallback(() => {
        handleGameType(GameType.CASH);
    }, []);
    
    const handleTexasHoldemClick = useCallback(() => {
        handleGameVariant(Variant.TEXAS_HOLDEM);
    }, []);
    
    const handleHeadsUpClick = useCallback(() => {
        handleSeat(2);
    }, []);
    
    // Memoized Choose Table callback
    const handleChooseTableClick = useCallback(() => {
        if (games && games.length > 0) {
            setShowBuyInModal(true);
            setBuyInTableId(games[0].address);
        }
    }, [games]);

    return (
        <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden">
            {/* Background animations */}
            <div
                className="fixed inset-0 z-0"
                style={backgroundStyle1}
            />

            {/* Add hexagon pattern overlay */}
            <HexagonPattern />

            {/* Animated pattern overlay */}
            <div
                className="fixed inset-0 z-0 opacity-20"
                style={backgroundStyle2}
            />

            {/* Moving light animation */}
            <div
                className="fixed inset-0 z-0 opacity-30"
                style={backgroundStyle3}
            />

            {/* Password Protection Modal */}
            {!isAuthenticated && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="backdrop-blur-md p-8 rounded-xl w-96 shadow-2xl relative overflow-hidden" style={{ 
                        backgroundColor: hexToRgba(colors.ui.bgDark, 0.9),
                        border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                    }}>
                        {/* Web3 styled background */}
                        <div className="absolute inset-0 rounded-xl" style={{ 
                            background: `linear-gradient(135deg, ${hexToRgba(colors.brand.primary, 0.1)} 0%, ${hexToRgba(colors.brand.secondary, 0.1)} 100%)`
                        }}></div>
                        <div className="absolute top-0 left-0 w-full h-1 animate-pulse" style={{ 
                            background: `linear-gradient(90deg, ${colors.brand.primary}, ${colors.accent.glow}, ${colors.brand.primary})`
                        }}></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-center mb-4">
                                <img src="/block52.png" alt="Block52 Logo" className="h-16 w-auto object-contain" />
                            </div>
                            
                            <div className="flex items-center justify-center mb-6">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{
                                    background: `linear-gradient(135deg, ${hexToRgba(colors.brand.primary, 0.2)} 0%, ${hexToRgba(colors.brand.secondary, 0.2)} 100%)`,
                                    border: `1px solid ${hexToRgba(colors.brand.primary, 0.3)}`
                                }}>
                                    <svg className="w-8 h-8" style={{ color: colors.brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                        onKeyDown={handlePasswordKeyPress}
                                        className="w-full p-3 rounded-lg backdrop-blur-sm text-white focus:outline-none transition-all duration-200 pr-12"
                                        style={{
                                            backgroundColor: hexToRgba(colors.ui.bgMedium, 0.8),
                                            border: `1px solid ${hexToRgba(colors.brand.primary, 0.3)}`,
                                            boxShadow: `0 0 0 2px ${hexToRgba(colors.brand.primary, 0.5)}`
                                        }}
                                        onFocus={(e) => e.target.style.border = `1px solid ${colors.brand.primary}`}
                                        onBlur={(e) => e.target.style.border = `1px solid ${hexToRgba(colors.brand.primary, 0.3)}`}
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
                                    className="w-full py-3 text-white rounded-lg transition duration-300 transform hover:scale-105 shadow-md font-semibold"
                                    style={{
                                        background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${hexToRgba(colors.brand.primary, 0.8)} 100%)`,
                                        border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.target as HTMLButtonElement).style.background = `linear-gradient(135deg, ${hexToRgba(colors.brand.primary, 0.9)} 0%, ${hexToRgba(colors.brand.primary, 0.7)} 100%)`;
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.target as HTMLButtonElement).style.background = `linear-gradient(135deg, ${colors.brand.primary} 0%, ${hexToRgba(colors.brand.primary, 0.8)} 100%)`;
                                    }}
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
                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.brand.primary }}></div>
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
                            <div className="p-6 rounded-xl w-96 shadow-2xl border" style={{ backgroundColor: colors.ui.bgDark, borderColor: hexToRgba(colors.brand.primary, 0.2) }}>
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
                                            className="px-4 py-2 text-sm text-white rounded-lg transition duration-300 shadow-md hover:opacity-90"
                                            style={{ backgroundColor: colors.brand.primary }}
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
                            <div className="p-6 rounded-xl w-96 shadow-2xl border" style={{ backgroundColor: colors.ui.bgDark, borderColor: hexToRgba(colors.brand.primary, 0.2) }}>
                                <h3 className="text-xl font-bold text-white mb-4">Create New Table</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-white text-sm mb-1">Game Type</label>
                                        <select
                                            value={modalGameType}
                                            onChange={e => setModalGameType(e.target.value as GameType)}
                                            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                        >
                                            <option value={GameType.CASH}>Cash Game</option>
                                            <option value={GameType.TOURNAMENT}>Tournament</option>
                                            <option value={GameType.SIT_AND_GO}>Sit & Go</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-white text-sm mb-1">Number of Players</label>
                                        <select
                                            value={modalPlayerCount}
                                            onChange={e => setModalPlayerCount(Number(e.target.value))}
                                            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                        >
                                            <option value={4}>4 Players (Sit & Go)</option>
                                            <option value={9}>9 Players (Full Ring)</option>
                                        </select>
                                    </div>

                                    {/* Show different fields based on game type */}
                                    {(modalGameType === GameType.SIT_AND_GO || modalGameType === GameType.TOURNAMENT) ? (
                                        // For Sit & Go and Tournament: Single buy-in field
                                        <div>
                                            <label className="block text-white text-sm mb-1">Tournament Buy-In ($)</label>
                                            <input
                                                type="number"
                                                value={modalSitAndGoBuyIn}
                                                onChange={e => setModalSitAndGoBuyIn(Number(e.target.value))}
                                                min="10"
                                                max="10"
                                                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">All players pay the same entry fee</p>
                                        </div>
                                    ) : (
                                        // For Cash games: Min and Max buy-in fields
                                        <>
                                            <div>
                                                <label className="block text-white text-sm mb-1">Minimum Buy-In ($)</label>
                                                <input
                                                    type="number"
                                                    value={modalMinBuyIn}
                                                    onChange={e => setModalMinBuyIn(Number(e.target.value))}
                                                    min="1"
                                                    max="1000"
                                                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-white text-sm mb-1">Maximum Buy-In ($)</label>
                                                <input
                                                    type="number"
                                                    value={modalMaxBuyIn}
                                                    onChange={e => setModalMaxBuyIn(Number(e.target.value))}
                                                    min="1"
                                                    max="10000"
                                                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-white text-sm mb-1">Variant</label>
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
                                    {createTableError && <p className="text-red-500 text-sm">{createTableError.message}</p>}

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
                                            disabled={isCreatingTable || accountLoading}
                                            className={`px-4 py-2 text-sm text-white rounded-lg transition duration-300 shadow-md flex items-center ${
                                                isCreatingTable || accountLoading ? "bg-gray-500" : "hover:opacity-90"
                                            }`}
                                            style={isCreatingTable || accountLoading ? {} : { backgroundColor: colors.brand.primary }}
                                        >
                                            {isCreatingTable ? (
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
                                            ) : accountLoading ? (
                                                "Loading Account..."
                                            ) : (
                                                "Create Game"
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-800/80 backdrop-blur-md p-10 rounded-xl shadow-2xl w-full max-w-xl border z-10 transition-all duration-300 hover:shadow-blue-500/10" style={mainCardStyle}>
                        {/* Club Logo */}
                        <div className="flex flex-col items-center mb-6">
                            <img 
                                src={import.meta.env.VITE_CLUB_LOGO || defaultLogo} 
                                alt="Club Logo" 
                                className="w-32 h-32 object-contain"
                            />
                        </div>
                        
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-4xl font-extrabold text-white text-shadow">Start Playing Now</h1>
                            <NetworkDisplay isMainnet={false} />
                        </div>

                        {/* Block52 Wallet Section */}
                        <div className="backdrop-blur-sm p-5 rounded-xl mb-6 shadow-lg transition-all duration-300" 
                             style={walletSectionStyle}
                             onMouseEnter={handleWalletMouseEnter}
                             onMouseLeave={handleWalletMouseLeave}>
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
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20" style={{
                                        backgroundColor: colors.ui.bgDark,
                                        border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                                    }}>
                                        <h3 className="font-bold mb-2" style={{ color: colors.brand.primary }}>Layer 2 Gaming Wallet</h3>
                                        <p className="mb-2">This is your Layer 2 gaming wallet, automatically created for you with no Web3 wallet required!</p>
                                        <p className="mb-2">You can deposit funds using ERC20 tokens, and the bridge will automatically credit your game wallet.</p>
                                        <p>All your in-game funds are secured on the blockchain and can be withdrawn at any time.</p>
                                        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 border-8 border-transparent" style={{ borderTopColor: colors.ui.bgDark }}></div>
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
                                        <div className="flex items-center justify-between p-2 rounded-lg" style={{
                                            backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                                            border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                                        }}>
                                            <p className="font-mono text-xs tracking-wider break-all hidden md:block" style={{ color: colors.brand.primary }}>{publicKey}</p>
                                            <p className="font-mono text-xs tracking-wider md:hidden" style={{ color: colors.brand.primary }}>{formatAddress(publicKey)}</p>
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(publicKey || "");
                                                    }}
                                                    className="ml-2 p-1 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                                                    title="Copy address"
                                                >
                                                    <svg className="w-4 h-4" style={{ color: colors.brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                                    <div className="flex items-center justify-between p-3 rounded-lg" style={{
                                        backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                                        border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                                    }}>
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: hexToRgba(colors.brand.primary, 0.2) }}>
                                                <span className="font-bold" style={{ color: colors.brand.primary }}>$</span>
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-bold">USDC</p>
                                                <p className="text-gray-400 text-xs">USD Coin</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-bold">
                                                {accountLoading ? (
                                                    <span className="text-gray-400">Loading...</span>
                                                ) : accountError ? (
                                                    <span className="text-red-400">Error</span>
                                                ) : account ? (
                                                    `$${formatBalance(account.balance)}`
                                                ) : (
                                                    <span className="text-gray-400">No data</span>
                                                )}
                                            </p>
                                            <button
                                                onClick={() => setShowPrivateKey(!showPrivateKey)}
                                                className="text-xs transition duration-300 hover:opacity-80" style={{ color: colors.brand.primary }}
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
                                                    <svg className="w-4 h-4" style={{ color: colors.brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    <div className="flex items-center gap-2 pt-2">
                                        <DepositButton onClick={handleDepositClick} />
                                        <WithdrawButton onClick={handleWithdrawClick} />
                                        <CreateTableButton onClick={handleCreateTableClick} />
                                    </div>
                                    <div className="mt-2 flex justify-center">
                                        <button
                                            onClick={handleImportModalClick}
                                            className="text-sm underline transition duration-300 hover:opacity-80"
                                            style={{ color: colors.brand.primary }}
                                        >
                                            Import Private Key
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Web3 Wallet Section */}
                        <div className="backdrop-blur-sm p-5 rounded-xl mb-6 shadow-lg transition-all duration-300" 
                             style={{
                                 backgroundColor: hexToRgba(colors.ui.bgMedium, 0.9),
                                 border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                             }}
                             onMouseEnter={(e) => {
                                 e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.2);
                             }}
                             onMouseLeave={(e) => {
                                 e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.1);
                             }}>
                            <div className="flex items-center gap-2 mb-4">
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
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20" style={{
                                        backgroundColor: colors.ui.bgDark,
                                        border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                                    }}>
                                        <h3 className="font-bold mb-2" style={{ color: colors.brand.primary }}>External Web3 Wallet</h3>
                                        <p className="mb-2">Connect your favorite Web3 wallet like MetaMask, WalletConnect, or Coinbase Wallet.</p>
                                        <p className="mb-2">This is completely optional - you can play using only the Block52 Game Wallet.</p>
                                        <p>Having a connected wallet provides additional features and easier withdrawals in the future.</p>
                                        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 border-8 border-transparent" style={{ borderTopColor: colors.ui.bgDark }}></div>
                                    </div>
                                </div>
                            </div>

                            {!isConnected ? (
                                <button
                                    onClick={open}
                                    className="w-full py-3 px-4 rounded-lg transition duration-300 shadow-md hover:opacity-90"
                                    style={{ 
                                        background: `linear-gradient(135deg, ${hexToRgba(colors.brand.primary, 0.7)} 0%, ${hexToRgba(colors.brand.primary, 0.8)} 100%)` 
                                    }}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span className="text-white">Connect Wallet</span>
                                    </div>
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center" style={{ color: "white" }}>
                                        <span>
                                            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                                        </span>
                                        <button
                                            onClick={disconnect}
                                            className="text-xs px-3 py-1 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-lg transition duration-300 shadow-md"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                    
                                    <div className="p-3 rounded-lg" style={{
                                        backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                                        border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                                    }}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: hexToRgba(colors.brand.primary, 0.2) }}>
                                                    <span className="font-bold text-lg" style={{ color: colors.brand.primary }}>$</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold" style={{ color: "white" }}>Web3 Wallet USDC Balance</p>
                                                    <p className="text-xs" style={{ color: colors.ui.textSecondary }}>Available on Ethereum Mainnet</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-right">
                                                    <p className="text-lg font-bold" style={{ color: colors.brand.primary }}>
                                                        ${web3Balance}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => fetchWeb3Balance()}
                                                    className="p-1.5 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                                                    title="Refresh balance"
                                                >
                                                    <svg className="w-4 h-4" style={{ color: colors.brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Available Games Section */}
                        {games && games.length > 0 && (
                            <div className="bg-gray-700/90 backdrop-blur-sm p-5 rounded-xl mb-6 shadow-lg border border-blue-500/10 hover:hexToRgba(colors.brand.primary, 0.2) transition-all duration-300">
                                <h3 className="text-lg font-bold text-white mb-2">Available Tables</h3>
                                <div className="space-y-3">
                                    {games.slice(0, showAllTables ? undefined : 3).map((game, index) => (
                                        <div key={index} className="p-3 bg-gray-800/60 rounded-lg border border-blue-500/10 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: hexToRgba(colors.brand.primary, 0.2) }}>
                                                    <svg className="w-4 h-4" style={{ color: colors.brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                                                        />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-gray-300 text-xs">
                                                        Texas Hold'em 
                                                        {game.gameOptions?.minPlayers && game.gameOptions?.maxPlayers && (
                                                            <span className="ml-1">
                                                                ({game.gameOptions.minPlayers === 2 ? "Heads Up" : 
                                                                  game.gameOptions.minPlayers === 6 ? "6-Max" : 
                                                                  game.gameOptions.minPlayers === 9 ? "Full Ring" : 
                                                                  `${game.gameOptions.minPlayers} Players`})
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-gray-500 text-xs font-mono mb-1">{formatAddress(game.address)}</p>
                                                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                                                        <span className="text-xs" style={{ color: colors.brand.primary }}>
                                                            Min: ${game.gameOptions?.minBuyIn && game.gameOptions.minBuyIn !== "0" ? formatBalance(game.gameOptions.minBuyIn) : "1.00"}
                                                        </span>
                                                        <span className="text-xs" style={{ color: colors.brand.primary }}>
                                                            Max: ${game.gameOptions?.maxBuyIn && game.gameOptions.maxBuyIn !== "0" ? formatBalance(game.gameOptions.maxBuyIn) : "100.00"}
                                                        </span>
                                                        <span className="text-xs" style={{ color: colors.brand.primary }}>
                                                            Blinds: ${game.gameOptions?.smallBlind && game.gameOptions.smallBlind !== "0" ? formatBalance(game.gameOptions.smallBlind) : "0.50"}/${game.gameOptions?.bigBlind && game.gameOptions.bigBlind !== "0" ? formatBalance(game.gameOptions.bigBlind) : "1.00"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <button
                                                        onClick={() => {
                                                            const tableUrl = `${window.location.origin}/table/${game.address}`;
                                                            navigator.clipboard.writeText(tableUrl);
                                                            setCopiedTableId(game.address);
                                                            setTimeout(() => setCopiedTableId(null), 2000);
                                                        }}
                                                        title="Copy table URL"
                                                        className="p-2 text-gray-400 hover:text-white transition-colors"
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
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white rounded shadow-lg whitespace-nowrap z-10" 
                                                             style={{ backgroundColor: colors.accent.success }}>
                                                            Table link copied!
                                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent" 
                                                                 style={{ borderTopColor: colors.accent.success }}></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setShowBuyInModal(true);
                                                        setBuyInTableId(game.address);
                                                    }}
                                                    title="Join this table"
                                                    className="px-3 py-1 text-sm text-white rounded-lg transition duration-300 shadow-md hover:opacity-90"
                                                    style={{ backgroundColor: colors.brand.primary }}
                                                >
                                                    Join Table
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {gamesLoading && (
                                    <div className="flex justify-center items-center py-3">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderBottomColor: colors.brand.primary }}></div>
                                    </div>
                                )}
                                {gamesError && (
                                    <div className="text-red-400 text-sm text-center py-2">
                                        Failed to load games. Please try again.
                                    </div>
                                )}
                                {games.length > 3 && (
                                    <div className="mt-2 flex justify-center">
                                        <button 
                                            onClick={() => setShowAllTables(!showAllTables)}
                                            className="text-sm transition duration-300 hover:opacity-80" 
                                            style={{ color: colors.brand.primary }}
                                        >
                                            {showAllTables ? "Show less" : `View more tables (${games.length - 3} more)`}
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

                        {/* Display new table address if available */}
                        {/* {newTableAddress && (
                            <div className="bg-gray-700/90 backdrop-blur-sm p-5 rounded-xl mb-6 shadow-lg border border-green-500/20 hover:border-green-500/30 transition-all duration-300">
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    New Table Created Successfully!
                                </h3>
                                <div className="p-3 bg-gray-800/60 rounded-lg border border-green-500/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-gray-300 text-xs">Table Address (Game Hash)</p>
                                            <p className="font-mono text-green-400 text-sm break-all">{newTableAddress}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => navigator.clipboard.writeText(newTableAddress)}
                                            className="p-2 text-green-400 hover:text-green-300 transition-colors"
                                            title="Copy table address"
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
                                                setBuyInTableId(newTableAddress);
                                            }}
                                            className="p-2 text-blue-400 hover:text-blue-300 transition-colors ml-1"
                                            title="Join this table"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-3 flex justify-center">
                                    <button
                                        onClick={() => {
                                            setShowBuyInModal(true);
                                            setBuyInTableId(newTableAddress);
                                        }}
                                        className="w-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white rounded-lg py-2 px-4 text-sm font-bold transition duration-300 transform hover:scale-105 shadow-md"
                                    >
                                        Join Your New Table
                                    </button>
                                </div>
                            </div>
                        )} */}

                        <div className="space-y-6">
                            {/* Game options always visible */}
                            <div className="flex justify-between gap-6">
                                <button
                                    onClick={handleCashGameClick}
                                    className="text-white hover:opacity-90 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md"
                                    style={{ 
                                        backgroundColor: typeSelected === "cash" ? colors.brand.primary : colors.ui.bgMedium,
                                        opacity: typeSelected === "cash" ? 1 : 0.7
                                    }}
                                >
                                    Cash
                                </button>
                                <button disabled={true} className={`${disabledButtonClass} rounded-xl py-3 px-6 w-[50%] text-center`}>
                                    Tournament
                                </button>
                            </div>

                            <div className="flex justify-between gap-6">
                                <button
                                    onClick={handleTexasHoldemClick}
                                    className="text-white hover:opacity-90 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md"
                                    style={{ 
                                        backgroundColor: variantSelected === "texas-holdem" ? colors.brand.primary : colors.ui.bgMedium,
                                        opacity: variantSelected === "texas-holdem" ? 1 : 0.7
                                    }}
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
                                        className="text-white capitalize hover:opacity-90 rounded-xl py-3 px-4 w-[33%] text-center transition duration-300 transform hover:scale-105 shadow-md"
                                        style={{ 
                                            backgroundColor: limitTypeSelected === limit ? colors.brand.primary : colors.ui.bgMedium,
                                            opacity: limitTypeSelected === limit ? 1 : 0.7
                                        }}
                                    >
                                        {limit.replace("-", " ")}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between gap-6">
                                <button
                                    onClick={handleHeadsUpClick}
                                    className="text-white hover:opacity-90 rounded-xl py-3 px-6 w-[50%] text-center transition duration-300 transform hover:scale-105 shadow-md"
                                    style={{ 
                                        backgroundColor: seatSelected === 2 ? colors.brand.primary : colors.ui.bgMedium,
                                        opacity: seatSelected === 2 ? 1 : 0.7
                                    }}
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
                                        onClick={handleChooseTableClick}
                                        title="Join this table"
                                        className="w-full block text-center text-white rounded-xl py-3 px-6 text-lg transition duration-300 transform hover:scale-105 shadow-md hover:opacity-90"
                                        style={{
                                            background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${hexToRgba(colors.brand.primary, 0.8)} 100%)`,
                                            border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                                        }}
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
                            <img src="/block52.png" alt="Block52 Logo" className="h-6 w-auto object-contain interaction-none" />
                        </div>
                    </div>
                    {showBuyInModal && (
                        <BuyInModal
                            tableId={buyInTableId}
                            onClose={handleBuyInModalClose}
                            onJoin={handleBuyInModalJoin}
                        />
                    )}
                    {showWithdrawalModal && (
                        <WithdrawalModal
                            isOpen={showWithdrawalModal}
                            onClose={() => setShowWithdrawalModal(false)}
                            onSuccess={() => {
                                // Refresh account balance after successful withdrawal
                                refetchAccount();
                            }}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default Dashboard;
