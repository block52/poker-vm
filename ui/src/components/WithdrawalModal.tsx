import React, { useState, useMemo, useEffect } from "react";
import { ethers } from "ethers";
import { getClient, getPublicKey } from "../utils/b52AccountUtils";
import { useAccount } from "../hooks/useAccount";
import { formatBalance } from "../utils/numberUtils";
import { colors, hexToRgba } from "../utils/colorConfig";
import useUserWalletConnect from "../hooks/DepositPage/useUserWalletConnect";
import { WithdrawResponseDTO } from "@bitcoinbrisbane/block52";
import useWithdraw from "../hooks/DepositPage/useWithdraw";

/**
 * WithdrawalModal Component
 * 
 * PURPOSE:
 * Allows users to withdraw funds from their Layer 2 game wallet to their connected MetaMask wallet.
 * This component handles the entire withdrawal flow including validation, SDK interaction, MetaMask transaction signing, and user feedback.
 * 
 * TECHNICAL FLOW:
 * 1. User must have MetaMask connected (withdrawal address comes from connected wallet)
 * 2. User enters amount to withdraw
 * 3. Component validates the amount and checks sufficient balance
 * 4. Uses Block52 SDK to prepare withdrawal proof (nonce, signature)
 * 5. Executes Web3 transaction via MetaMask using the proof
 * 6. User pays gas fees via MetaMask for the withdrawal
 * 7. User receives funds on Ethereum mainnet
 * 
 * DEPENDENCIES:
 * - @bitcoinbrisbane/block52 SDK for withdrawal proof generation
 * - ethers.js for address validation and amount conversion
 * - wagmi/viem for Web3 transaction execution
 * - MetaMask (REQUIRED) for transaction signing and gas payment
 * - Private key stored in localStorage for L2 account signing
 * 
 * IMPORTANT: Understanding the addresses/accounts involved:
 * 
 * 1. GAME ACCOUNT (Layer 2 / Block52 Chain):
 *    - This is the player's Layer 2 gaming wallet
 *    - Private key is stored in browser localStorage
 *    - Used for all in-game transactions (bets, calls, folds, etc.)
 *    - This is WHERE the funds are being withdrawn FROM
 *    - Accessed via: getPublicKey() from localStorage
 * 
 * 2. CONNECTED METAMASK WALLET (REQUIRED):
 *    - External MetaMask wallet connected via WalletConnect/Web3Modal
 *    - REQUIRED for withdrawals (not optional)
 *    - Used as the receiver address for withdrawals
 *    - User pays gas fees from this wallet
 *    - This is WHERE the funds are being sent TO on mainnet
 * 
 * WITHDRAWAL FLOW:
 * 1. SDK prepares withdrawal proof using L2 private key
 * 2. MetaMask executes bridge contract withdrawal using proof
 * 3. Game Account (L2) → Bridge Contract → MetaMask Wallet (Mainnet)
 * 
 * LOGGING:
 * Comprehensive logging is implemented for debugging:
 * - [WithdrawalModal] prefix for all logs
 * - Logs each step of the withdrawal process
 * - Logs all parameters and responses
 * - Error details including message, code, and data
 */

interface WithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, onSuccess }) => {
    // Get the Layer 2 game account public key from localStorage
    // This is the account that holds the funds to be withdrawn
    const publicKey = getPublicKey();
    const { account, refetch: refetchAccount } = useAccount(publicKey || undefined);
    const { address: web3Address, isConnected: isWeb3Connected } = useUserWalletConnect();
    
    // Amount to withdraw in USDC
    const [amount, setAmount] = useState("");
    
    // UI state management
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [txData, setTxData] = useState<any>(null);

    // Add the withdraw hook at the top level (IMPORTANT: NOT inside handleWithdraw)
    const {
        withdraw: contractWithdraw,
        hash: contractHash,
        isLoading: isContractLoading,
        isWithdrawPending: isContractPending,
        isWithdrawConfirmed: isContractConfirmed,
        withdrawError: contractError
    } = useWithdraw();

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setAmount("");
            setError("");
            setSuccess(false);
            setTxData(null);
            refetchAccount();
            
            console.log("[WithdrawalModal] Modal opened");
            console.log("[WithdrawalModal] Web3 Connected:", isWeb3Connected);
            console.log("[WithdrawalModal] Web3 Address:", web3Address);
            console.log("[WithdrawalModal] L2 Account Address:", publicKey);
        }
    }, [isOpen, refetchAccount, web3Address, isWeb3Connected, publicKey]);

    const modalOverlayStyle = useMemo(() => ({
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)"
    }), []);

    const modalContentStyle = useMemo(() => ({
        backgroundColor: colors.ui.bgDark,
        border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
    }), []);

    const inputStyle = useMemo(() => ({
        backgroundColor: hexToRgba(colors.ui.bgMedium, 0.5),
        border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`,
        color: "#ffffff"
    }), []);

    const buttonStyle = useMemo(() => ({
        background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${hexToRgba(colors.brand.primary, 0.8)} 100%)`
    }), []);

    const cancelButtonStyle = useMemo(() => ({
        backgroundColor: hexToRgba(colors.ui.bgMedium, 0.5),
        border: `1px solid ${hexToRgba(colors.ui.textSecondary, 0.3)}`
    }), []);

    /**
     * Validates if the provided string is a valid Ethereum address
     * @param address - The address string to validate
     * @returns true if valid Ethereum address, false otherwise
     * 
     * Note: ethers.isAddress checks for:
     * - Correct length (42 characters including 0x)
     * - Valid hex characters
     * - Valid checksum (if checksummed address)
     */
    const validateEthereumAddress = (address: string): boolean => {
        try {
            // ethers.isAddress returns true for valid addresses
            // Handles both checksummed and non-checksummed addresses
            return ethers.isAddress(address);
        } catch {
            // Return false if any error occurs during validation
            return false;
        }
    };

    /**
     * Validates if the withdrawal amount is valid
     * @param value - The amount string to validate
     * @returns true if amount is valid and sufficient balance exists
     * 
     * Validation checks:
     * 1. Amount is a valid number
     * 2. Amount is greater than 0
     * 3. Amount is less than or equal to available balance
     * 4. Amount meets minimum withdrawal threshold (0.01 USDC)
     */
    const validateAmount = (value: string): boolean => {
        // Check if value exists and is a valid positive number
        if (!value || isNaN(Number(value)) || Number(value) <= 0) {
            return false;
        }
        
        // Check minimum withdrawal amount (0.01 USDC)
        if (Number(value) < 0.01) {
            return false;
        }
        
        // Ensure account data is loaded
        if (!account) return false;
        
        // Convert balance from wei to USDC for comparison
        // Use the same formatBalance function as Dashboard for consistency
        // formatBalance returns a string, so we need to convert back to number
        const balanceInUSDC = Number(formatBalance(account.balance));
        
        // Check if user has sufficient balance
        return Number(value) <= balanceInUSDC;
    };

    /**
     * Handles the withdrawal process
     * 
     * Flow:
     * 1. Validate receiver address format
     * 2. Validate withdrawal amount and balance
     * 3. Get SDK client with L2 private key
     * 4. Convert amount to wei
     * 5. Call SDK withdraw method
     * 6. Handle success/error states
     * 7. Refresh balance and close modal
     */
    // Update the handleWithdraw function
    const handleWithdraw = async () => {
        console.log("[WithdrawalModal] === Starting withdrawal process ===");
        console.log("[WithdrawalModal] Web3 Connected:", isWeb3Connected);
        console.log("[WithdrawalModal] Web3 Address:", web3Address);
        console.log("[WithdrawalModal] Amount:", amount, "USDC");
        
        // STEP 1: Check if MetaMask is connected
        if (!isWeb3Connected || !web3Address) {
            console.error("[WithdrawalModal] MetaMask not connected");
            setError("Please connect your MetaMask wallet first");
            return;
        }

        // STEP 2: Validate the connected wallet address
        if (!validateEthereumAddress(web3Address)) {
            console.error("[WithdrawalModal] Invalid MetaMask address:", web3Address);
            setError("Invalid MetaMask wallet address");
            return;
        }

        // STEP 3: Validate the amount
        if (!validateAmount(amount)) {
            if (Number(amount) < 0.01) {
                console.error("[WithdrawalModal] Amount too small:", amount);
                setError("Minimum withdrawal amount is 0.01 USDC");
            } else {
                console.error("[WithdrawalModal] Invalid amount or insufficient balance:", amount);
                setError("Invalid amount or insufficient balance");
            }
            return;
        }

        setIsWithdrawing(true);
        setError("");

        try {
            // Get the SDK client instance
            const client = getClient();
            const amountInWei = ethers.parseEther(amount).toString();
            
            console.log("[WithdrawalModal] STEP 1: Calling SDK withdraw");
            console.log("[WithdrawalModal] - Amount in Wei:", amountInWei);
            console.log("[WithdrawalModal] - From L2 Address:", publicKey);
            console.log("[WithdrawalModal] - To Mainnet Address:", web3Address);
            
            // STEP 1: Call the SDK to prepare the withdrawal
            const result: WithdrawResponseDTO = await client.withdraw(
                amountInWei,
                publicKey || undefined,
                web3Address  // Use the connected MetaMask address
            );

            console.log("[WithdrawalModal] SDK withdrawal response received:", result);
            console.log("[WithdrawalModal] - Nonce:", result.nonce);
            console.log("[WithdrawalModal] - Signature:", result.signature);

            console.log("[WithdrawalModal] STEP 2: Executing Web3 transaction via MetaMask");
            
            // STEP 2: Now call the smart contract with the SDK response
            await contractWithdraw(
                result.nonce,
                web3Address,  // Use the connected MetaMask address
                BigInt(amountInWei),
                result.signature
            );

            console.log("[WithdrawalModal] Web3 transaction submitted successfully");
            setSuccess(true);
            setTxData(result);
            
            // Refresh balance after successful withdrawal
            setTimeout(() => {
                console.log("[WithdrawalModal] Refreshing account balance");
                refetchAccount();
                if (onSuccess) {
                    onSuccess();
                }
            }, 2000);
            
        } catch (err: any) {
            console.error("[WithdrawalModal] Withdrawal error:", err);
            console.error("[WithdrawalModal] Error details:", {
                message: err.message,
                code: err.code,
                data: err.data
            });
            
            if (err.message?.includes("insufficient")) {
                setError("Insufficient balance for withdrawal");
            } else if (err.message?.includes("network")) {
                setError("Network error. Please try again");
            } else if (err.message?.includes("signature")) {
                setError("Failed to sign transaction. Please try again");
            } else if (err.message?.includes("rejected")) {
                setError("Transaction rejected by user");
            } else {
                setError(err.message || "Failed to process withdrawal");
            }
        } finally {
            setIsWithdrawing(false);
            console.log("[WithdrawalModal] === Withdrawal process completed ===");
        }
    };

    // // Add useEffect to handle contract confirmation
    // useEffect(() => {
    //     if (isContractConfirmed) {
    //         console.log("Smart contract withdrawal confirmed!", contractHash);
            
    //         // Refresh account balance
    //         setTimeout(() => {
    //             refetchAccount();
    //             if (onSuccess) {
    //                 onSuccess();
    //             }
    //         }, 2000);
            
    //         // Auto-close modal
    //         setTimeout(() => {
    //             onClose();
    //         }, 3000);
    //     }
    // }, [isContractConfirmed, contractHash, refetchAccount, onSuccess, onClose]);


    if (!isOpen) return null;

    // Convert balance from wei to USDC for display and validation
    // Use the same formatBalance function as Dashboard for consistency
    const balanceInUSDC = account?.balance ? formatBalance(account.balance) : "0.00";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={modalOverlayStyle}>
            <div className="rounded-xl p-6 w-full max-w-md mx-4" style={modalContentStyle}>
                <h2 className="text-2xl font-bold mb-4 text-white">
                    Withdraw Funds
                </h2>
                
                {/* Current Balance */}
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: hexToRgba(colors.ui.bgMedium, 0.3) }}>
                    <p className="text-sm" style={{ color: colors.ui.textSecondary }}>Available Balance</p>
                    <p className="text-xl font-bold" style={{ color: colors.brand.primary }}>
                        ${account ? formatBalance(account.balance) : "0.00"} USDC
                    </p>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="mb-4 p-3 rounded-lg" style={{ 
                        backgroundColor: hexToRgba(colors.accent.success, 0.1),
                        border: `1px solid ${colors.accent.success}`
                    }}>
                        <p className="font-semibold" style={{ color: colors.accent.success }}>
                            Withdrawal Successful!
                        </p>
                        {txData && (
                            <p className="text-sm mt-2" style={{ color: colors.ui.textSecondary }}>
                                Transaction processing on blockchain...
                            </p>
                        )}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg" style={{ 
                        backgroundColor: hexToRgba(colors.accent.danger, 0.1),
                        border: `1px solid ${colors.accent.danger}`
                    }}>
                        <p style={{ color: colors.accent.danger }}>{error}</p>
                    </div>
                )}

                {!success && (
                    <>
                        {/* MetaMask Connection Status */}
                        {!isWeb3Connected || !web3Address ? (
                            <div className="mb-4 p-3 rounded-lg" style={{ 
                                backgroundColor: hexToRgba("#FFA500", 0.1),
                                border: `1px solid #FFA500`
                            }}>
                                <p className="font-semibold mb-2" style={{ color: "#FFA500" }}>
                                    MetaMask Not Connected
                                </p>
                                <p className="text-sm" style={{ color: colors.ui.textSecondary }}>
                                    Please connect your MetaMask wallet to withdraw funds. The withdrawal will be sent to your connected MetaMask address.
                                </p>
                            </div>
                        ) : (
                            /* Receiver Address Display (Read-only) */
                            <div className="mb-4">
                                <label className="block text-sm mb-2" style={{ color: colors.ui.textSecondary }}>
                                    Withdrawal Address (MetaMask)
                                </label>
                                <div className="p-3 rounded-lg" style={{
                                    backgroundColor: hexToRgba(colors.ui.bgMedium, 0.3),
                                    border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                                }}>
                                    <p className="font-mono text-sm" style={{ color: colors.brand.primary }}>
                                        {web3Address}
                                    </p>
                                </div>
                                <p className="text-xs mt-1 text-gray-500">
                                    Funds will be sent to your connected MetaMask wallet
                                </p>
                            </div>
                        )}

                        {/* Amount Input - Only show if MetaMask is connected */}
                        {isWeb3Connected && web3Address && (
                            <div className="mb-6">
                                <label className="block text-sm mb-2" style={{ color: colors.ui.textSecondary }}>
                                    Amount (USDC)
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    max={balanceInUSDC}
                                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                                    style={inputStyle}
                                    disabled={isWithdrawing}
                                />
                                <div className="flex justify-between mt-1">
                                    <p className="text-xs text-gray-500">
                                        Minimum: 0.01 USDC
                                    </p>
                                    <button
                                        onClick={() => setAmount(balanceInUSDC)}
                                        className="text-xs underline hover:opacity-80"
                                        style={{ color: colors.brand.primary }}
                                        disabled={isWithdrawing}
                                    >
                                        Max
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 px-4 rounded-lg font-semibold transition hover:opacity-80"
                        style={cancelButtonStyle}
                        disabled={isWithdrawing}
                    >
                        Cancel
                    </button>
                    {!success && (
                        <button
                            onClick={handleWithdraw}
                            className="flex-1 py-2 px-4 rounded-lg font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                            style={buttonStyle}
                            disabled={isWithdrawing || !isWeb3Connected || !web3Address || !amount}
                        >
                            {isWithdrawing ? "Processing..." : (!isWeb3Connected ? "Connect Wallet First" : "Withdraw")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WithdrawalModal;

