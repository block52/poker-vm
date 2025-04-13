import { ethers } from "ethers";
import axios from "axios";
import useSWRMutation from "swr/mutation";
import { PROXY_URL } from "../config/constants";

interface CallOptions {
  userAddress: string | null;
  privateKey: string | null;
  publicKey: string | null;
  nonce?: string | number;
  actionIndex?: number | null;
  amount?: string; // Optional amount (not typically needed for call as it's calculated by the engine)
}

async function callFetcher(
  url: string,
  { arg }: { arg: CallOptions }
) {
  const { userAddress, privateKey, publicKey, nonce = Date.now().toString(), actionIndex, amount } = arg;
  
  console.log("🔵 Call attempt for:", url);
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
  const tableId = urlParts[urlParts.length - 2]; // Get the table ID part, not "call"
  console.log("🔵 Extracted table ID:", tableId);
  
  // Create message to sign in format that matches the action pattern
  // Format: "call" + amount + tableId + timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const callAmount = amount || "0"; // Amount is optional for call as the engine calculates it
  const messageToSign = `call${callAmount}${tableId}${timestamp}`;
  console.log("🔵 Message to sign:", messageToSign);
  
  // Sign the message
  const signature = await wallet.signMessage(messageToSign);
  console.log("🔵 Signature created");

  // Prepare request data that matches the proxy's expected format for PERFORM_ACTION
  const requestData = {
    userAddress: normalizedAddress, // Use the normalized (lowercase) address
    signature,
    publicKey: (publicKey || userAddress).toLowerCase(), // Also normalize publicKey
    action: "call", // Explicitly specify the action
    amount: callAmount, // Include amount even if 0
    nonce: nonce,
    timestamp,
    index: actionIndex !== undefined && actionIndex !== null ? actionIndex : 0 // Check explicitly for undefined/null
  };

  console.log("🔵 Sending call request:", requestData);
  
  try {
    // Send the request to the proxy server with appropriate headers
    const response = await axios.post(url, requestData, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    console.log("🔵 Call response:", response.data);
    return response.data;
  } catch (error) {
    console.error("🔵 Call error:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("🔵 Response data:", error.response.data);
    }
    throw error;
  }
}

export function useTableCall(tableId: string | undefined) {
  const { trigger, isMutating, error, data } = useSWRMutation(
    tableId ? `${PROXY_URL}/table/${tableId}/call` : null,
    callFetcher
  );

  // Add better error handling
  if (error) {
    console.error("Call hook error:", error instanceof Error ? error.message : String(error));
  }

  // Return call handler that accepts action index
  return {
    callHand: tableId ? (options: Omit<CallOptions, "actionIndex"> & { actionIndex?: number | null }) => 
      trigger(options) : null,
    isCalling: isMutating,
    error,
    data
  };
} 