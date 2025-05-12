import useSWRMutation from "swr/mutation";
import { DEFAULT_BIG_BLIND, useGameOptions } from "../useGameOptions";
import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { useNodeRpc } from "../../context/NodeRpcContext";

interface PostBigBlindOptions {
    privateKey: string | null;
    nonce?: string | number;
    actionIndex?: number | null;
    bigBlindAmount?: string; // Optional amount override
}

export function useTablePostBigBlind(tableId: string | undefined) {
    // Get the game options to access the configured big blind amount
    const { gameOptions } = useGameOptions(tableId);
    // Get the Node RPC client
    const { client } = useNodeRpc();

    // Create a fetcher that has access to the client
    const postBigBlindFetcher = async (_url: string, { arg }: { arg: PostBigBlindOptions }) => {
        const { privateKey, nonce = Date.now().toString(), actionIndex, bigBlindAmount } = arg;

        console.log("🔵 Post big blind attempt");
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
            throw new Error("No user public key available in browser storage for big blind action");
        }

        // Ensure address is lowercase to avoid case-sensitivity issues
        const normalizedAddress = storedAddress.toLowerCase();
        console.log("🔵 Using ONLY browser-stored public key:", normalizedAddress);

        // Format: "post-big-blind" + amount + tableId + timestamp
        const timestamp = Math.floor(Date.now() / 1000);
        const amount = bigBlindAmount || DEFAULT_BIG_BLIND; // Use the default from useGameOptions
        
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
                action: PlayerActionType.BIG_BLIND,
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
                PlayerActionType.BIG_BLIND,
                amount,
                typeof nonce === "number" ? nonce : parseInt(nonce.toString()),
                JSON.stringify({
                    index: actionIndex !== undefined && actionIndex !== null ? actionIndex : 0,
                    timestamp,
                })
            );

            console.log("🔵 Post big blind response:", response);
            return response;
        } catch (error) {
            console.error("🔵 Post big blind error:", error);
            throw error;
        }
    };

    const { trigger, isMutating, error, data } = useSWRMutation(
        tableId ? `big_blind_${tableId}` : null, 
        postBigBlindFetcher
    );

    // Add better error handling
    if (error) {
        console.error("Post big blind hook error:", error instanceof Error ? error.message : String(error));
    }

    // Return post big blind handler that accepts action index
    const result = {
        postBigBlind: tableId
            ? (options: Omit<PostBigBlindOptions, "actionIndex"> & { actionIndex?: number | null }) =>
                  trigger({
                      ...options,
                      // Use the provided amount or the game options amount, falling back to default
                      bigBlindAmount: options.bigBlindAmount || gameOptions.bigBlind.toString() || DEFAULT_BIG_BLIND
                  })
            : null,
        isPostingBigBlind: isMutating,
        error,
        data
    };

    console.log("[useTablePostBigBlind] Returns:", {
        hasPostBigBlindFunction: !!result.postBigBlind,
        isPostingBigBlind: result.isPostingBigBlind,
        hasError: !!result.error,
        hasData: !!result.data,
        bigBlindAmount: gameOptions.bigBlind.toString(),
        tableId,
        hasClient: !!client,
        addressFromStorage: localStorage.getItem("user_eth_public_key")
    });

    return result;
}
