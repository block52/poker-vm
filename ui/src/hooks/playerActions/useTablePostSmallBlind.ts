import useSWRMutation from "swr/mutation";
import { useGameOptions, DEFAULT_SMALL_BLIND } from "../useGameOptions";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";

interface PostSmallBlindOptions {
    privateKey: string | null;
    nonce?: string | number;
    actionIndex?: number | null;
    smallBlindAmount?: string; // Optional amount override
}

export function useTablePostSmallBlind(tableId: string | undefined) {
    // Get the game options to access the configured small blind amount
    const { gameOptions } = useGameOptions(tableId);
    // Get the Node RPC client
    const { client } = useNodeRpc();

    // Create a fetcher that has access to the client
    const postSmallBlindFetcher = async (_url: string, { arg }: { arg: PostSmallBlindOptions }) => {
        const { privateKey, nonce = Date.now().toString(), actionIndex, smallBlindAmount } = arg;

        console.log("🔵 Post small blind attempt");
        console.log("🔵 Using action index:", actionIndex, typeof actionIndex);

        if (!privateKey) {
            console.error("🔵 Missing private key");
            throw new Error("Missing private key");
        }

        // ONLY use the address from browser storage - use public key as the storage key
        const storedAddress = localStorage.getItem("user_eth_public_key");
        
        // If we don't have a stored address, fail immediately
        if (!storedAddress) {
            console.error("🔵 No user public key found in browser storage");
            throw new Error("No user public key available in browser storage for small blind action");
        }

        // Ensure address is lowercase to avoid case-sensitivity issues
        const normalizedAddress = storedAddress.toLowerCase();
        console.log("🔵 Using ONLY browser-stored public key:", normalizedAddress);

        // Format: "post-small-blind" + amount + tableId + timestamp
        const timestamp = Math.floor(Date.now() / 1000);
        const amount = smallBlindAmount || DEFAULT_SMALL_BLIND; // Use the default from useGameOptions
        
        try {
            // Check if the client is available
            if (!client) {
                throw new Error("Node RPC client not available");
            }

            if (!tableId) {
                throw new Error("Table ID is required");
            }

            console.log("🔵 Calling playerAction with params:", {
                tableId,
                action: PlayerActionType.SMALL_BLIND,
                amount,
                nonce: typeof nonce === "number" ? nonce : parseInt(nonce.toString()),
                data: {
                    index: actionIndex !== undefined && actionIndex !== null ? actionIndex : 0,
                    timestamp,
                }
            });

            // Call playerAction method on the client
            const response = await client.playerAction(
                tableId,
                PlayerActionType.SMALL_BLIND,
                amount,
                typeof nonce === "number" ? nonce : parseInt(nonce.toString()),
                JSON.stringify({
                    index: actionIndex !== undefined && actionIndex !== null ? actionIndex : 0,
                    timestamp,
                })
            );

            console.log("🔵 Post small blind response:", response);
            return response;
        } catch (error) {
            console.error("🔵 Post small blind error:", error);
            throw error;
        }
    };

    const { trigger, isMutating, error, data } = useSWRMutation(
        tableId ? `small_blind_${tableId}` : null, 
        postSmallBlindFetcher
    );

    // Add better error handling
    if (error) {
        console.error("Post small blind hook error:", error instanceof Error ? error.message : String(error));
    }

    // Return post small blind handler that accepts action index
    const result = {
        postSmallBlind: tableId
            ? (options: Omit<PostSmallBlindOptions, "actionIndex"> & { actionIndex?: number | null }) =>
                  trigger({
                      ...options,
                      // Use the provided amount or the game options amount, falling back to default
                      smallBlindAmount: options.smallBlindAmount || gameOptions.smallBlind.toString() || DEFAULT_SMALL_BLIND
                  })
            : null,
        isPostingSmallBlind: isMutating,
        error,
        data
    };

    console.log("[useTablePostSmallBlind] Returns:", {
        hasPostSmallBlindFunction: !!result.postSmallBlind,
        isPostingSmallBlind: result.isPostingSmallBlind,
        hasError: !!result.error,
        hasData: !!result.data,
        smallBlindAmount: gameOptions.smallBlind.toString(),
        tableId,
        hasClient: !!client,
        addressFromStorage: localStorage.getItem("user_eth_public_key")
    });

    return result;
}
