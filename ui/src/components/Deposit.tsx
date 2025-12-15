import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import * as React from "react";
import useUserWalletConnect from "../hooks/DepositPage/useUserWalletConnect";
import useDepositUSDC from "../hooks/DepositPage/useDepositUSDC";
import useAllowance from "../hooks/DepositPage/useAllowance";
import useDecimal from "../hooks/DepositPage/useDecimals";
import useApprove from "../hooks/DepositPage/useApprove";
import spinner from "../assets/spinning-circles.svg";
import useWalletBalance from "../hooks/DepositPage/useWalletBalance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { STORAGE_PUBLIC_KEY } from "../hooks/useUserWallet";
import { CONTRACT_ADDRESSES } from "../constants";
import useUserWallet from "../hooks/useUserWallet";
import { formatUSDCToSimpleDollars, convertAmountToBigInt } from "../utils/numberUtils";
import { colors, getAnimationGradient, hexToRgba } from "../utils/colorConfig";

const Deposit: React.FC = () => {
    const USDC_ADDRESS = CONTRACT_ADDRESSES.USDC;
    const BRIDGE_ADDRESS = CONTRACT_ADDRESSES.bridgeAddress;

    const { open, disconnect, isConnected, address } = useUserWalletConnect();
    const { deposit, isDepositPending, isDepositConfirmed, isPending, depositError } = useDepositUSDC();
    const { isApprovePending, isApproveConfirmed, isLoading, approve, approveError } = useApprove();
    const [publicKey, setPublicKey] = useState<string>();
    const [amount, setAmount] = useState<string>("0");
    const { decimals } = useDecimal(USDC_ADDRESS);
    const [walletAllowance, setWalletAllowance] = useState<bigint>(BigInt(0));
    const [tmpWalletAllowance, setTmpWalletAllowance] = useState<bigint>(BigInt(0));
    const [tmpDepositAmount, setTmpDepositAmount] = useState<bigint>(BigInt(0));
    const { allowance } = useAllowance();
    const { balance } = useWalletBalance();
    const { accountData } = useUserWallet();
    const b52Balance = accountData?.balance;

    const navigate = useNavigate();

    // Mouse position for animated background
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const animationFrameRef = useRef<number | undefined>(undefined);

    // Mouse movement handler - throttled
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!animationFrameRef.current) {
            animationFrameRef.current = requestAnimationFrame(() => {
                const x = Math.round((e.clientX / window.innerWidth) * 100);
                const y = Math.round((e.clientY / window.innerHeight) * 100);
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

    // Set up mouse tracking
    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [handleMouseMove]);

    // Animated background styles matching Dashboard
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

    // Button style helper
    const buttonStyle = (color: string) => ({
        background: `linear-gradient(135deg, ${color} 0%, ${hexToRgba(color, 0.8)} 100%)`
    });

    useEffect(() => {
        if (allowance) {
            setWalletAllowance(allowance);
        }
    }, [allowance]);

    useEffect(() => {
        const localKey = localStorage.getItem(STORAGE_PUBLIC_KEY);
        if (!localKey) return setPublicKey(undefined);

        setPublicKey(localKey);
    }, []);

    useEffect(() => {
        if (isDepositConfirmed) {
            toast.success(`You have deposited ${amount}USDC to address(${BRIDGE_ADDRESS}) successfully`, { autoClose: 5000 });
            setAmount("0");
            setWalletAllowance(w => w - tmpDepositAmount);
        }
    }, [BRIDGE_ADDRESS, amount, isDepositConfirmed, tmpDepositAmount]);

    useEffect(() => {
        if (isApproveConfirmed) {
            toast.success(`You have approved ${amount}USDC successfully`, { autoClose: 5000 });
            setAmount("0");
            setWalletAllowance(tmpWalletAllowance);
        }
    }, [amount, isApproveConfirmed, tmpWalletAllowance]);

    useEffect(() => {
        if (depositError) {
            toast.error("Failed to deposit", { autoClose: 5000 });
        }
    }, [depositError]);

    useEffect(() => {
        if (approveError) {
            toast.error("Failed to approve", { autoClose: 5000 });
        }
    }, [approveError]);

    const allowed = React.useMemo(() => {
        if (!walletAllowance || !decimals || !+amount) return false;
        const amountInBigInt = convertAmountToBigInt(amount, decimals);
        return walletAllowance >= amountInBigInt;
    }, [amount, walletAllowance, decimals]);

    const handleApprove = async () => {
        if (!address || !decimals) {
            console.error("Missing required information");
            return;
        }

        try {
            const amountInBigInt = convertAmountToBigInt(amount, decimals);
            await approve(USDC_ADDRESS, BRIDGE_ADDRESS, amountInBigInt);
            setTmpWalletAllowance(amountInBigInt);
        } catch (err) {
            console.error("Approval failed:", err);
        }
    };

    const handleDeposit = async () => {
        if (allowed) {
            try {
                if (publicKey) {
                    const amountInBigInt = convertAmountToBigInt(amount, decimals);
                    await deposit(amountInBigInt, publicKey, USDC_ADDRESS);
                    setTmpDepositAmount(amountInBigInt);
                }
            } catch (err) {
                console.error("Deposit failed:", err);
            }
        } else {
            console.error("Insufficient allowance. Please approve more USDC.");
        }
    };

    const handleGoBack = () => {
        navigate("/");
    };

    if (isConnected === null) {
        return <></>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-white relative px-4 overflow-hidden">
            {/* Animated background layers - matching Dashboard */}
            <div className="fixed inset-0 z-0" style={backgroundStyle1} />
            <div className="fixed inset-0 z-0 opacity-20" style={backgroundStyle2} />
            <div className="fixed inset-0 z-0 opacity-30" style={backgroundStyle3} />

            {/* Back button */}
            <button
                type="button"
                className="absolute top-8 left-8 flex items-center gap-2 py-2 px-4 text-sm font-semibold text-gray-300 hover:text-white transition-colors z-10"
                onClick={handleGoBack}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back
            </button>

            <div className="w-full max-w-md bg-gray-800 rounded-lg border border-gray-700 overflow-hidden z-10">
                {/* Header */}
                <div className="px-6 py-4 bg-gray-900 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Deposit USDC</h2>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Connect Wallet Button */}
                    <button
                        className="w-full py-3 rounded-lg text-white font-semibold mb-6 transition-all hover:opacity-90"
                        style={buttonStyle(isConnected ? colors.accent.withdraw : colors.brand.primary)}
                        onClick={isConnected ? disconnect : open}
                    >
                        {isConnected ? "Disconnect Wallet" : "Connect Your Web3 Wallet"}
                    </button>

                    {/* Wallet Info */}
                    {address && (
                        <div className="mb-4 p-3 rounded-lg bg-gray-900 border border-gray-700">
                            <p className="text-gray-400 text-sm mb-1">Connected Address</p>
                            <p className="text-white font-mono text-sm break-all">{address}</p>
                        </div>
                    )}

                    {/* Balances */}
                    <div className="space-y-3 mb-6">
                        {balance && (
                            <div className="p-3 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Web3 Wallet Balance</span>
                                <span className="text-white font-semibold">${formatUSDCToSimpleDollars(balance)} USDC</span>
                            </div>
                        )}
                        <div className="p-3 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Game Wallet Balance</span>
                            <span className="text-white font-semibold">${formatUSDCToSimpleDollars(b52Balance || "0")} USDC</span>
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div className="mb-6">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-2">
                            Amount to Deposit (USDC)
                        </label>
                        <div className="relative">
                            <input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full p-3 pr-16 border border-gray-600 bg-gray-900 text-white rounded-lg focus:border-blue-500 focus:outline-none"
                                placeholder="0.00"
                            />
                            <button
                                onClick={() => {
                                    if (balance && decimals) {
                                        setAmount(formatUSDCToSimpleDollars(balance));
                                    }
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold transition-colors hover:opacity-80"
                                style={{ color: colors.brand.primary }}
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    {/* Action Button */}
                    {allowed ? (
                        <button
                            onClick={handleDeposit}
                            className={`w-full py-3 rounded-lg text-white font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-3 ${
                                +amount === 0 ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            style={buttonStyle(colors.accent.success)}
                            disabled={+amount === 0 || isDepositPending || isPending}
                        >
                            {isDepositPending || isPending ? "Depositing..." : "Deposit"}
                            {(isDepositPending || isPending) && <img src={spinner} className="w-5 h-5" alt="loading" />}
                        </button>
                    ) : (
                        <button
                            onClick={handleApprove}
                            className={`w-full py-3 rounded-lg text-white font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-3 ${
                                +amount === 0 ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            style={buttonStyle(colors.brand.primary)}
                            disabled={+amount === 0 || isApprovePending || isLoading}
                        >
                            {isLoading || isApprovePending ? "Approving..." : "Approve"}
                            {(isLoading || isApprovePending) && <img src={spinner} className="w-5 h-5" alt="loading" />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Deposit;
