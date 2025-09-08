import React, { useState, useEffect } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseUnits, formatUnits, parseAbi } from "viem";
import { colors, hexToRgba } from "../utils/colorConfig";
import { useMintTokens } from "../rpc_calls/useMintTokens";
import { getPublicKey } from "../utils/b52AccountUtils";

interface USDCDepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

// Bridge contract address from deployment
const BRIDGE_ADDRESS = "0x092eEA7cE31C187Ff2DC26d0C250B011AEC1a97d";

// USDC contract address on Ethereum mainnet
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

// Contract ABIs - using parseAbi to convert from human-readable to JSON format
const USDC_ABI = parseAbi([
    "function balanceOf(address account) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)"
]);

const BRIDGE_ABI = parseAbi([
    "function depositUnderlying(uint256 amount, address receiver) external returns(uint256)",
    "event Deposited(address indexed receiver, uint256 amount, uint256 indexed index)"
]);

const USDCDepositModal: React.FC<USDCDepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [amount, setAmount] = useState("");
    const [isApproving, setIsApproving] = useState(false);
    const [isDepositing, setIsDepositing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usdcBalance, setUsdcBalance] = useState<string>("0");
    const [allowance, setAllowance] = useState<bigint>(0n);
    const [needsApproval, setNeedsApproval] = useState(false);

    const { address: walletAddress, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const { mint } = useMintTokens();

    // Get game account address (where tokens will be minted)
    const gameAccountAddress = getPublicKey();
    
    console.log("📍 [1] USDCDepositModal initialized:", {
        walletAddress,
        gameAccountAddress,
        isConnected,
        bridgeAddress: BRIDGE_ADDRESS,
        usdcAddress: USDC_ADDRESS
    });

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

    const handleDeposit = async () => {
        console.log("📍 [9] Starting USDC deposit process");
        console.log("📍 [10] CRITICAL - Game account (receiver):", gameAccountAddress);
        console.log("📍 [11] Web3 wallet (sender):", walletAddress);
        
        if (!walletClient || !walletAddress || !gameAccountAddress || !publicClient) {
            console.error("❌ [12] Missing required components:", {
                walletClient: !!walletClient,
                walletAddress,
                gameAccountAddress,
                publicClient: !!publicClient
            });
            setError("Please connect both wallets");
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
            console.log("📍 [13] Deposit parameters:", {
                amount: amount,
                amountInUnits: amountInUnits.toString(),
                amountInUSDC: parseFloat(amount),
                receiver: gameAccountAddress,
                bridgeContract: BRIDGE_ADDRESS
            });

            // Call depositUnderlying on Bridge contract
            console.log("📍 [14] Simulating depositUnderlying call...");
            const { request } = await publicClient.simulateContract({
                address: BRIDGE_ADDRESS,
                abi: BRIDGE_ABI,
                functionName: "depositUnderlying",
                args: [amountInUnits, gameAccountAddress as `0x${string}`],
                account: walletAddress
            });

            console.log("📍 [15] Simulation successful, sending transaction...");
            const hash = await walletClient.writeContract(request);
            console.log("📍 [16] Deposit transaction sent:", hash);

            // Wait for transaction confirmation
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            console.log("📍 [17] Deposit transaction confirmed:", {
                transactionHash: hash,
                blockNumber: receipt.blockNumber,
                status: receipt.status,
                gasUsed: receipt.gasUsed.toString(),
                logs: receipt.logs.length
            });

            // Get the deposit index from the event logs
            console.log("📍 [18] Parsing event logs to find deposit index...");
            console.log("📍 [18a] All receipt logs:", receipt.logs);
            
            const depositEvent = receipt.logs.find(log => 
                log.address.toLowerCase() === BRIDGE_ADDRESS.toLowerCase()
            );
            
            console.log("📍 [19] Deposit event found:", {
                eventFound: !!depositEvent,
                address: depositEvent?.address,
                topics: depositEvent?.topics,
                topicsHex: depositEvent?.topics?.map((t: any) => ({ 
                    raw: t, 
                    decimal: t ? BigInt(t).toString() : 'null' 
                })),
                data: depositEvent?.data,
                dataLength: depositEvent?.data?.length,
                topicsLength: depositEvent?.topics?.length
            });

            // The event is: event Deposited(address indexed receiver, uint256 amount, uint256 indexed index)
            // topics[0] = event signature hash
            // topics[1] = indexed receiver address (padded to 32 bytes)
            // topics[2] = indexed index value (if it exists)
            // data = amount (if index is indexed) OR amount + index (if index is not indexed)
            
            let depositIndex: string | undefined;
            
            if (depositEvent) {
                // Debug: Show all possible locations
                console.log("📍 [19a] Debugging event structure:");
                if (depositEvent.topics) {
                    depositEvent.topics.forEach((topic: any, i: number) => {
                        console.log(`  topics[${i}]:`, topic, "=>", topic ? BigInt(topic).toString() : 'null');
                    });
                }
                if (depositEvent.data && depositEvent.data !== '0x') {
                    const dataHex = depositEvent.data.slice(2);
                    console.log("  data (hex):", depositEvent.data);
                    console.log("  data length:", dataHex.length, "chars (", dataHex.length / 64, "words)");
                    
                    // Parse each 32-byte word in data
                    for (let i = 0; i < dataHex.length; i += 64) {
                        const word = '0x' + dataHex.slice(i, i + 64);
                        console.log(`  data word ${i/64}:`, word, "=>", BigInt(word).toString());
                    }
                }
                
                // Try multiple extraction methods
                // Method 1: Check if index is in topics[2] (indexed)
                if (depositEvent.topics && depositEvent.topics.length > 2 && depositEvent.topics[2]) {
                    depositIndex = BigInt(depositEvent.topics[2]).toString();
                    console.log("📍 [20a] Deposit index from topics[2]:", depositIndex);
                } 
                // Method 2: Parse from data field
                else if (depositEvent.data && depositEvent.data !== '0x') {
                    const dataHex = depositEvent.data.slice(2); // Remove 0x
                    
                    // If data has 2 words (128 chars), second word is likely the index
                    if (dataHex.length === 128) {
                        const indexHex = '0x' + dataHex.slice(64, 128);
                        depositIndex = BigInt(indexHex).toString();
                        console.log("📍 [20b] Deposit index from data (2nd word):", depositIndex);
                    }
                    // If data has 1 word (64 chars), it might be just the amount
                    else if (dataHex.length === 64) {
                        console.log("📍 [20c] Data only contains amount, index must be in topics");
                        // Index should be in topics[2] but wasn't found
                    }
                }
                
                // Method 3: Fallback - try to use transaction hash as a temporary index
                if (!depositIndex) {
                    console.log("📍 [20d] WARNING: Could not extract deposit index from event!");
                    console.log("📍 [20e] Event structure doesn't match expected format");
                    
                    // For debugging, let's try using a hash of the transaction as index
                    // This is a temporary workaround
                    const txHashAsNumber = BigInt('0x' + hash.slice(2, 10)); // Use first 8 chars of hash
                    depositIndex = txHashAsNumber.toString();
                    console.log("📍 [20f] Using transaction hash prefix as fallback index:", depositIndex);
                }
            }

            if (depositIndex) {
                console.log("📍 [20] Final deposit index from event:", depositIndex);
                
                // IMPORTANT: The event returns the NEXT index, we need to use index - 1
                const actualDepositIndex = (BigInt(depositIndex) - 1n).toString();
                console.log("📍 [20a] Adjusted deposit index (event index - 1):", actualDepositIndex);
                
                console.log("📍 [21] Calling mint RPC with:", {
                    depositIndex: actualDepositIndex,
                    transactionHash: hash,
                    receiver: gameAccountAddress
                });

                // Call mint RPC to credit tokens to game account
                try {
                    const mintResult = await mint({
                        depositIndex: actualDepositIndex
                    });
                    
                    console.log("✅ [22] Mint RPC response:", mintResult);
                    console.log("🎉 [23] COMPLETE - Tokens should be minted to:", gameAccountAddress);
                    
                    // Close modal and trigger success callback
                    onSuccess?.();
                    onClose();
                    setAmount("");
                } catch (mintError) {
                    console.error("❌ [22a] Mint RPC failed:", mintError);
                    console.log("📍 [22b] Deposit was successful but minting failed");
                    console.log("📍 [22c] You may need to manually mint with deposit index:", depositIndex);
                    
                    // Still close the modal since deposit succeeded
                    setError(`Deposit successful but minting failed. Please contact support with deposit index: ${depositIndex}`);
                    
                    // Don't close modal so user can see the error
                    // onClose();
                }
            } else {
                console.error("❌ [24] Failed to extract deposit index from event");
                throw new Error("Could not extract deposit index from transaction");
            }
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
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Deposit USDC</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                        disabled={isApproving || isDepositing}
                    >
                        ✕
                    </button>
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

                    {/* Game Account Display */}
                    <div className="bg-gray-800 rounded-lg p-3">
                        <div className="text-sm text-gray-400">Tokens will be minted to:</div>
                        <div className="text-xs font-mono text-gray-300 truncate">
                            {gameAccountAddress}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {needsApproval ? (
                            <button
                                onClick={handleApprove}
                                disabled={isApproving || !amount || parseFloat(amount) <= 0}
                                className="flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className="flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: isDepositing 
                                        ? hexToRgba(colors.accent.success, 0.5)
                                        : `linear-gradient(135deg, ${colors.accent.success} 0%, ${hexToRgba(colors.accent.success, 0.8)} 100%)`
                                }}
                            >
                                {isDepositing ? "Depositing..." : "Deposit"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default USDCDepositModal;