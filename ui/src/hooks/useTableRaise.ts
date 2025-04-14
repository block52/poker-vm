import { ethers } from "ethers";
import axios from "axios";
import useSWRMutation from "swr/mutation";
import { PROXY_URL } from "../config/constants";

interface RaiseOptions {
  userAddress: string | null;
  privateKey: string | null;
  publicKey: string | null;
  amount: string;
  nonce?: string | number;
  actionIndex?: number | null;
}

async function raiseFetcher(
  url: string,
  { arg }: { arg: RaiseOptions }
) {
  const { userAddress, privateKey, publicKey, amount, nonce = Date.now().toString(), actionIndex } = arg;
  
  console.log("🟢 Raise attempt for:", url);
  console.log("🟢 Using action index:", actionIndex, typeof actionIndex);
  console.log("🟢 Raise amount:", amount);
  
  if (!userAddress || !privateKey) {
    console.error("🟢 Missing address or private key");
    throw new Error("Missing user address or private key");
  }

  // Ensure address is lowercase to avoid case-sensitivity issues
  const normalizedAddress = userAddress.toLowerCase();
  console.log("🟢 Using normalized address:", normalizedAddress);
  
  // Create a wallet to sign the message
  const wallet = new ethers.Wallet(privateKey);
  
  // Extract tableId correctly - grab the last segment of the URL
  const urlParts = url.split("/");
  const tableId = urlParts[urlParts.length - 2]; // Get the table ID part, not "raise"
  console.log("🟢 Extracted table ID:", tableId);
  
  // Create message to sign in format that matches the action pattern
  // Format: "raise" + amount + tableId + timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const messageToSign = `raise${amount}${tableId}${timestamp}`;
  console.log("🟢 Message to sign:", messageToSign);
  
  // Sign the message
  const signature = await wallet.signMessage(messageToSign);
  console.log("🟢 Signature created");

  // Prepare request data that matches the proxy's expected format for PERFORM_ACTION
  const requestData = {
    userAddress: normalizedAddress, // Use the normalized (lowercase) address
    signature,
    publicKey: (publicKey || userAddress).toLowerCase(), // Also normalize publicKey
    action: "raise", // Explicitly specify the action
    amount, // Raise amount (required)
    nonce: nonce,
    timestamp,
    index: actionIndex !== undefined && actionIndex !== null ? actionIndex : 0 // Check explicitly for undefined/null
  };

  console.log("🟢 Sending raise request:", requestData);
  
  try {
    // Send the request to the proxy server with appropriate headers
    const response = await axios.post(url, requestData, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    console.log("🟢 Raise response:", response.data);
    return response.data;
  } catch (error) {
    console.error("🟢 Raise error:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("🟢 Response data:", error.response.data);
    }
    throw error;
  }
}

export function useTableRaise(tableId: string | undefined) {
  const { trigger, isMutating, error, data } = useSWRMutation(
    tableId ? `${PROXY_URL}/table/${tableId}/raise` : null,
    raiseFetcher
  );

  // Add better error handling
  if (error) {
    console.error("Raise hook error:", error instanceof Error ? error.message : String(error));
  }

  // Return raise handler that accepts action index
  return {
    raiseHand: tableId ? (options: RaiseOptions) => 
      trigger(options) : null,
    isRaising: isMutating,
    error,
    data
  };
} 