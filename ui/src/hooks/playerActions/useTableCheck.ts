import { useCallback, useState } from "react";
import axios from "axios";
import { PROXY_URL } from "../../config/constants";

// Types for the check parameters
interface CheckHandArgs {
    userAddress?: string | null;
    privateKey?: string | null;
    publicKey?: string | null;
    actionIndex: number;
}

// Interface for the hook return type
interface UseTableCheckReturn {
    checkHand: (args: CheckHandArgs) => Promise<any>;
    isChecking: boolean;
    error: Error | null;
}

/**
 * Hook to handle the check action on a poker table
 * @param tableId The ID of the table
 * @returns Object with checkHand function and loading state
 */
export function useTableCheck(tableId?: string): UseTableCheckReturn {
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Function to check on hand
    const checkHand = useCallback(
        async ({ userAddress, privateKey, publicKey, actionIndex }: CheckHandArgs): Promise<any> => {
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

            setIsChecking(true);
            setError(null);

            try {
                console.log(`Checking on table ${tableId} with action index ${actionIndex}`);
                
                // Make API call to check
                const response = await axios.post(`${PROXY_URL}/table/${tableId}/check`, {
                    tableId,
                    privateKey,
                    userAddress,
                    publicKey,
                    actionIndex
                });

                console.log("Check response:", response.data);
                
                setIsChecking(false);
                return response.data;
            } catch (err: any) {
                console.error("Error checking:", err);
                setError(err);
                setIsChecking(false);
                throw err;
            }
        },
        [tableId]
    );

    const result = { checkHand, isChecking, error };

    console.log("[useTableCheck] Returns:", {
        hasCheckFunction: !!result.checkHand,
        isChecking: result.isChecking,
        hasError: !!result.error,
        tableId
    });

    return result;
}
