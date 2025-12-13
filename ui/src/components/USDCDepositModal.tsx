import React, { useState, useEffect } from "react";
import { useAccount, useWalletClient, usePublicClient, useSwitchChain } from "wagmi";
import { parseUnits, formatUnits, parseAbi } from "viem";
import { colors, hexToRgba } from "../utils/colorConfig";
import { BASE_USDC_ADDRESS, COSMOS_BRIDGE_ADDRESS, BASE_CHAIN_ID } from "../config/constants";
import { getCosmosAddress } from "../utils/cosmos";

interface USDCDepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

// CosmosBridge contract on Base Chain
const BRIDGE_ADDRESS = COSMOS_BRIDGE_ADDRESS;

// USDC contract on Base Chain
const USDC_ADDRESS = BASE_USDC_ADDRESS;

// Contract ABIs - using parseAbi to convert from human-readable to JSON format
const USDC_ABI = parseAbi([
    "function balanceOf(address account) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)"
]);

const BRIDGE_ABI = parseAbi([
    "function depositUnderlying(uint256 amount, string calldata receiver) external returns(uint256)",
    "event Deposited(string indexed account, uint256 amount, uint256 index)"
]);

const USDCDepositModal: React.FC<USDCDepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [amount, setAmount] = useState("");
    const [isApproving, setIsApproving] = useState(false);
    const [isDepositing, setIsDepositing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usdcBalance, setUsdcBalance] = useState<string>("0");
    const [allowance, setAllowance] = useState<bigint>(0n);
    const [needsApproval, setNeedsApproval] = useState(false);

    const { address: walletAddress, isConnected, chain } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const { switchChain } = useSwitchChain();
    const [isSwitching, setIsSwitching] = useState(false);

    // Get Cosmos address from localStorage (where b52USDC will be minted)
    const cosmosAddress = getCosmosAddress();

    console.log("📍 [1] USDCDepositModal initialized:", {
        walletAddress,
        cosmosAddress,
        isConnected,
        chainId: chain?.id,
        expectedChainId: BASE_CHAIN_ID,
        bridgeAddress: BRIDGE_ADDRESS,
        usdcAddress: USDC_ADDRESS
    });

    // Check if we need to switch to Base Chain
    const needsNetworkSwitch = chain?.id !== BASE_CHAIN_ID;

    // Auto-switch to Base Chain when modal opens
    useEffect(() => {
        const autoSwitchNetwork = async () => {
            if (isOpen && needsNetworkSwitch && switchChain && !isSwitching) {
                console.log("📍 Auto-switching to Base Chain...");
                setIsSwitching(true);
                try {
                    await switchChain({ chainId: BASE_CHAIN_ID });
                    console.log("✅ Successfully switched to Base Chain");
                } catch (err) {
                    console.error("❌ Auto-switch failed:", err);
                    setError("Please manually switch to Base Chain in MetaMask");
                } finally {
                    setIsSwitching(false);
                }
            }
        };

        autoSwitchNetwork();
    }, [isOpen, needsNetworkSwitch, switchChain, isSwitching]);

    // Fetch USDC balance and allowance
    useEffect(() => {
        const fetchBalanceAndAllowance = async () => {
            if (!walletAddress || !publicClient) return;

            console.log("📍 [2] Fetching USDC balance and allowance for:", walletAddress);
            
            try {
                // Get USDC balance
                const balance = await publicClient.readContract({
                    address: USDC_ADDRESS,
                    abi: USDC_ABI,
                    functionName: "balanceOf",
                    args: [walletAddress]
                });

                // Get current allowance
                const currentAllowance = await publicClient.readContract({
                    address: USDC_ADDRESS,
                    abi: USDC_ABI,
                    functionName: "allowance",
                    args: [walletAddress, BRIDGE_ADDRESS]
                });

                const formattedBalance = formatUnits(balance as bigint, 6);
                console.log("📍 [3] Balance/Allowance fetched:", {
                    balance: formattedBalance,
                    allowance: (currentAllowance as bigint).toString(),
                    allowanceFormatted: formatUnits(currentAllowance as bigint, 6)
                });

                setUsdcBalance(formattedBalance);
                setAllowance(currentAllowance as bigint);
            } catch (err) {
                console.error("Error fetching balance/allowance:", err);
            }
        };

        if (isOpen && isConnected) {
            fetchBalanceAndAllowance();
        }
    }, [isOpen, isConnected, walletAddress, publicClient]);

    // Check if approval is needed when amount changes
    useEffect(() => {
        if (amount && parseFloat(amount) > 0) {
            const amountInUnits = parseUnits(amount, 6);
            setNeedsApproval(amountInUnits > allowance);
        } else {
            setNeedsApproval(false);
        }
    }, [amount, allowance]);

    const handleApprove = async () => {
        console.log("📍 [4] Starting USDC approval process");
        
        if (!walletClient || !walletAddress || !publicClient) {
            setError("Please connect your wallet");
            return;
        }

        setIsApproving(true);
        setError(null);

        try {
            const amountToApprove = parseUnits(amount, 6);
            console.log("📍 [5] Approving amount:", {
                amount,
                amountInUnits: amountToApprove.toString(),
                spender: BRIDGE_ADDRESS
            });

            // Request approval
            const { request } = await publicClient.simulateContract({
                address: USDC_ADDRESS,
                abi: USDC_ABI,
                functionName: "approve",
                args: [BRIDGE_ADDRESS, amountToApprove],
                account: walletAddress
            });

            const hash = await walletClient.writeContract(request);
            console.log("📍 [6] Approval transaction sent:", hash);
            
            // Wait for transaction confirmation
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            console.log("📍 [7] Approval confirmed:", {
                transactionHash: hash,
                blockNumber: receipt.blockNumber,
                status: receipt.status
            });

            // Update allowance
            setAllowance(amountToApprove);
            setNeedsApproval(false);
            
            console.log("✅ [8] USDC approval successful");
        } catch (err) {
            console.error("❌ Approval error:", err);
            setError(err instanceof Error ? err.message : "Failed to approve USDC");
        } finally {
            setIsApproving(false);
        }
    };

    const handleSwitchNetwork = async () => {
        if (!switchChain) return;

        console.log("📍 Manually switching to Base Chain...");
        setIsSwitching(true);
        setError(null);

        try {
            await switchChain({ chainId: BASE_CHAIN_ID });
            console.log("✅ Successfully switched to Base Chain");
        } catch (err) {
            console.error("❌ Failed to switch network:", err);
            setError(err instanceof Error ? err.message : "Failed to switch to Base Chain");
        } finally {
            setIsSwitching(false);
        }
    };

    const handleDeposit = async () => {
        console.log("📍 [9] Starting USDC deposit to CosmosBridge on Base Chain");
        console.log("📍 [10] CRITICAL - Cosmos address (receiver):", cosmosAddress);
        console.log("📍 [11] Web3 wallet (sender):", walletAddress);
        console.log("📍 [12] Current chain:", chain?.id, "Expected:", BASE_CHAIN_ID);

        if (!walletClient || !walletAddress || !cosmosAddress || !publicClient) {
            console.error("❌ [13] Missing required components:", {
                walletClient: !!walletClient,
                walletAddress,
                cosmosAddress,
                publicClient: !!publicClient
            });
            setError("Please connect MetaMask and generate a Cosmos wallet first");
            return;
        }

        // Check if on correct network
        if (needsNetworkSwitch) {
            setError("Please click \"Switch to Base Chain\" button above");
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            setError("Please enter a valid amount");
            return;
        }

        setIsDepositing(true);
        setError(null);

        try {
            const amountInUnits = parseUnits(amount, 6);
            console.log("📍 [14] Deposit parameters:", {
                amount: amount,
                amountInUnits: amountInUnits.toString(),
                amountInUSDC: parseFloat(amount),
                cosmosReceiver: cosmosAddress,
                bridgeContract: BRIDGE_ADDRESS,
                chainId: chain?.id
            });

            // Call depositUnderlying on CosmosBridge contract
            console.log("📍 [15] Simulating depositUnderlying call...");
            const { request } = await publicClient.simulateContract({
                address: BRIDGE_ADDRESS,
                abi: BRIDGE_ABI,
                functionName: "depositUnderlying",
                args: [amountInUnits, cosmosAddress], // receiver is string (Cosmos address)
                account: walletAddress
            });

            console.log("📍 [15] Simulation successful, sending transaction...");
            const hash = await walletClient.writeContract(request);
            console.log("📍 [16] Deposit transaction sent:", hash);

            // Wait for transaction confirmation
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            console.log("✅ [17] Deposit transaction confirmed on Base Chain:", {
                transactionHash: hash,
                blockNumber: receipt.blockNumber.toString(),
                status: receipt.status,
                gasUsed: receipt.gasUsed.toString()
            });

            console.log("🎉 [18] Deposit successful!");
            console.log("📍 [19] Bridge listener will detect this deposit and mint b52USDC to:", cosmosAddress);
            console.log("📍 [20] Transaction hash:", hash);
            console.log("📍 [21] View on Basescan: https://basescan.org/tx/" + hash);

            // Show success and close modal
            onSuccess?.();
            onClose();
            setAmount("");
        } catch (err) {
            console.error("❌ Deposit error:", err);
            setError(err instanceof Error ? err.message : "Failed to deposit USDC");
        } finally {
            setIsDepositing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div 
                className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4"
                style={{ 
                    backgroundColor: hexToRgba(colors.ui.bgDark, 0.95),
                    border: `1px solid ${hexToRgba(colors.brand.primary, 0.3)}`
                }}
            >
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">Deposit USDC</h2>
                </div>

                <div className="space-y-4">
                    {/* Balance Display */}
                    <div className="bg-gray-800 rounded-lg p-3">
                        <div className="text-sm text-gray-400">USDC Balance</div>
                        <div className="text-lg font-semibold text-white">
                            ${parseFloat(usdcBalance).toFixed(2)} USDC
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Deposit Amount (USDC)
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            disabled={isApproving || isDepositing}
                            min="0"
                            step="0.01"
                            max={usdcBalance}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-3">
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Cosmos Address Display */}
                    <div className="bg-gray-800 rounded-lg p-3">
                        <div className="text-sm text-gray-400">
                            {cosmosAddress
                                ? "b52USDC will be minted to your Cosmos address:"
                                : "⚠️ No Cosmos wallet found"}
                        </div>
                        <div className="text-xs font-mono text-gray-300 truncate">
                            {cosmosAddress || "Visit /wallet to generate a Cosmos wallet first"}
                        </div>
                    </div>

                    {/* Network Switch Button */}
                    {needsNetworkSwitch && (
                        <div className="space-y-3">
                            <div className="bg-yellow-900 bg-opacity-50 border border-yellow-500 rounded-lg p-3">
                                <p className="text-yellow-300 text-sm">
                                    ⚠️ Wrong Network: Connected to {chain?.name || `Chain ${chain?.id}`}
                                </p>
                            </div>
                            <button
                                onClick={handleSwitchNetwork}
                                disabled={isSwitching}
                                className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: isSwitching
                                        ? hexToRgba(colors.accent.warning, 0.5)
                                        : `linear-gradient(135deg, ${colors.accent.warning} 0%, ${hexToRgba(colors.accent.warning, 0.8)} 100%)`
                                }}
                            >
                                {isSwitching ? "Switching..." : "🔄 Switch to Base Chain"}
                            </button>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        {needsApproval ? (
                            <button
                                onClick={handleApprove}
                                disabled={isApproving || !amount || parseFloat(amount) <= 0}
                                className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: isApproving 
                                        ? hexToRgba(colors.brand.primary, 0.5)
                                        : `linear-gradient(135deg, ${colors.brand.primary} 0%, ${hexToRgba(colors.brand.primary, 0.8)} 100%)`
                                }}
                            >
                                {isApproving ? "Approving..." : "Approve USDC"}
                            </button>
                        ) : (
                            <button
                                onClick={handleDeposit}
                                disabled={isDepositing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(usdcBalance)}
                                className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: isDepositing 
                                        ? hexToRgba(colors.accent.success, 0.5)
                                        : `linear-gradient(135deg, ${colors.accent.success} 0%, ${hexToRgba(colors.accent.success, 0.8)} 100%)`
                                }}
                            >
                                {isDepositing ? "Depositing..." : "Deposit"}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            disabled={isApproving || isDepositing}
                            className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: `linear-gradient(135deg, ${colors.accent.danger} 0%, ${hexToRgba(colors.accent.danger, 0.8)} 100%)`
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default USDCDepositModal;