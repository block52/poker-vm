import { useState } from "react";
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { PlayerActionType } from "@bitcoinbrisbane/block52"
import { ethers } from "ethers";

// Define the parameter type for callHand function
interface CallHandParams {
  userAddress: string;
  privateKey: string;
  publicKey: string;
  actionIndex: number;
  amount: string;
}

/**
 * Custom hook to handle calling in a poker game
 * @param tableId The ID of the table where the action will be performed
 * @returns Object containing functions for performing call action
 */
export const useTableCall = (tableId?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Executes a call action on the specified table
   * @param params Parameters needed for the call action
   * @returns Promise resolving to the result of the call action
   */
  const callHand = async (params: CallHandParams) => {
    if (!tableId) {
      console.error("Table ID is required to call");
      setError("Table ID is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Calling with amount:", params.amount);
      
      // Create wallet instance to sign the message
      const wallet = new ethers.Wallet(params.privateKey);
      
      // Create message to sign
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const message = `call:${params.amount}:${tableId}:${timestamp}`;
      
      // Sign the message
      const signature = await wallet.signMessage(message);
      
      // Prepare the request payload
      const payload = {
        userAddress: params.userAddress,
        action: PlayerActionType.CALL,
        amount: params.amount,
        signature,
        publicKey: params.publicKey,
        timestamp,
        index: params.actionIndex,
      };
      
      console.log("Call payload:", payload);
      
      // Make the API call
      const response = await axios.post(`${PROXY_URL}/table/${tableId}/call`, payload);
      
      console.log("Call response:", response.data);
      
      // Return the response data
      return response.data;
    } catch (err: any) {
      console.error("Error calling:", err);
      setError(err.message || "Failed to call");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    callHand,
    isLoading,
    error,
  };
}; 