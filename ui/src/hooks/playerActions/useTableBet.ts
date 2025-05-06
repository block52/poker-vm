import { useState } from "react";
import axios from "axios";
import { PROXY_URL } from "../../config/constants";
import { PlayerActionType } from "@bitcoinbrisbane/block52"
import { ethers } from "ethers";

// Define the parameter type for betHand function
interface BetHandParams {
  userAddress: string;
  privateKey: string;
  publicKey: string;
  actionIndex: number;
  amount: string;
}

/**
 * Custom hook to handle betting in a poker game
 * @param tableId The ID of the table where the action will be performed
 * @returns Object containing functions for performing bet action
 */
export const useTableBet = (tableId?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Executes a bet action on the specified table
   * @param params Parameters needed for the bet action
   * @returns Promise resolving to the result of the bet action
   */
  const betHand = async (params: BetHandParams) => {
    if (!tableId) {
      console.error("Table ID is required to bet");
      setError("Table ID is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Betting with amount:", params.amount);
      
      // Create wallet instance to sign the message
      const wallet = new ethers.Wallet(params.privateKey);
      
      // Create message to sign
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const message = `bet:${params.amount}:${tableId}:${timestamp}`;
      
      // Sign the message
      const signature = await wallet.signMessage(message);
      
      // Prepare the request payload
      const payload = {
        userAddress: params.userAddress,
        action: PlayerActionType.BET,
        amount: params.amount,
        signature,
        publicKey: params.publicKey,
        timestamp,
        index: params.actionIndex,
      };
      
      console.log("Bet payload:", payload);
      
      // Make the API call
      const response = await axios.post(`${PROXY_URL}/table/${tableId}/bet`, payload);
      
      console.log("Bet response:", response.data);
      
      // Return the response data
      return response.data;
    } catch (err: any) {
      console.error("Error betting:", err);
      setError(err.message || "Failed to bet");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    betHand,
    isLoading,
    error,
  };
}; 