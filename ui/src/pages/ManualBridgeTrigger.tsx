import { useState } from "react";
import { createSigningClientFromMnemonic } from "@bitcoinbrisbane/block52";
import { getCosmosMnemonic } from "../utils/cosmos/storage";
import useCosmosWallet from "../hooks/useCosmosWallet";
import { useNetwork } from "../context/NetworkContext";
import { toast } from "react-toastify";
import { formatMicroAsUsdc } from "../constants/currency";
import { getCosmosUrls } from "../utils/cosmos/urls";

/**
 * ManualBridgeTrigger - Simple page to manually process bridge deposits
 *
 * MVP Features:
 * - Input field for deposit index
 * - "Process Deposit" button
 * - Status display
 * - Transaction hash on success
 */

// Helper function to format USDC amounts (6 decimals)
const formatUSDC = (microAmount: string | number): string => {
    return formatMicroAsUsdc(microAmount, 6);
};

export default function ManualBridgeTrigger() {
    const cosmosWallet = useCosmosWallet();
    const { currentNetwork } = useNetwork();
    const [depositIndex, setDepositIndex] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [depositDetails, setDepositDetails] = useState<any>(null);

    const handleProcessDeposit = async () => {
        const index = parseInt(depositIndex);
        if (isNaN(index) || index < 0) {
            setError("Please enter a valid deposit index (0 or greater)");
            return;
        }

        if (!cosmosWallet.address) {
            setError("No Block52 wallet found. Please create or import a wallet first.");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setTxHash(null);
        setDepositDetails(null);

        try {
            // Get mnemonic from storage
            const mnemonic = getCosmosMnemonic();
            if (!mnemonic) {
                throw new Error("No mnemonic found in storage");
            }

            // Create signing client
            const { rpcEndpoint, restEndpoint } = getCosmosUrls(currentNetwork);

            const signingClient = await createSigningClientFromMnemonic(
                {
                    rpcEndpoint,
                    restEndpoint,
                    chainId: "pokerchain",
                    prefix: "b52",
                    denom: "usdc",
                    gasPrice: "0.025stake" // Use stake for testnet fees
                },
                mnemonic
            );

            console.log("🌉 Processing deposit index:", index);

            // Process the deposit
            const hash = await signingClient.processDeposit(index);

            // Wait a bit then query the transaction for details and check if it succeeded
            setTimeout(async () => {
                try {
                    const txResponse = await signingClient.getTx(hash);
                    console.log("Transaction details:", txResponse);
                    setDepositDetails(txResponse);

                    // Check if transaction actually succeeded (code 0 = success, non-zero = error)
                    if (txResponse.tx_response.code !== 0) {
                        const errorMsg = txResponse.tx_response.raw_log || "Transaction failed";
                        setError(errorMsg);
                        setTxHash(null);
                        toast.error(`Failed: ${errorMsg}`);
                    } else {
                        setTxHash(hash);
                        toast.success(`Deposit ${index} processed successfully!`);
                    }
                } catch (err) {
                    console.log("Could not fetch tx details yet:", err);
                    // If we can't fetch details, assume it succeeded (hash was returned)
                    setTxHash(hash);
                    toast.success(`Deposit ${index} processed successfully!`);
                }
            }, 2000);
        } catch (err: any) {
            console.error("Failed to process deposit:", err);
            const errorMessage = err.message || "Unknown error occurred";
            setError(errorMessage);
            toast.error(`Failed: ${errorMessage}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Manual Bridge Trigger</h1>
                    <p className="text-gray-400">Process Ethereum deposits manually by deposit index</p>
                </div>

                {/* Wallet Info */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
                    <h2 className="text-lg font-semibold text-white mb-3">Block52 Wallet</h2>
                    {cosmosWallet.address ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Address:</span>
                                <span className="text-white font-mono text-sm">{cosmosWallet.address}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Balance:</span>
                                <span className="text-white">{formatUSDC(cosmosWallet.balance.find(b => b.denom === "usdc")?.amount || "0")} USDC</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-yellow-500">No wallet connected. Please import a wallet first.</p>
                    )}
                </div>

                {/* Process Deposit Card */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h2 className="text-lg font-semibold text-white mb-4">Process Deposit</h2>

                    <div className="space-y-4">
                        {/* Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Deposit Index</label>
                            <input
                                type="number"
                                min="0"
                                value={depositIndex}
                                onChange={e => setDepositIndex(e.target.value)}
                                placeholder="Enter deposit index (e.g., 0, 1, 2...)"
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                disabled={isProcessing}
                            />
                            <p className="text-xs text-gray-500 mt-1">The index of the deposit in the Ethereum bridge contract</p>
                        </div>

                        {/* Process Button */}
                        <button
                            onClick={handleProcessDeposit}
                            disabled={isProcessing || !cosmosWallet.address}
                            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                                isProcessing || !cosmosWallet.address ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                            }`}
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                "Process Deposit on Block52"
                            )}
                        </button>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
                            <p className="text-red-200 text-sm font-medium">Error</p>
                            <p className="text-red-300 text-sm mt-1">{error}</p>
                        </div>
                    )}

                    {/* Success Display */}
                    {txHash && (
                        <div className="mt-4 p-4 bg-green-900/50 border border-green-700 rounded-lg">
                            <p className="text-green-200 text-sm font-medium mb-2">Success! ✅</p>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-green-300 text-xs">Transaction Hash:</p>
                                    <p className="text-green-100 text-sm font-mono break-all">{txHash}</p>
                                </div>
                                {depositDetails && (
                                    <div className="mt-3 pt-3 border-t border-green-700">
                                        <p className="text-green-300 text-xs mb-2">Deposit Details:</p>
                                        <pre className="text-green-100 text-xs bg-gray-900 p-2 rounded overflow-auto max-h-48">
                                            {JSON.stringify(depositDetails, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                    <h3 className="text-blue-200 font-semibold mb-2">How it works:</h3>
                    <ol className="text-blue-300 text-sm space-y-1 list-decimal list-inside">
                        <li>User deposits USDC on Base Chain to bridge contract</li>
                        <li>Deposit is logged with an incremental index (0, 1, 2, ...)</li>
                        <li>Enter the deposit index here and click "Process"</li>
                        <li>Chain queries Ethereum contract for deposit data</li>
                        <li>If valid and not processed, mints USDC on Cosmos</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
