import { useCallback, useState } from "react";
import axios from "axios";
import { PROXY_URL } from "../../config/constants";
import { ethers } from "ethers";
import { HandParams } from "./types";

// Interface for the hook return type
interface UseTableRaiseReturn {
    raiseHand: (args: HandParams) => Promise<any>;
    isRaising: boolean;
    error: Error | null;
}

/**
 * Hook to handle the raise action on a poker table
 * @param tableId The ID of the table
 * @returns Object with raiseHand function and loading state
 */
export function useTableRaise(tableId?: string): UseTableRaiseReturn {
    const [isRaising, setIsRaising] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Function to raise on hand
    const raiseHand = useCallback(
        async ({ userAddress, privateKey, publicKey, actionIndex, amount }: HandParams): Promise<any> => {
            if (!tableId) {
                const noTableError = new Error("No table ID provided");
                setError(noTableError);
                return Promise.reject(noTableError);
            }

            if (!privateKey) {
                const noPrivateKeyError = new Error("Private key is required");
                setError(noPrivateKeyError);
                return Promise.reject(noPrivateKeyError);
            }

            if (!amount) {
                const noAmountError = new Error("Raise amount is required");
                setError(noAmountError);
                return Promise.reject(noAmountError);
            }

            if (!userAddress) {
                const noAddressError = new Error("User address is required");
                setError(noAddressError);
                return Promise.reject(noAddressError);
            }

            setIsRaising(true);
            setError(null);

            try {
                console.log(`Raising on table ${tableId} with action index ${actionIndex} and amount ${amount}`);
                
                // Create a wallet instance to sign the message
                const wallet = new ethers.Wallet(privateKey);
                
                // Create the message to sign - Add delimiters for clarity and reliability
                const timestamp = Math.floor(Date.now() / 1000).toString();
                const nonce = Date.now().toString(); // Use timestamp as nonce
                const message = `raise:${amount}:${tableId}:${timestamp}`;
                
                // Sign the message
                const signature = await wallet.signMessage(message);
                
                // Make API call to raise 
                const response = await axios.post(`${PROXY_URL}/table/${tableId}/raise`, {
                    tableId,
                    privateKey,
                    actionIndex,
                    amount,
                    userAddress,
                    publicKey,
                    signature,
                    timestamp,
                    nonce
                });

                console.log("Raise response:", response.data);
                
                setIsRaising(false);
                return response.data;
            } catch (err: any) {
                console.error("Error raising:", err);
                setError(err);
                setIsRaising(false);
                throw err;
            }
        },
        [tableId]
    );

    const result = { raiseHand, isRaising, error };

    console.log("[useTableRaise] Returns:", {
        hasRaiseFunction: !!result.raiseHand,
        isRaising: result.isRaising,
        hasError: !!result.error,
        tableId
    });

    return result;
}
