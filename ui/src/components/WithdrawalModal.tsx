import React, { useState, useMemo, useEffect } from "react";
import { ethers } from "ethers";
import { getClient, getPublicKey } from "../utils/b52AccountUtils";
import { useAccount } from "../hooks/useAccount";
import { formatBalance } from "../utils/numberUtils";
import { colors, hexToRgba } from "../utils/colorConfig";

/**
 * WithdrawalModal Component
 * 
 * PURPOSE:
 * Allows users to withdraw funds from their Layer 2 game wallet to any Ethereum mainnet address.
 * This component handles the entire withdrawal flow including validation, SDK interaction, and user feedback.
 * 
 * TECHNICAL FLOW:
 * 1. User enters an Ethereum address (destination) and amount to withdraw
 * 2. Component validates the address format and checks sufficient balance
 * 3. Uses Block52 SDK to sign and submit withdrawal request
 * 4. Backend processes withdrawal through the bridge contract
 * 5. User receives funds on Ethereum mainnet
 * 
 * DEPENDENCIES:
 * - @bitcoinbrisbane/block52 SDK for withdrawal API
 * - ethers.js for address validation and amount conversion
 * - Private key stored in localStorage for transaction signing
 * 
 * IMPORTANT: Understanding the three different addresses/accounts:
 * 
 * 1. GAME ACCOUNT (Layer 2 / Block52 Chain):
 *    - This is the player's Layer 2 gaming wallet
 *    - Private key is stored in browser localStorage
 *    - Used for all in-game transactions (bets, calls, folds, etc.)
 *    - This is WHERE the funds are being withdrawn FROM
 *    - Accessed via: getPublicKey() from localStorage
 * 
 * 2. CONNECTED WEB3 WALLET (Optional):
 *    - External wallet like MetaMask, WalletConnect, etc.
 *    - Connected via WalletConnect/Web3Modal
 *    - Currently used for deposits but NOT required for withdrawals
 *    - Could be used as default receiver address if user prefers
 * 
 * 3. RECEIVER ADDRESS (Ethereum Mainnet):
 *    - The destination Ethereum address for the withdrawal
 *    - Can be ANY valid Ethereum address the user controls
 *    - Does NOT need to be the connected wallet
 *    - User manually enters this address in the form
 *    - This is WHERE the funds are being sent TO on mainnet
 * 
 * WITHDRAWAL FLOW:
 * Game Account (L2) → Bridge → Receiver Address (Mainnet)
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
    
    // Receiver address - where the user wants to receive funds on Ethereum mainnet
    const [receiverAddress, setReceiverAddress] = useState("");
    
    // Amount to withdraw in USDC
    const [amount, setAmount] = useState("");
    
    // UI state management
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [txData, setTxData] = useState<any>(null);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setReceiverAddress("");
            setAmount("");
            setError("");
            setSuccess(false);
            setTxData(null);
            refetchAccount();
        }
    }, [isOpen, refetchAccount]);

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
        
        // Convert balance from wei to ether for comparison
        // account.balance is in wei (smallest unit)
        // User enters amount in USDC (ether units)
        const balanceInEther = ethers.formatEther(account.balance);
        
        // Check if user has sufficient balance
        return Number(value) <= Number(balanceInEther);
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
    const handleWithdraw = async () => {
        // STEP 1: Validate the receiver address (where funds will be sent on mainnet)
        if (!validateEthereumAddress(receiverAddress)) {
            setError("Please enter a valid Ethereum address");
            return;
        }

        // STEP 2: Validate the amount against the Layer 2 game account balance
        if (!validateAmount(amount)) {
            // Provide specific error message based on validation failure
            if (Number(amount) < 0.01) {
                setError("Minimum withdrawal amount is 0.01 USDC");
            } else {
                setError("Invalid amount or insufficient balance");
            }
            return;
        }

        setIsWithdrawing(true);
        setError("");

        try {
            // Get the SDK client instance using the game account private key from localStorage
            const client = getClient();
            
            // Convert amount from USDC (ether units) to wei for the blockchain
            const amountInWei = ethers.parseEther(amount).toString();
            
            /**
             * Call the withdraw method from the Block52 SDK (@bitcoinbrisbane/block52)
             * 
             * SDK Method Signature:
             * withdraw(amount: string, from?: string, receiver?: string, nonce?: number)
             * 
             * Parameters we provide:
             * 1. amountInWei - Amount to withdraw in wei (string)
             * 2. publicKey - The Layer 2 game account address (source of funds)
             * 3. receiverAddress - The Ethereum mainnet address (destination)
             * 
             * What the SDK does internally:
             * - Retrieves the current nonce from the L2 account if not provided
             * - Signs the withdrawal request using the private key from localStorage
             * - Constructs the RPC request with method "WITHDRAW"
             * - Sends the signed request to the PVM backend
             * - Returns a WithdrawResponseDTO with transaction details
             * 
             * The backend will then:
             * - Validate the signature and account balance
             * - Process the withdrawal through the bridge
             * - Send funds to the receiver address on Ethereum mainnet
             */
            const result = await client.withdraw(
                amountInWei,                    // Amount in wei as string
                publicKey || undefined,          // From: Layer 2 game account (optional, defaults to client address)
                receiverAddress                  // To: User's specified Ethereum address
            );
            
            setSuccess(true);
            setTxData(result);
            
            // Refresh account balance after 2 seconds to allow backend to process
            setTimeout(() => {
                refetchAccount();
                // Call parent's success callback if provided
                if (onSuccess) {
                    onSuccess();
                }
            }, 2000);
            
            // Auto-close modal after 3 seconds to show success message
            setTimeout(() => {
                onClose();
            }, 3000);
            
        } catch (err: any) {
            // Log full error for debugging
            console.error("Withdrawal error:", err);
            
            // Provide user-friendly error messages
            if (err.message?.includes("insufficient")) {
                setError("Insufficient balance for withdrawal");
            } else if (err.message?.includes("network")) {
                setError("Network error. Please try again");
            } else if (err.message?.includes("signature")) {
                setError("Failed to sign transaction. Please try again");
            } else {
                // Fallback to generic error or actual error message
                setError(err.message || "Failed to process withdrawal");
            }
        } finally {
            setIsWithdrawing(false);
        }
    };

    if (!isOpen) return null;

    const balanceInEther = account ? ethers.formatEther(account.balance) : "0";

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
                        {formatBalance(balanceInEther)} USDC
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
                                Transaction ID: {txData.id || txData.transactionId || "Processing..."}
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
                        {/* Receiver Address Input */}
                        <div className="mb-4">
                            <label className="block text-sm mb-2" style={{ color: colors.ui.textSecondary }}>
                                Ethereum Address
                            </label>
                            <input
                                type="text"
                                value={receiverAddress}
                                onChange={(e) => setReceiverAddress(e.target.value)}
                                placeholder="0x..."
                                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                                style={inputStyle}
                                disabled={isWithdrawing}
                            />
                            <p className="text-xs mt-1 text-gray-500">
                                Enter the Ethereum address where you want to receive your funds
                            </p>
                        </div>

                        {/* Amount Input */}
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
                                max={balanceInEther}
                                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                                style={inputStyle}
                                disabled={isWithdrawing}
                            />
                            <div className="flex justify-between mt-1">
                                <p className="text-xs text-gray-500">
                                    Minimum: 0.01 USDC
                                </p>
                                <button
                                    onClick={() => setAmount(balanceInEther)}
                                    className="text-xs underline hover:opacity-80"
                                    style={{ color: colors.brand.primary }}
                                    disabled={isWithdrawing}
                                >
                                    Max
                                </button>
                            </div>
                        </div>
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
                            disabled={isWithdrawing || !receiverAddress || !amount}
                        >
                            {isWithdrawing ? "Processing..." : "Withdraw"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WithdrawalModal;