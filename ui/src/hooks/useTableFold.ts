import { ethers } from "ethers";
import axios from "axios";
import useSWRMutation from "swr/mutation";
import { PROXY_URL } from "../config/constants";
import { PlayerActionType } from "@bitcoinbrisbane/block52";

interface FoldOptions {
  userAddress: string | null;
  privateKey: string | null;
  publicKey: string | null;
  nonce?: string | number;
  actionIndex?: number | null;
}

async function foldFetcher(
  url: string,
  { arg }: { arg: FoldOptions }
) {
  const { userAddress, privateKey, publicKey, nonce = Date.now().toString(), actionIndex } = arg;
  
  console.log("🔴 Fold attempt for:", url);
  console.log("🔴 Using action index:", actionIndex);
  
  if (!userAddress || !privateKey) {
    console.error("🔴 Missing address or private key");
    throw new Error("Missing user address or private key");
  }

  // Ensure address is lowercase to avoid case-sensitivity issues
  const normalizedAddress = userAddress.toLowerCase();
  console.log("🔴 Using normalized address:", normalizedAddress);
  
  // Create a wallet to sign the message
  const wallet = new ethers.Wallet(privateKey);
  
  // Extract tableId correctly - grab the last segment of the URL
  const urlParts = url.split("/");
  const tableId = urlParts[urlParts.length - 2]; // Get the table ID part, not "fold"
  console.log("🔴 Extracted table ID:", tableId);
  
  // Create message to sign in format that matches the action pattern
  // Format: "fold" + "0" + tableId + timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const messageToSign = `fold0${tableId}${timestamp}`;
  console.log("🔴 Message to sign:", messageToSign);
  
  // Sign the message
  const signature = await wallet.signMessage(messageToSign);
  console.log("🔴 Signature created");

  // Prepare request data that matches the proxy's expected format for PERFORM_ACTION
  const requestData = {
    userAddress: normalizedAddress, // Use the normalized (lowercase) address
    signature,
    publicKey: (publicKey || userAddress).toLowerCase(), // Also normalize publicKey
    action: PlayerActionType.FOLD, // Explicitly specify the action
    amount: "0", // Fold has no amount, but explicitly set to 0
    nonce: nonce || timestamp,
    timestamp,
    index: actionIndex !== undefined && actionIndex !== null ? actionIndex : 1 // Check explicitly for undefined/null
  };

  console.log("🔴 Sending fold request:", requestData);
  
  try {
    // Send the request to the proxy server with appropriate headers
    const response = await axios.post(url, requestData, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    console.log("🔴 Fold response:", response.data);
    return response.data;
  } catch (error) {
    console.error("🔴 Fold error:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("🔴 Response data:", error.response.data);
    }
    throw error;
  }
}

export function useTableFold(tableId: string | undefined) {
  const { trigger, isMutating, error, data } = useSWRMutation(
    tableId ? `${PROXY_URL}/table/${tableId}/fold` : null,
    foldFetcher
  );

  // Add better error handling
  if (error) {
    console.error("Fold hook error:", error instanceof Error ? error.message : String(error));
  }

  // Return fold handler that accepts action index
  const result = {
    foldHand: tableId ? (options: Omit<FoldOptions, "actionIndex"> & { actionIndex?: number | null }) => 
      trigger(options) : null,
    isFolding: isMutating,
    error,
    data
  };

  console.log("[useTableFold] Returns:", {
    hasFoldFunction: !!result.foldHand,
    isFolding: result.isFolding,
    hasError: !!result.error,
    hasData: !!result.data,
    tableId
  });

  return result;
}