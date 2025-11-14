import React, { useEffect, useState, useRef, useCallback, useMemo } from "react"; // Import React, useEffect, and useRef
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation

import "./Dashboard.css"; // Import the CSS file with animations

// Base Chain imports (only for USDC deposits via bridge)
import { ethers } from "ethers";
import { BASE_RPC_URL, BASE_USDC_ADDRESS, BASE_CHAIN_ID } from "../config/constants";
import { useAccount as useWagmiAccount, useSwitchChain } from "wagmi";

import { microToUsdc } from "../constants/currency";

const RPC_URL = BASE_RPC_URL; // Base Chain RPC for USDC balance queries
const USDC_ABI = ["function balanceOf(address account) view returns (uint256)"];

import BuyInModal from "../components/playPage/BuyInModal";
import WithdrawalModal from "../components/WithdrawalModal";
import USDCDepositModal from "../components/USDCDepositModal";
import { NetworkSelector } from "../components/NetworkSelector";

// Game wallet and SDK imports
// ...existing code...
import { GameType } from "@bitcoinbrisbane/block52";
import { FindGamesReturn } from "../types/index"; // Import FindGamesReturn type

// Hook imports from barrel file
import { useUserWalletConnect, useFindGames, useNewTable, useTablePlayerCounts, useCosmosWallet } from "../hooks";
import type { CreateTableOptions } from "../hooks/useNewTable"; // Import type separately

// Cosmos wallet utils
import { isValidSeedPhrase } from "../utils/cosmos";

// Password protection utils
import {
    checkAuthCookie,
    handlePasswordSubmit as utilHandlePasswordSubmit,
    handlePasswordKeyPress as utilHandlePasswordKeyPress
} from "../utils/passwordProtectionUtils";

// Club branding imports
import { colors, getAnimationGradient, getHexagonStroke, hexToRgba } from "../utils/colorConfig";

// Copy to clipboard
const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
};

// Memoized Deposit button component
const DepositButton = React.memo(({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) => {
    const buttonStyle = useMemo(
        () => ({
            background: disabled
                ? `linear-gradient(135deg, ${hexToRgba(colors.ui.bgDark, 0.5)} 0%, ${hexToRgba(colors.ui.bgDark, 0.3)} 100%)`
                : `linear-gradient(135deg, ${colors.accent.success} 0%, ${hexToRgba(colors.accent.success, 0.8)} 100%)`
        }),
        [disabled]
    );

    const handleClick = useCallback(() => {
        if (!disabled) {
            onClick();
        }
    }, [onClick, disabled]);

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            className={`flex-1 min-h-[60px] flex items-center justify-center text-white rounded-xl py-2 px-4 text-sm font-bold transition duration-300 shadow-md ${
                disabled ? "cursor-not-allowed opacity-50" : "transform hover:scale-105 hover:opacity-90"
            }`}
            style={buttonStyle}
            title={disabled ? "Connect Web3 wallet to deposit" : "Deposit USDC"}
        >
            Deposit
        </button>
    );
});

// Memoized Withdraw button component
const WithdrawButton = React.memo(({ onClick }: { onClick: () => void }) => {
    const buttonStyle = useMemo(
        () => ({
            background: `linear-gradient(135deg, ${colors.accent.withdraw} 0%, ${hexToRgba(colors.accent.withdraw, 0.8)} 100%)`
        }),
        []
    );

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

const CreateTransferButton = React.memo(({ onClick }: { onClick: () => void }) => {
    const buttonStyle = useMemo(
        () => ({
            background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${hexToRgba(colors.brand.primary, 0.8)} 100%)`
        }),
        []
    );

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
            Transfer b52USDC
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
    // Removed: Game selection state variables - now handled in Create Game modal
    // Removed: Ethereum wallet state - now using Cosmos wallet only

    // Password protection states
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [passwordInput, setPasswordInput] = useState<string>("");
    const [passwordError, setPasswordError] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const { isConnected, open, address } = useUserWalletConnect();

    // Wagmi hooks for Base Chain (USDC deposit bridge only)
    const { chain } = useWagmiAccount();
    const { switchChain } = useSwitchChain();

    // Use the findGames hook
    const { games, refetch: refetchGames }: FindGamesReturn = useFindGames();

    // Get player counts for all games
    const gameAddresses = useMemo(() => games.map(g => g.address), [games]);
    useTablePlayerCounts(gameAddresses);

    // Removed: Ethereum account hook - now using Cosmos wallet only

    // Use the new useNewTable hook from hooks directory
    const { createTable, isCreating: isCreatingTable, error: createTableError } = useNewTable();

    // Removed: Ethereum private key import modal states

    // New game creation states
    const [showCreateGameModal, setShowCreateGameModal] = useState(false);
    const [selectedContractAddress, setSelectedContractAddress] = useState("0x4c1d6ea77a2ba47dcd0771b7cde0df30a6df1bfaa7");
    const [createGameError, setCreateGameError] = useState("");
    // Modal game options
    const [modalGameType, setModalGameType] = useState<GameType>(GameType.SIT_AND_GO);
    const [modalMinBuyIn, setModalMinBuyIn] = useState(10);
    const [modalMaxBuyIn, setModalMaxBuyIn] = useState(100);
    const [modalSitAndGoBuyIn, setModalSitAndGoBuyIn] = useState(1); // Single buy-in for Sit & Go
    const [modalPlayerCount, setModalPlayerCount] = useState(4);
    // For Cash Game: min/max players
    const [modalMinPlayers, setModalMinPlayers] = useState(2);
    const [modalMaxPlayers, setModalMaxPlayers] = useState(9);
    // Small/Big Blind fields
    const [modalSmallBlind, setModalSmallBlind] = useState(1);
    const [modalBigBlind, setModalBigBlind] = useState(2);

    // Buy In Modal
    const [showBuyInModal, setShowBuyInModal] = useState(false);
    const [buyInTableId] = useState(""); // Optional, if needed later
    const [selectedGameForBuyIn] = useState<any>(null); // Store selected game for buy-in modal

    // Withdrawal Modal
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

    // USDC Deposit Modal
    const [showUSDCDepositModal, setShowUSDCDepositModal] = useState(false);

    // Wallet connection warning
    const [showWalletWarning, setShowWalletWarning] = useState(false);

    // Add state for mouse position
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Web3 wallet balance state
    const [web3Balance, setWeb3Balance] = useState<string>("0.00");

    // Cosmos wallet state and hooks
    const cosmosWallet = useCosmosWallet();
    const [showCosmosImportModal, setShowCosmosImportModal] = useState(false);
    const [showCosmosTransferModal, setShowCosmosTransferModal] = useState(false);
    const [cosmosSeedPhrase, setCosmosSeedPhrase] = useState("");
    const [cosmosImportError, setCosmosImportError] = useState("");
    const [transferRecipient, setTransferRecipient] = useState("");
    const [transferAmount, setTransferAmount] = useState("");
    const [transferError, setTransferError] = useState("");
    const [isTransferring, setIsTransferring] = useState(false);

    // Function to get USDC balance on Base Chain
    const fetchWeb3Balance = useCallback(async () => {
        if (!address) return;

        try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const usdcContract = new ethers.Contract(BASE_USDC_ADDRESS, USDC_ABI, provider);
            const balance = await usdcContract.balanceOf(address);
            const formattedBalance = ethers.formatUnits(balance, 6); // USDC has 6 decimals
            const roundedBalance = parseFloat(formattedBalance).toFixed(2);
            setWeb3Balance(roundedBalance);
        } catch (error) {
            console.error("Error fetching Base Chain USDC balance:", error);
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

    // Function to handle creating a new game using Cosmos blockchain
    const handleCreateNewGame = async () => {
        // Check for Cosmos wallet
        if (!cosmosWallet.address) {
            setCreateGameError("No Cosmos wallet found. Please create or import a Cosmos wallet first.");
            return;
        }

        setCreateGameError("");

        try {
            // Build game options from modal selections
            // For Sit & Go/Tournament, use the same value for min and max buy-in
            const isTournament = modalGameType === GameType.SIT_AND_GO || modalGameType === GameType.TOURNAMENT;

            // Log the modal values before creating game options
            console.log("🎲 Modal Values:");
            console.log("  Game Type:", modalGameType);
            console.log("  Min Buy-In:", modalMinBuyIn);
            console.log("  Max Buy-In:", modalMaxBuyIn);
            console.log("  Sit & Go Buy-In:", modalSitAndGoBuyIn);
            console.log("  Player Count:", modalPlayerCount);
            console.log("  Is Tournament:", isTournament);
            console.log("  Cosmos Address:", cosmosWallet.address);

            const gameOptions: CreateTableOptions = {
                type: modalGameType,
                minBuyIn: isTournament ? modalSitAndGoBuyIn : modalMinBuyIn,
                maxBuyIn: isTournament ? modalSitAndGoBuyIn : modalMaxBuyIn,
                minPlayers: modalGameType === GameType.CASH ? modalMinPlayers : modalPlayerCount,
                maxPlayers: modalGameType === GameType.CASH ? modalMaxPlayers : modalPlayerCount,
                smallBlind: modalSmallBlind,
                bigBlind: modalBigBlind
            };

            console.log("📦 Final CreateTableOptions being sent to Cosmos:");
            console.log("  type:", gameOptions.type);
            console.log("  minBuyIn:", gameOptions.minBuyIn);
            console.log("  maxBuyIn:", gameOptions.maxBuyIn);
            console.log("  minPlayers:", gameOptions.minPlayers);
            console.log("  maxPlayers:", gameOptions.maxPlayers);

            // Use the createTable function from the hook (Cosmos SDK)
            const txHash = await createTable(gameOptions);

            if (txHash) {
                console.log("✅ Game created! Transaction hash:", txHash);
                setShowCreateGameModal(false);

                // Refresh the games list
                await refetchGames();
            }
        } catch (error: any) {
            console.error("Error creating game:", error);
            setCreateGameError(error.message || "An unexpected error occurred");
        }
    };

    // Cosmos wallet handlers
    const handleImportCosmosSeed = async () => {
        try {
            setCosmosImportError("");

            if (!isValidSeedPhrase(cosmosSeedPhrase)) {
                setCosmosImportError("Please enter a valid seed phrase (12, 15, 18, 21, or 24 words)");
                return;
            }

            await cosmosWallet.importSeedPhrase(cosmosSeedPhrase);

            // Reset form and close modal
            setCosmosSeedPhrase("");
            setCosmosImportError("");
            setShowCosmosImportModal(false);
        } catch (err) {
            console.error("Failed to import cosmos seed phrase:", err);
            setCosmosImportError("Failed to import seed phrase");
        }
    };

    // Removed: handleUpdateCosmosSeed - now handled on /wallet page

    const handleCosmosTransfer = async () => {
        try {
            setTransferError("");
            setIsTransferring(true);

            if (!transferRecipient || !transferAmount) {
                setTransferError("Please enter recipient address and amount");
                return;
            }

            if (!transferRecipient.startsWith("b52")) {
                setTransferError("Recipient address must start with 'b52'");
                return;
            }

            const amount = parseFloat(transferAmount);
            if (isNaN(amount) || amount <= 0) {
                setTransferError("Please enter a valid amount");
                return;
            }

            // Convert to smallest unit (assuming 6 decimals like USDC)
            const amountInSmallestUnit = Math.floor(amount * 1000000).toString();

            const txHash = await cosmosWallet.sendTokens(transferRecipient, amountInSmallestUnit);

            console.log("Transfer successful:", txHash);

            // Reset form and close modal
            setTransferRecipient("");
            setTransferAmount("");
            setTransferError("");
            setShowCosmosTransferModal(false);
        } catch (err) {
            console.error("Failed to send cosmos tokens:", err);
            setTransferError(err instanceof Error ? err.message : "Failed to send tokens");
        } finally {
            setIsTransferring(false);
        }
    };

    // CSS for disabled buttons
    // Removed: disabledButtonClass - no longer needed

    // Memoized background styles to prevent re-renders
    const backgroundStyle1 = useMemo(
        () => ({
            backgroundImage: getAnimationGradient(mousePosition.x, mousePosition.y),
            backgroundColor: colors.table.bgBase,
            filter: "blur(40px)",
            transition: "all 0.3s ease-out"
        }),
        [mousePosition.x, mousePosition.y]
    );

    const backgroundStyle2 = useMemo(
        () => ({
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
        }),
        [mousePosition.x]
    );

    const backgroundStyle3 = useMemo(
        () => ({
            backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${hexToRgba(colors.brand.primary, 0.1)} 25%, rgba(0,0,0,0) 50%, ${hexToRgba(
                colors.brand.primary,
                0.1
            )} 75%, rgba(0,0,0,0) 100%)`,
            backgroundSize: "200% 100%",
            animation: "shimmer 8s infinite linear"
        }),
        []
    );

    // Memoized card styles
    const mainCardStyle = useMemo(
        () => ({
            borderColor: hexToRgba(colors.brand.primary, 0.2)
        }),
        []
    );

    const walletSectionStyle = useMemo(
        () => ({
            backgroundColor: hexToRgba(colors.ui.bgMedium, 0.9),
            border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
        }),
        []
    );

    // Removed: useEffect for limit type - no longer using these state variables

    // Removed: handleGameType - game type selection now in Create Game modal

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

    const handleBuyInModalJoin = useCallback(
        (buyInAmount: string, waitForBigBlind: boolean) => {
            localStorage.setItem("buy_in_amount", buyInAmount);
            localStorage.setItem("wait_for_big_blind", JSON.stringify(waitForBigBlind));
            navigate(`/table/${buyInTableId}`);
        },
        [navigate, buyInTableId]
    );

    // Auto-switch to Base Chain when wallet connects
    useEffect(() => {
        const autoSwitchToBase = async () => {
            if (isConnected && chain?.id !== BASE_CHAIN_ID && switchChain) {
                console.log("🔄 Auto-switching wallet to Base Chain...");
                try {
                    await switchChain({ chainId: BASE_CHAIN_ID });
                    console.log("✅ Successfully switched to Base Chain");
                } catch (err) {
                    console.warn("⚠️ Could not auto-switch to Base Chain:", err);
                    // Don't show error to user - they can manually switch if needed
                }
            }
        };

        autoSwitchToBase();
    }, [isConnected, chain?.id, switchChain]);

    // Memoized Deposit callback
    const handleDepositClick = useCallback(() => {
        if (isConnected) {
            setShowUSDCDepositModal(true);
        } else {
            // Show warning popup if wallet not connected
            setShowWalletWarning(true);
            // Auto-hide after 3 seconds
            setTimeout(() => setShowWalletWarning(false), 3000);
        }
    }, [isConnected]);

    // Memoized Withdrawal callback
    const handleWithdrawClick = useCallback(() => {
        setShowWithdrawalModal(true);
    }, []);

    // Removed: handleImportModalClick - no longer needed (using Cosmos wallet)

    // Memoized game selection callbacks
    // Removed: Game selection button handlers - no longer needed

    return (
        <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden">
            {/* Background animations */}
            <div className="fixed inset-0 z-0" style={backgroundStyle1} />

            {/* Add hexagon pattern overlay */}
            <HexagonPattern />

            {/* Animated pattern overlay */}
            <div className="fixed inset-0 z-0 opacity-20" style={backgroundStyle2} />

            {/* Moving light animation */}
            <div className="fixed inset-0 z-0 opacity-30" style={backgroundStyle3} />

            {/* Password Protection Modal */}
            {!isAuthenticated && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div
                        className="backdrop-blur-md p-8 rounded-xl w-96 shadow-2xl relative overflow-hidden"
                        style={{
                            backgroundColor: hexToRgba(colors.ui.bgDark, 0.9),
                            border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                        }}
                    >
                        {/* Web3 styled background */}
                        <div
                            className="absolute inset-0 rounded-xl"
                            style={{
                                background: `linear-gradient(135deg, ${hexToRgba(colors.brand.primary, 0.1)} 0%, ${hexToRgba(
                                    colors.brand.secondary,
                                    0.1
                                )} 100%)`
                            }}
                        ></div>
                        <div
                            className="absolute top-0 left-0 w-full h-1 animate-pulse"
                            style={{
                                background: `linear-gradient(90deg, ${colors.brand.primary}, ${colors.accent.glow}, ${colors.brand.primary})`
                            }}
                        ></div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-center mb-4">
                                <img src="/block52.png" alt="Block52 Logo" className="h-16 w-auto object-contain" />
                            </div>

                            <div className="flex items-center justify-center mb-6">
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center"
                                    style={{
                                        background: `linear-gradient(135deg, ${hexToRgba(colors.brand.primary, 0.2)} 0%, ${hexToRgba(
                                            colors.brand.secondary,
                                            0.2
                                        )} 100%)`,
                                        border: `1px solid ${hexToRgba(colors.brand.primary, 0.3)}`
                                    }}
                                >
                                    <svg className="w-8 h-8" style={{ color: colors.brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
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
                                        onFocus={e => (e.target.style.border = `1px solid ${colors.brand.primary}`)}
                                        onBlur={e => (e.target.style.border = `1px solid ${hexToRgba(colors.brand.primary, 0.3)}`)}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                                />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
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
                                    onMouseEnter={e => {
                                        (e.target as HTMLButtonElement).style.background = `linear-gradient(135deg, ${hexToRgba(
                                            colors.brand.primary,
                                            0.9
                                        )} 0%, ${hexToRgba(colors.brand.primary, 0.7)} 100%)`;
                                    }}
                                    onMouseLeave={e => {
                                        (e.target as HTMLButtonElement).style.background = `linear-gradient(135deg, ${colors.brand.primary} 0%, ${hexToRgba(
                                            colors.brand.primary,
                                            0.8
                                        )} 100%)`;
                                    }}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                                            />
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
                    {/* Cosmos Import Seed Phrase Modal */}
                    {showCosmosImportModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                            <div
                                className="p-6 rounded-xl w-96 shadow-2xl border"
                                style={{ backgroundColor: colors.ui.bgDark, borderColor: hexToRgba(colors.brand.primary, 0.2) }}
                            >
                                <h3 className="text-xl font-bold text-white mb-4">Import Cosmos Seed Phrase</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-white text-sm mb-1">Seed Phrase</label>
                                        <textarea
                                            placeholder="Enter your 12, 15, 18, 21, or 24 word seed phrase..."
                                            value={cosmosSeedPhrase}
                                            onChange={e => setCosmosSeedPhrase(e.target.value)}
                                            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 h-20 resize-none"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Words should be separated by spaces</p>
                                    </div>
                                    {cosmosImportError && <p className="text-red-500 text-sm">{cosmosImportError}</p>}
                                    <div className="flex justify-end space-x-3">
                                        <button
                                            onClick={() => {
                                                setShowCosmosImportModal(false);
                                                setCosmosSeedPhrase("");
                                                setCosmosImportError("");
                                            }}
                                            className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-300 shadow-inner"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleImportCosmosSeed}
                                            disabled={cosmosWallet.isLoading}
                                            className="px-4 py-2 text-sm text-white rounded-lg transition duration-300 shadow-md hover:opacity-90 disabled:opacity-50"
                                            style={{ backgroundColor: colors.brand.primary }}
                                        >
                                            {cosmosWallet.isLoading ? "Importing..." : "Import"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Removed: Cosmos Update Seed Phrase Modal - now handled on /wallet page */}

                    {/* Cosmos Transfer Modal */}
                    {showCosmosTransferModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                            <div
                                className="p-6 rounded-xl w-96 shadow-2xl border"
                                style={{ backgroundColor: colors.ui.bgDark, borderColor: hexToRgba(colors.brand.primary, 0.2) }}
                            >
                                <h3 className="text-xl font-bold text-white mb-4">Transfer b52USD</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-white text-sm mb-1">Recipient Address</label>
                                        <input
                                            type="text"
                                            placeholder="b521abc..."
                                            value={transferRecipient}
                                            onChange={e => setTransferRecipient(e.target.value)}
                                            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-white text-sm mb-1">Amount (b52USD)</label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            placeholder="0.00"
                                            value={transferAmount}
                                            onChange={e => setTransferAmount(e.target.value)}
                                            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            Available:{" "}
                                            {cosmosWallet.balance.length > 0 ? (parseInt(cosmosWallet.balance[0].amount) / 1000000).toFixed(6) : "0.00"} b52USD
                                        </p>
                                    </div>
                                    {transferError && <p className="text-red-500 text-sm">{transferError}</p>}
                                    <div className="flex justify-end space-x-3">
                                        <button
                                            onClick={() => {
                                                setShowCosmosTransferModal(false);
                                                setTransferRecipient("");
                                                setTransferAmount("");
                                                setTransferError("");
                                            }}
                                            className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-300 shadow-inner"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCosmosTransfer}
                                            disabled={isTransferring}
                                            className="px-4 py-2 text-sm text-white rounded-lg transition duration-300 shadow-md hover:opacity-90 disabled:opacity-50"
                                            style={{ backgroundColor: colors.brand.primary }}
                                        >
                                            {isTransferring ? "Sending..." : "Send"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Create New Game Modal */}
                    {showCreateGameModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                            <div
                                className="p-6 rounded-xl w-96 shadow-2xl border"
                                style={{ backgroundColor: colors.ui.bgDark, borderColor: hexToRgba(colors.brand.primary, 0.2) }}
                            >
                                <h3 className="text-xl font-bold text-white mb-4">Create New Table</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-white text-sm mb-1">Game Type</label>
                                        <select
                                            value={modalGameType}
                                            onChange={e => setModalGameType(e.target.value as GameType)}
                                            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                        >
                                            <option value={GameType.SIT_AND_GO}>Sit & Go</option>
                                            <option value={GameType.CASH}>Cash Game</option>
                                            <option value={GameType.TOURNAMENT}>Tournament</option>
                                        </select>
                                    </div>

                                    {modalGameType === GameType.CASH ? (
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="block text-white text-sm mb-1">Min Players</label>
                                                <input
                                                    type="number"
                                                    min={2}
                                                    max={9}
                                                    value={modalMinPlayers ?? 2}
                                                    onChange={e => setModalMinPlayers(Number(e.target.value))}
                                                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-white text-sm mb-1">Max Players</label>
                                                <input
                                                    type="number"
                                                    min={2}
                                                    max={9}
                                                    value={modalMaxPlayers ?? 9}
                                                    onChange={e => setModalMaxPlayers(Number(e.target.value))}
                                                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                                />
                                            </div>
                                        </div>
                                    ) : (
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
                                    )}

                                    {/* Show different fields based on game type */}
                                    {modalGameType === GameType.SIT_AND_GO || modalGameType === GameType.TOURNAMENT ? (
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

                                    {/* Small Blind and Big Blind fields (always shown) */}
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-white text-sm mb-1">Small Blind ($)</label>
                                            <input
                                                type="number"
                                                value={modalSmallBlind}
                                                onChange={e => setModalSmallBlind(Number(e.target.value))}
                                                min="1"
                                                max="10000"
                                                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-white text-sm mb-1">Big Blind ($)</label>
                                            <input
                                                type="number"
                                                value={modalBigBlind}
                                                onChange={e => setModalBigBlind(Number(e.target.value))}
                                                min="1"
                                                max="10000"
                                                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-white text-sm mb-1">Variant</label>
                                        <select
                                            value={selectedContractAddress}
                                            onChange={e => setSelectedContractAddress(e.target.value)}
                                            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                        >
                                            <React.Fragment>
                                                <option value={DEFAULT_GAME_CONTRACT}>Texas Hold'em</option>
                                                <option value="" disabled>
                                                    Omaha (Coming Soon)
                                                </option>
                                                <option value="" disabled>
                                                    Seven Card Stud (Coming Soon)
                                                </option>
                                                <option value="" disabled>
                                                    Blackjack (Coming Soon)
                                                </option>
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
                                            disabled={isCreatingTable}
                                            className={`px-4 py-2 text-sm text-white rounded-lg transition duration-300 shadow-md flex items-center ${
                                                isCreatingTable ? "bg-gray-500" : "hover:opacity-90"
                                            }`}
                                            style={isCreatingTable ? {} : { backgroundColor: colors.brand.primary }}
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
                                            ) : (
                                                "Create Game"
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div
                        className="bg-gray-800/80 backdrop-blur-md p-10 rounded-xl shadow-2xl w-full max-w-xl border z-10 transition-all duration-300 hover:shadow-blue-500/10"
                        style={mainCardStyle}
                    >
                        {/* Club Logo */}
                        {import.meta.env.VITE_CLUB_LOGO && (
                            <div className="flex flex-col items-center mb-6">
                                <img src={import.meta.env.VITE_CLUB_LOGO} alt="Club Logo" className="w-32 h-32 object-contain" />
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-4xl font-extrabold text-white text-shadow">Start Playing Now</h1>
                            <div className="flex items-center gap-4">
                                <NetworkSelector />
                                {/* <CosmosStatus /> */}
                            </div>
                        </div>

                        {/* Web3 Wallet Section */}
                        <div
                            className="backdrop-blur-sm p-5 rounded-xl mb-6 shadow-lg transition-all duration-300"
                            style={{
                                backgroundColor: hexToRgba(colors.ui.bgMedium, 0.9),
                                border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.2);
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.1);
                            }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <h2 className="text-xl font-bold text-white">Wallet</h2>
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
                                    <div
                                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20"
                                        style={{
                                            backgroundColor: colors.ui.bgDark,
                                            border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                                        }}
                                    >
                                        <h3 className="font-bold mb-2" style={{ color: colors.brand.primary }}>
                                            External Web3 Wallet
                                        </h3>
                                        <p className="mb-2">Connect your favorite Web3 wallet like MetaMask, WalletConnect, or Coinbase Wallet.</p>
                                        <p className="mb-2">This is completely optional - you can play using only the Block52 Game Wallet.</p>
                                        <p>Having a connected wallet provides additional features and easier withdrawals in the future.</p>
                                        <div
                                            className="absolute left-1/2 -bottom-2 -translate-x-1/2 border-8 border-transparent"
                                            style={{ borderTopColor: colors.ui.bgDark }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {!isConnected ? (
                                <button
                                    onClick={open}
                                    className="w-full py-3 px-4 rounded-lg transition duration-300 shadow-md hover:opacity-90"
                                    style={{
                                        background: `linear-gradient(135deg, ${hexToRgba(colors.brand.primary, 0.7)} 0%, ${hexToRgba(
                                            colors.brand.primary,
                                            0.8
                                        )} 100%)`
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
                                    {/* <div className="flex justify-between items-center" style={{ color: "white" }}>
                                        <span>
                                            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                                        </span>
                                        <button
                                            onClick={disconnect}
                                            className="text-xs px-3 py-1 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-lg transition duration-300 shadow-md"
                                        >
                                            Disconnect
                                        </button>
                                    </div> */}

                                    <div className="flex flex-col gap-1">
                                        <div>
                                            <label className="text-gray-300 text-sm">Address</label>
                                            <div className="flex gap-2 items-center mt-1">
                                                <input
                                                    type="text"
                                                    value={address}
                                                    readOnly
                                                    className="flex-1 text-white px-4 py-2 rounded border font-mono text-sm"
                                                    style={{
                                                        backgroundColor: hexToRgba(colors.table.bgBase, 0.6),
                                                        borderColor: hexToRgba(colors.brand.primary, 0.2)
                                                    }}
                                                />
                                                <button
                                                    onClick={() => copyToClipboard(address || "", "Address")}
                                                    className="text-white px-4 py-2 rounded transition-all hover:opacity-80"
                                                    style={{ backgroundColor: colors.brand.primary }}
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="p-3 rounded-lg"
                                        style={{
                                            backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                                            border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: hexToRgba(colors.brand.primary, 0.2) }}
                                                >
                                                    <span className="font-bold text-lg" style={{ color: colors.brand.primary }}>
                                                        $
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold" style={{ color: "white" }}>
                                                        Base USDC Balance
                                                    </p>
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
                                                    <svg
                                                        className="w-4 h-4"
                                                        style={{ color: colors.brand.primary }}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Block52 Wallet Section */}
                        <div
                            className="backdrop-blur-sm p-5 rounded-xl mb-6 shadow-lg transition-all duration-300"
                            style={walletSectionStyle}
                            onMouseEnter={handleWalletMouseEnter}
                            onMouseLeave={handleWalletMouseLeave}
                        >
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
                                    <div
                                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20"
                                        style={{
                                            backgroundColor: colors.ui.bgDark,
                                            border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                                        }}
                                    >
                                        <h3 className="font-bold mb-2" style={{ color: colors.brand.primary }}>
                                            Layer 2 Gaming Wallet
                                        </h3>
                                        <p className="mb-2">This is your Layer 2 gaming wallet, automatically created for you with no Web3 wallet required!</p>
                                        <p className="mb-2">
                                            You can deposit funds using ERC20 tokens, and the bridge will automatically credit your game wallet.
                                        </p>
                                        <p>All your in-game funds are secured on the blockchain and can be withdrawn at any time.</p>
                                        <div
                                            className="absolute left-1/2 -bottom-2 -translate-x-1/2 border-8 border-transparent"
                                            style={{ borderTopColor: colors.ui.bgDark }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {cosmosWallet.address && (
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <div>
                                            <label className="text-gray-300 text-sm">Address</label>
                                            <div className="flex gap-2 items-center mt-1">
                                                <input
                                                    type="text"
                                                    value={cosmosWallet.address}
                                                    readOnly
                                                    className="flex-1 text-white px-4 py-2 rounded border font-mono text-sm"
                                                    style={{
                                                        backgroundColor: hexToRgba(colors.table.bgBase, 0.6),
                                                        borderColor: hexToRgba(colors.brand.primary, 0.2)
                                                    }}
                                                />
                                                <button
                                                    onClick={() => copyToClipboard(cosmosWallet.address || "", "Address")}
                                                    className="text-white px-4 py-2 rounded transition-all hover:opacity-80"
                                                    style={{ backgroundColor: colors.brand.primary }}
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cosmos Wallet Balances Section */}
                                    <div className="space-y-2 mt-3">
                                        <div
                                            className="p-3 rounded-lg"
                                            style={{
                                                backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                                                border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-10 h-10 rounded-full flex items-center justify-center"
                                                        style={{ backgroundColor: hexToRgba(colors.brand.primary, 0.2) }}
                                                    >
                                                        <span className="font-bold text-lg" style={{ color: colors.brand.primary }}>
                                                            $
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold" style={{ color: "white" }}>
                                                            b52USDC Balance
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold" style={{ color: colors.brand.primary }}>
                                                            {(() => {
                                                                // Find USDC balance specifically
                                                                const usdcBalance = cosmosWallet.balance.find(b => b.denom === "usdc");

                                                                if (usdcBalance) {
                                                                    const amount = microToUsdc(usdcBalance.amount);
                                                                    return amount.toLocaleString("en-US", {
                                                                        style: "currency",
                                                                        currency: "USD",
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 6
                                                                    });
                                                                }
                                                                return "$0.00";
                                                            })()}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => fetchWeb3Balance()}
                                                        className="p-1.5 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                                                        title="Refresh balance"
                                                    >
                                                        <svg
                                                            className="w-4 h-4"
                                                            style={{ color: colors.brand.primary }}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* <p className="text-gray-300 text-sm">Balances</p>
                                        {cosmosWallet.isLoading ? (
                                            <div className="text-gray-400 text-sm text-center py-2">Loading balances...</div>
                                        ) : cosmosWallet.error ? (
                                            <div className="text-red-400 text-sm text-center py-2">Error loading balances</div>
                                        ) : !cosmosWallet.address ? (
                                            <div className="text-gray-400 text-sm text-center py-2">No wallet connected</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {cosmosWallet.balance.map((balance, idx) => {
                                                    // Format balance with proper decimals (6 for micro-denominated tokens)
                                                    const isMicroDenom = balance.denom === "b52Token" || balance.denom === "usdc";
                                                    const numericAmount = isMicroDenom ? microToUsdc(balance.amount) : Number(balance.amount);

                                                    const displayAmount = numericAmount.toLocaleString("en-US", {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 6
                                                    });

                                                    // For usdc, show USD equivalent
                                                    const isUSDC = balance.denom === "usdc";
                                                    const usdValue = isUSDC
                                                        ? numericAmount.toLocaleString("en-US", {
                                                              style: "currency",
                                                              currency: "USD",
                                                              minimumFractionDigits: 2,
                                                              maximumFractionDigits: 2
                                                          })
                                                        : null;

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center justify-between p-3 rounded-lg"
                                                            style={{
                                                                backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                                                                border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                                                            }}
                                                        >
                                                            <div>
                                                                <p className="text-white text-sm font-bold">{balance.denom}</p>
                                                                <p className="text-gray-400 text-xs">Block 52 Chain</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="flex items-baseline gap-2">
                                                                    <span className="text-white font-bold text-lg">{displayAmount}</span>
                                                                    <span className="text-gray-400 text-xs">{balance.denom}</span>
                                                                </div>
                                                                {usdValue && <div className="text-gray-400 text-xs">≈ {usdValue}</div>}
                                                                <div className="text-xs text-gray-500">
                                                                    {Number(balance.amount).toLocaleString("en-US")} micro-units
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )} */}
                                    </div>

                                    {!cosmosWallet.address && (
                                        <div className="mt-2 flex justify-center">
                                            <button
                                                onClick={() => setShowCosmosImportModal(true)}
                                                className="text-sm underline transition duration-300 hover:opacity-80"
                                                style={{ color: colors.brand.primary }}
                                            >
                                                Import Cosmos Seed Phrase
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 pt-2">
                                        <DepositButton onClick={handleDepositClick} disabled={false} />
                                        <WithdrawButton onClick={handleWithdrawClick} />
                                        <CreateTransferButton onClick={() => setShowCosmosTransferModal(true)} />
                                    </div>
                                    <div className="mt-2 flex justify-center gap-4">
                                        <a
                                            href="/wallet"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs underline transition duration-300 hover:opacity-80 flex items-center gap-0.5"
                                            style={{ color: colors.brand.primary }}
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                                />
                                            </svg>
                                            Cosmos Wallet
                                        </a>
                                        <a
                                            href="/explorer"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs underline transition duration-300 hover:opacity-80 flex items-center gap-0.5"
                                            style={{ color: colors.brand.primary }}
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                />
                                            </svg>
                                            Block Explorer
                                        </a>
                                        <a
                                            href="/bridge/manual"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs underline transition duration-300 hover:opacity-80 flex items-center gap-0.5"
                                            style={{ color: colors.brand.primary }}
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                                />
                                            </svg>
                                            Manual Bridge Trigger
                                        </a>
                                        <a
                                            href="/test-signing"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs underline transition duration-300 hover:opacity-80 flex items-center gap-0.5"
                                            style={{ color: colors.brand.primary }}
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            Test Signing Page
                                        </a>
                                        <a
                                            href="/bridge/admin"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs underline transition duration-300 hover:opacity-80 flex items-center gap-0.5"
                                            style={{ color: colors.brand.primary }}
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                                />
                                            </svg>
                                            Bridge Admin Dashboard
                                        </a>
                                        <a
                                            href="/table/admin"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs underline transition duration-300 hover:opacity-80 flex items-center gap-0.5"
                                            style={{ color: colors.brand.primary }}
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                                                />
                                            </svg>
                                            Table Admin Dashboard
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

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
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            minBuyIn={selectedGameForBuyIn?.minBuyIn}
                            maxBuyIn={selectedGameForBuyIn?.maxBuyIn}
                            onClose={handleBuyInModalClose}
                            onJoin={handleBuyInModalJoin}
                        />
                    )}
                    {showWithdrawalModal && (
                        <WithdrawalModal
                            isOpen={showWithdrawalModal}
                            onClose={() => setShowWithdrawalModal(false)}
                            onSuccess={() => {
                                // Balance will auto-refresh on next page interaction
                            }}
                        />
                    )}
                    {showUSDCDepositModal && (
                        <USDCDepositModal
                            isOpen={showUSDCDepositModal}
                            onClose={() => setShowUSDCDepositModal(false)}
                            onSuccess={() => {
                                // Balance will auto-refresh on next page interaction
                                setShowUSDCDepositModal(false);
                            }}
                        />
                    )}

                    {/* Wallet Connection Warning Popup */}
                    {showWalletWarning && (
                        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
                            <div
                                className="px-6 py-4 rounded-lg shadow-lg flex items-center gap-3"
                                style={{
                                    backgroundColor: hexToRgba(colors.ui.bgDark, 0.95),
                                    border: `2px solid ${colors.accent.danger}`,
                                    backdropFilter: "blur(10px)"
                                }}
                            >
                                <div className="text-2xl">⚠️</div>
                                <div>
                                    <p className="text-white font-semibold">Please connect your Web3 wallet first</p>
                                    <p className="text-gray-400 text-sm mt-1">Click the wallet button to connect MetaMask or WalletConnect</p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Dashboard;
