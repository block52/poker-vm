import { ethers } from "ethers";
import axios from "axios";
import useSWRMutation from "swr/mutation";
import { PROXY_URL } from "../../config/constants";
import { NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { DealOptions } from "./types";

async function dealFetcher(url: string, { arg }: { arg: DealOptions }) {
    const { userAddress, privateKey, publicKey, nonce = Date.now().toString(), actionIndex } = arg;

    console.log("🃏 Deal cards attempt for:", url);
    console.log("🃏 Using action index:", actionIndex, typeof actionIndex);

    if (!userAddress || !privateKey) {
        console.error("🃏 Missing address or private key");
        throw new Error("Missing user address or private key");
    }

    // Ensure address is lowercase to avoid case-sensitivity issues
    const normalizedAddress = userAddress.toLowerCase();
    console.log("🃏 Using normalized address:", normalizedAddress);

    // Create a wallet to sign the message
    const wallet = new ethers.Wallet(privateKey);

    // Extract tableId correctly - grab the last segment of the URL
    const urlParts = url.split("/");
    const tableId = urlParts[urlParts.length - 2]; // Get the table ID part, not "deal"
    console.log("🃏 Extracted table ID:", tableId);

    // Create message to sign in format that matches the action pattern
    // Format: "deal" + tableId + timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    const messageToSign = `deal${tableId}${timestamp}`;
    console.log("🃏 Message to sign:", messageToSign);

    // Sign the message
    const signature = await wallet.signMessage(messageToSign);
    console.log("🃏 Signature created");

    // Prepare request data that matches the proxy's expected format for PERFORM_ACTION
    const requestData = {
        userAddress: normalizedAddress, // Use the normalized (lowercase) address
        signature,
        publicKey: (publicKey || userAddress).toLowerCase(), // Also normalize publicKey
        action: NonPlayerActionType.DEAL, // Explicitly specify the action
        amount: "0", // Deal doesn't require an amount
        nonce: nonce,
        timestamp,
        index: actionIndex !== undefined && actionIndex !== null ? actionIndex : 0 // Check explicitly for undefined/null
    };

    console.log("🃏 Sending deal request:", requestData);

    try {
        // Send the request to the proxy server with appropriate headers
        const response = await axios.post(url, requestData, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        console.log("🃏 Deal response:", response.data);
        return response.data;
    } catch (error) {
        console.error("🃏 Deal error:", error);
        if (axios.isAxiosError(error) && error.response) {
            console.error("🃏 Response data:", error.response.data);
        }
        throw error;
    }
}

export function useTableDeal(tableId: string | undefined) {
    const { trigger, isMutating, error, data } = useSWRMutation(tableId ? `${PROXY_URL}/table/${tableId}/deal` : null, dealFetcher);

    // Add better error handling
    if (error) {
        console.error("Deal hook error:", error instanceof Error ? error.message : String(error));
    }

    // Return deal handler that accepts action index
    const result = {
        dealCards: tableId
            ? (options: Omit<DealOptions, "actionIndex"> & { actionIndex?: number | null }) =>
                  trigger({
                      ...options
                  })
            : null,
        isDealing: isMutating,
        error,
        data
    };

    return result;
}
