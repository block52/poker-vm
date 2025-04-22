import { useCallback, useState } from "react";
import axios from "axios";
import { PROXY_URL } from "../config/constants";

// Types for the raise parameters
interface RaiseHandArgs {
    userAddress?: string | null;
    privateKey?: string | null;
    publicKey?: string | null;
    actionIndex: number;
    amount: string; // Amount to raise in wei
}

// Interface for the hook return type
interface UseTableRaiseReturn {
    raiseHand: (args: RaiseHandArgs) => Promise<any>;
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
        async ({ userAddress, privateKey, publicKey, actionIndex, amount }: RaiseHandArgs): Promise<any> => {
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

            setIsRaising(true);
            setError(null);

            try {
                console.log(`Raising on table ${tableId} with action index ${actionIndex} and amount ${amount}`);
                
                // Make API call to raise 
                const response = await axios.post(`${PROXY_URL}/table/${tableId}/raise`, {
                    tableId,
                    privateKey,
                    actionIndex,
                    amount
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

    return { raiseHand, isRaising, error };
}
