import { ethers } from "ethers";
import axios from "axios";
import useSWRMutation from "swr/mutation";
import { PROXY_URL } from "../config/constants";

interface PostBigBlindOptions {
  userAddress: string | null;
  privateKey: string | null;
  publicKey: string | null;
  nonce?: string | number;
  actionIndex?: number | null;
  bigBlindAmount?: string; // Optional amount override
}

async function postBigBlindFetcher(
  url: string,
  { arg }: { arg: PostBigBlindOptions }
) {
  const { userAddress, privateKey, publicKey, nonce = Date.now().toString(), actionIndex, bigBlindAmount } = arg;
  
  console.log("🔵 Post big blind attempt for:", url);
  console.log("🔵 Using action index:", actionIndex, typeof actionIndex);
  
  if (!userAddress || !privateKey) {
    console.error("🔵 Missing address or private key");
    throw new Error("Missing user address or private key");
  }

  // Ensure address is lowercase to avoid case-sensitivity issues
  const normalizedAddress = userAddress.toLowerCase();
  console.log("🔵 Using normalized address:", normalizedAddress);
  
  // Create a wallet to sign the message
  const wallet = new ethers.Wallet(privateKey);
  
  // Extract tableId correctly - grab the last segment of the URL
  const urlParts = url.split("/");
  const tableId = urlParts[urlParts.length - 2]; // Get the table ID part, not "post_big_blind"
  console.log("🔵 Extracted table ID:", tableId);
  
  // Create message to sign in format that matches the action pattern
  // Format: "post-big-blind" + amount + tableId + timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const amount = bigBlindAmount || "200000000000000000"; // Default to 0.2 ETH if not provided
  const messageToSign = `post-big-blind${amount}${tableId}${timestamp}`;
  console.log("🔵 Message to sign:", messageToSign);
  
  // Sign the message
  const signature = await wallet.signMessage(messageToSign);
  console.log("🔵 Signature created");

  // Prepare request data that matches the proxy's expected format for PERFORM_ACTION
  const requestData = {
    userAddress: normalizedAddress, // Use the normalized (lowercase) address
    signature,
    publicKey: (publicKey || userAddress).toLowerCase(), // Also normalize publicKey
    action: "post-big-blind", // Explicitly specify the action
    amount, // Big blind amount
    bigBlindAmount: amount, // Include as both for flexibility in the server
    nonce: nonce,
    timestamp,
    index: actionIndex !== undefined && actionIndex !== null ? actionIndex : 0 // Check explicitly for undefined/null
  };

  console.log("🔵 Sending post big blind request:", requestData);
  
  try {
    // Send the request to the proxy server with appropriate headers
    const response = await axios.post(url, requestData, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    console.log("🔵 Post big blind response:", response.data);
    return response.data;
  } catch (error) {
    console.error("🔵 Post big blind error:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("🔵 Response data:", error.response.data);
    }
    throw error;
  }
}

export function useTablePostBigBlind(tableId: string | undefined) {
  const { trigger, isMutating, error, data } = useSWRMutation(
    tableId ? `${PROXY_URL}/table/${tableId}/post_big_blind` : null,
    postBigBlindFetcher
  );

  // Add better error handling
  if (error) {
    console.error("Post big blind hook error:", error instanceof Error ? error.message : String(error));
  }

  // Return post big blind handler that accepts action index
  return {
    postBigBlind: tableId ? (options: Omit<PostBigBlindOptions, "actionIndex"> & { actionIndex?: number | null }) => 
      trigger(options) : null,
    isPostingBigBlind: isMutating,
    error,
    data
  };
} 