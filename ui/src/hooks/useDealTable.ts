import { ethers } from "ethers";
import axios from "axios";
import useSWRMutation from "swr/mutation";
import { PROXY_URL } from "../config/constants";
import { NonPlayerActionType } from "@bitcoinbrisbane/block52";
import { useCallback } from "react";
import { usePlayerDTO } from "./usePlayerDTO";

interface DealTableOptions {
  userAddress: string | null;
  privateKey: string | null;
  publicKey: string | null;
  nonce?: string | number;
  timestamp?: number;
}

async function dealTableFetcher(
  url: string,
  { arg }: { arg: DealTableOptions }
) {
  const { userAddress, privateKey, publicKey, nonce = Date.now().toString(), timestamp = Math.floor(Date.now() / 1000) } = arg;
  
  console.log("🎲 Deal attempt for:", url);
  
  if (!userAddress || !privateKey) {
    console.error("🎲 Missing address or private key");
    throw new Error("Missing user address or private key");
  }

  // Ensure address is lowercase to avoid case-sensitivity issues
  const normalizedAddress = userAddress.toLowerCase();
  console.log("🎲 Using normalized address:", normalizedAddress);
  
  // Create a wallet to sign the message
  const wallet = new ethers.Wallet(privateKey);
  
  // Extract tableId from URL
  const urlParts = url.split("/");
  const tableId = urlParts[urlParts.length - 2]; // Get the table ID part
  console.log("🎲 Extracted table ID:", tableId);
  
  // Create message to sign in format that matches the action pattern
  // Format: "deal" + "0" + tableId + timestamp
  const messageToSign = `deal0${tableId}${timestamp}`;
  console.log("🎲 Message to sign:", messageToSign);
  
  // Sign the message
  const signature = await wallet.signMessage(messageToSign);
  console.log("🎲 Signature created");

  // Create a random data string for the deal action
  const randomData = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  // Prepare request data for the PERFORM_ACTION
  const requestData = {
    userAddress: normalizedAddress,
    actionType: NonPlayerActionType.DEAL,
    signature,
    publicKey: (publicKey || userAddress).toLowerCase(),
    timestamp,
    nonce: nonce || timestamp,
    data: randomData
  };

  console.log("🎲 Sending deal request:", requestData);
  
  try {
    // Send the request to the proxy server
    const response = await axios.post(url, requestData, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    console.log("🎲 Deal response:", response.data);
    return response.data;
  } catch (error) {
    console.error("🎲 Deal error:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("🎲 Response data:", error.response.data);
    }
    throw error;
  }
}

/**
 * Custom hook to handle the deal table action
 * @param tableId The ID of the table
 * @returns Object with deal function and state
 */
export function useDealTable(tableId?: string) {
  const { players } = usePlayerDTO(tableId);
  
  // Use SWR Mutation for the deal action
  const { trigger, isMutating, error, data } = useSWRMutation(
    tableId ? `${PROXY_URL}/table/${tableId}/perform` : null,
    dealTableFetcher
  );

  // Determine if the current user can deal
  const userAddress = localStorage.getItem("user_eth_public_key")?.toLowerCase();
  const userPlayer = players?.find(player => player.address?.toLowerCase() === userAddress);
  const canDeal = !!userPlayer?.legalActions?.some(action => action.action === NonPlayerActionType.DEAL);

  // Wrapper function to deal the table
  const dealTable = useCallback(async () => {
    if (!tableId) {
      console.error("No table ID available");
      return null;
    }
    
    if (!canDeal) {
      console.error("Current user cannot deal");
      return null;
    }
    
    // Get wallet info
    const publicKey = localStorage.getItem("user_eth_public_key");
    const privateKey = localStorage.getItem("user_eth_private_key");
    
    if (!publicKey || !privateKey) {
      console.error("Wallet keys not available");
      return null;
    }
    
    console.log("Dealing cards for table:", tableId);
    return await trigger({
      userAddress: publicKey,
      privateKey,
      publicKey,
    });
  }, [tableId, canDeal, trigger]);

  const result = {
    dealTable,
    canDeal,
    isDealing: isMutating,
    error,
    data
  };

  console.log("[useDealTable] Returns:", {
    canDeal,
    isDealing: isMutating,
    hasError: !!error,
    hasData: !!data,
    tableId
  });

  return result;
} 