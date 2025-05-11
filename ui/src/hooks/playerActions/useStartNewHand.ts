import { ethers } from "ethers";
import axios from "axios";
import useSWRMutation from "swr/mutation";
import { PROXY_URL } from "../../config/constants";

interface StartNewHandOptions {
    userAddress: string | null;
    privateKey: string | null;
    publicKey: string | null;
    nonce?: string | number;
    seed?: string;
}

async function startNewHandFetcher(url: string, { arg }: { arg: StartNewHandOptions }) {
    const { userAddress, privateKey, publicKey, nonce = Date.now().toString(), seed = Math.random().toString(36).substring(2, 15) } = arg;

    console.log("🔄 Start new hand attempt for:", url);
    console.log("🔄 Using nonce:", nonce);

    if (!userAddress || !privateKey) {
        console.error("🔄 Missing address or private key");
        throw new Error("Missing user address or private key");
    }

    // Ensure address is lowercase to avoid case-sensitivity issues
    const normalizedAddress = userAddress.toLowerCase();
    console.log("🔄 Using normalized address:", normalizedAddress);

    // Create a wallet to sign the message
    const wallet = new ethers.Wallet(privateKey);

    // Extract tableId correctly - grab the last segment of the URL
    const urlParts = url.split("/");
    const tableId = urlParts[urlParts.length - 1]; // Get the table ID from the URL
    console.log("🔄 Table ID for new hand:", tableId);

    // Create message to sign in format: new_hand + tableId + timestamp + nonce
    const timestamp = Math.floor(Date.now() / 1000);
    const messageToSign = `new_hand${tableId}${timestamp}${nonce}`;
    console.log("🔄 Message to sign:", messageToSign);

    // Sign the message
    const signature = await wallet.signMessage(messageToSign);
    console.log("🔄 Signature created");

    // Prepare request data for the new hand endpoint
    const requestData = {
        userAddress: normalizedAddress,
        signature,
        publicKey: (publicKey || userAddress).toLowerCase(),
        tableId: tableId,
        nonce,
        timestamp,
        seed: seed
    };

    console.log("🔄 Sending new hand request:", requestData);

    try {
        // Send the request to the proxy server
        const response = await axios.post(url, requestData, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        console.log("🔄 New hand response:", response.data);
        return response.data;
    } catch (error) {
        console.error("🔄 New hand error:", error);
        if (axios.isAxiosError(error) && error.response) {
            console.error("🔄 Response data:", error.response.data);
        }
        throw error;
    }
}

export function useStartNewHand(tableId: string | undefined) {
    const { trigger, isMutating, error, data } = useSWRMutation(tableId ? `${PROXY_URL}/create_new_hand/${tableId}` : null, startNewHandFetcher);

    // Add better error handling
    if (error) {
        console.error("New hand hook error:", error instanceof Error ? error.message : String(error));
    }

    // Return start new hand handler
    const result = {
        startNewHand: tableId
            ? (options: StartNewHandOptions) =>
                  trigger({
                      ...options
                  })
            : null,
        isStartingNewHand: isMutating,
        error,
        data
    };

    console.log("[useStartNewHand] Returns:", {
        hasStartNewHandFunction: !!result.startNewHand,
        isStartingNewHand: result.isStartingNewHand,
        hasError: !!result.error,
        hasData: !!result.data,
        tableId
    });

    return result;
}
