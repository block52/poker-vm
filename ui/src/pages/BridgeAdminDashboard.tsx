import { useState, useEffect, useCallback } from "react";
import { createSigningClientFromMnemonic } from "@bitcoinbrisbane/block52";
import { getCosmosMnemonic } from "../utils/cosmos/storage";
import useCosmosWallet from "../hooks/useCosmosWallet";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import { formatMicroAsUsdc } from "../constants/currency";
import { getCosmosUrls } from "../utils/cosmos/urls";

/**
 * BridgeAdminDashboard - Admin interface for viewing and processing bridge deposits
 *
 * Features:
 * - View all deposits from Ethereum bridge contract
 * - See processing status for each deposit
 * - Process individual deposits
 * - Filter by status (all/processed/pending)
 */

// Bridge contract ABI for deposits mapping
const DEPOSITS_ABI = ["function deposits(uint256) external view returns (string memory account, uint256 amount)"];

// Helper function to format USDC amounts (6 decimals)
const formatUSDC = (microAmount: string | number): string => {
    return formatMicroAsUsdc(microAmount, 6);
};

interface Deposit {
    index: number;
    recipient: string;
    amount: string;
    amountFormatted: string;
    status: "loading" | "processed" | "pending" | "error";
    errorMessage?: string;
    txHash?: string;
}

export default function BridgeAdminDashboard() {
    const cosmosWallet = useCosmosWallet();
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [maxIndex, setMaxIndex] = useState(10); // Query first 10 deposits by default
    const [processingIndex, setProcessingIndex] = useState<number | null>(null);
    const [filter, setFilter] = useState<"all" | "processed" | "pending">("all");
    const [configError, setConfigError] = useState<string | null>(null);

    // Ethereum configuration
    const bridgeContractAddress = "0xcc391c8f1aFd6DB5D8b0e064BA81b1383b14FE5B"; // Base Chain production
    const ethRpcUrl = import.meta.env.VITE_ALCHEMY_URL || import.meta.env.VITE_MAINNET_RPC_URL;

    // Validate Alchemy URL is configured
    useEffect(() => {
        if (!import.meta.env.VITE_ALCHEMY_URL) {
            const errorMsg =
                "⚠️ VITE_ALCHEMY_URL is not configured in .env file. Please add your Alchemy API key to enable bridge deposit queries. See ui/README.md for setup instructions.";
            setConfigError(errorMsg);
            console.error(errorMsg);
            toast.error("Alchemy API key not configured. Bridge queries may fail.");
        }
    }, []);

    // Load deposits from Ethereum contract
    const loadDeposits = useCallback(async () => {
        setIsLoading(true);
        const newDeposits: Deposit[] = [];

        try {
            // Connect to Ethereum
            const provider = new ethers.JsonRpcProvider(ethRpcUrl);
            const contract = new ethers.Contract(bridgeContractAddress, DEPOSITS_ABI, provider);

            // Query deposits by index
            for (let i = 0; i < maxIndex; i++) {
                try {
                    const [account, amount] = await contract.deposits(i);

                    // If account is empty, deposit doesn't exist
                    if (!account || account === "") {
                        console.log(`Deposit ${i} not found, stopping query`);
                        break;
                    }

                    newDeposits.push({
                        index: i,
                        recipient: account,
                        amount: amount.toString(),
                        amountFormatted: formatUSDC(amount.toString()),
                        status: "loading" // Will check processing status next
                    });
                } catch (err: any) {
                    console.error(`Failed to query deposit ${i}:`, err);
                    // If we get an error, likely reached the end
                    break;
                }
            }

            setDeposits(newDeposits);

            // Now check processing status for each deposit
            await checkProcessingStatus(newDeposits);
        } catch (err: any) {
            console.error("Failed to load deposits:", err);
            toast.error(`Failed to load deposits: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [maxIndex, ethRpcUrl]);

    // Check if deposits have been processed on Cosmos
    const checkProcessingStatus = async (depositsToCheck: Deposit[]) => {
        try {
            const { restEndpoint } = getCosmosUrls();

            // We need to check the deterministic txHash for each deposit
            // txHash = sha256(contractAddress + depositIndex)
            const updatedDeposits = await Promise.all(
                depositsToCheck.map(async deposit => {
                    try {
                        // Generate deterministic txHash (same as backend)
                        const txHashInput = `${bridgeContractAddress}-${deposit.index}`;
                        const encoder = new TextEncoder();
                        const data = encoder.encode(txHashInput);
                        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
                        const hashArray = Array.from(new Uint8Array(hashBuffer));
                        const txHash = "0x" + hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

                        // Query Cosmos to see if this txHash has been processed
                        const response = await fetch(`${restEndpoint}/block52/pokerchain/poker/v1/is_tx_processed/${txHash}`);

                        if (response.ok) {
                            const data = await response.json();
                            const isProcessed = data.processed === true || data.processed === "true";

                            return {
                                ...deposit,
                                status: isProcessed ? ("processed" as const) : ("pending" as const),
                                txHash
                            };
                        } else {
                            // API error, mark as pending
                            return {
                                ...deposit,
                                status: "pending" as const,
                                txHash
                            };
                        }
                    } catch (err) {
                        console.error(`Failed to check status for deposit ${deposit.index}:`, err);
                        return {
                            ...deposit,
                            status: "pending" as const
                        };
                    }
                })
            );

            setDeposits(updatedDeposits);
        } catch (err) {
            console.error("Failed to check processing status:", err);
        }
    };

    // Process a single deposit
    const handleProcessDeposit = async (depositIndex: number) => {
        if (!cosmosWallet.address) {
            toast.error("No Cosmos wallet found. Please create or import a wallet first.");
            return;
        }

        setProcessingIndex(depositIndex);

        try {
            // Get mnemonic from storage
            const mnemonic = getCosmosMnemonic();
            if (!mnemonic) {
                throw new Error("No mnemonic found in storage");
            }

            // Create signing client
            const { rpcEndpoint, restEndpoint } = getCosmosUrls();

            const signingClient = await createSigningClientFromMnemonic(
                {
                    rpcEndpoint,
                    restEndpoint,
                    chainId: "pokerchain",
                    prefix: "b52",
                    denom: "usdc",
                    gasPrice: "0.025stake"
                },
                mnemonic
            );

            console.log("🌉 Processing deposit index:", depositIndex);

            // Process the deposit
            const hash = await signingClient.processDeposit(depositIndex);

            // Wait for transaction confirmation
            setTimeout(async () => {
                try {
                    const txResponse = await signingClient.getTx(hash);

                    if (txResponse.tx_response.code !== 0) {
                        const errorMsg = txResponse.tx_response.raw_log || "Transaction failed";
                        toast.error(`Failed: ${errorMsg}`);

                        // Update deposit status to show error
                        setDeposits(prev => prev.map(d => (d.index === depositIndex ? { ...d, status: "error" as const, errorMessage: errorMsg } : d)));
                    } else {
                        toast.success(`Deposit ${depositIndex} processed successfully!`);

                        // Update deposit status to processed
                        setDeposits(prev => prev.map(d => (d.index === depositIndex ? { ...d, status: "processed" as const } : d)));
                    }
                } catch (err) {
                    console.log("Could not fetch tx details yet:", err);
                    toast.success(`Deposit ${depositIndex} processed successfully!`);

                    // Update deposit status to processed
                    setDeposits(prev => prev.map(d => (d.index === depositIndex ? { ...d, status: "processed" as const } : d)));
                }
            }, 2000);
        } catch (err: any) {
            console.error("Failed to process deposit:", err);
            const errorMessage = err.message || "Unknown error occurred";
            toast.error(`Failed: ${errorMessage}`);

            // Update deposit status to show error
            setDeposits(prev => prev.map(d => (d.index === depositIndex ? { ...d, status: "error" as const, errorMessage } : d)));
        } finally {
            setProcessingIndex(null);
        }
    };

    // Load deposits on mount
    useEffect(() => {
        loadDeposits();
    }, [maxIndex, loadDeposits]);

    // Filter deposits based on selected filter
    const filteredDeposits = deposits.filter(deposit => {
        if (filter === "all") return true;
        return deposit.status === filter;
    });

    // Stats
    const totalDeposits = deposits.length;
    const processedCount = deposits.filter(d => d.status === "processed").length;
    const pendingCount = deposits.filter(d => d.status === "pending").length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Bridge Admin Dashboard</h1>
                    <p className="text-gray-400">View and process Ethereum USDC bridge deposits</p>
                </div>

                {/* Configuration Error Warning */}
                {configError && (
                    <div className="mb-6 bg-red-900/30 border-2 border-red-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-red-200 font-semibold mb-1">Configuration Required</h3>
                                <p className="text-red-300 text-sm">{configError}</p>
                                <div className="mt-2 text-red-300 text-xs font-mono bg-red-950/50 p-2 rounded">
                                    Add to .env: VITE_ALCHEMY_URL="https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Total Deposits</p>
                        <p className="text-2xl font-bold text-white">{totalDeposits}</p>
                    </div>
                    <div className="bg-green-900/30 rounded-lg p-4 border border-green-700">
                        <p className="text-green-400 text-sm mb-1">Processed</p>
                        <p className="text-2xl font-bold text-green-300">{processedCount}</p>
                    </div>
                    <div className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-700">
                        <p className="text-yellow-400 text-sm mb-1">Pending</p>
                        <p className="text-2xl font-bold text-yellow-300">{pendingCount}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Contract</p>
                        <p className="text-xs font-mono text-white truncate" title={bridgeContractAddress}>
                            {bridgeContractAddress.slice(0, 10)}...
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex items-center gap-4">
                            <label className="text-white text-sm">Max Index to Query:</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={maxIndex}
                                onChange={e => setMaxIndex(parseInt(e.target.value) || 10)}
                                className="px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white w-24"
                            />
                            <button
                                onClick={loadDeposits}
                                disabled={isLoading}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-600"
                            >
                                {isLoading ? "Loading..." : "Refresh"}
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-white text-sm">Filter:</label>
                            <select
                                value={filter}
                                onChange={e => setFilter(e.target.value as any)}
                                className="px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                            >
                                <option value="all">All</option>
                                <option value="processed">Processed</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Deposits Table */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Index</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Recipient</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount (USDC)</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {filteredDeposits.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                            {isLoading ? "Loading deposits..." : "No deposits found"}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDeposits.map(deposit => (
                                        <tr key={deposit.index} className="hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-white font-mono text-sm">#{deposit.index}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-mono text-xs break-all" title={deposit.recipient}>
                                                        {deposit.recipient}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(deposit.recipient);
                                                            toast.success("Address copied!");
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
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="text-white font-semibold">{deposit.amountFormatted} USDC</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {deposit.status === "loading" && (
                                                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-700 text-gray-300">Loading...</span>
                                                )}
                                                {deposit.status === "processed" && (
                                                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-900/50 text-green-300 border border-green-700">
                                                        ✅ Processed
                                                    </span>
                                                )}
                                                {deposit.status === "pending" && (
                                                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-900/50 text-yellow-300 border border-yellow-700">
                                                        ⏳ Pending
                                                    </span>
                                                )}
                                                {deposit.status === "error" && (
                                                    <span
                                                        className="px-3 py-1 text-xs font-semibold rounded-full bg-red-900/50 text-red-300 border border-red-700 cursor-help"
                                                        title={deposit.errorMessage}
                                                    >
                                                        ❌ Error
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {deposit.status === "pending" || deposit.status === "error" ? (
                                                    <button
                                                        onClick={() => handleProcessDeposit(deposit.index)}
                                                        disabled={processingIndex === deposit.index || !cosmosWallet.address}
                                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors"
                                                    >
                                                        {processingIndex === deposit.index ? "Processing..." : "Process"}
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-500 text-sm">—</span>
                                                )}
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
                        <li>This dashboard queries the Base Chain bridge contract for all deposit events</li>
                        <li>Each deposit shows the Cosmos recipient address and USDC amount</li>
                        <li>Status indicates whether the deposit has been processed on Cosmos chain</li>
                        <li>Click "Process" to mint USDC on Cosmos for pending deposits</li>
                        <li>Processed deposits cannot be processed again (idempotency protection)</li>
                    </ul>
                </div>

                {/* Back to Dashboard */}
                <div className="mt-6 text-center">
                    <a href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
                        ← Back to Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}
