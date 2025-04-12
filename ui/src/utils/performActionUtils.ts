import axios from "axios";
import { ethers } from "ethers";
import { PROXY_URL } from "../config/constants";
import { PlayerActionType, NonPlayerActionType } from "@bitcoinbrisbane/block52";

interface JoinTableOptions {
  tableId: string;
  buyInAmount: string;
  userAddress: string | null;
  privateKey: string | null;
  publicKey: string | null;
  nonce?: string | number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

/**
 * Handles joining a table by signing the message client-side and sending to proxy
 * @param options Configuration options for joining a table
 * @returns Response data from the join operation
 */
export const playerJoin = async ({
  tableId,
  buyInAmount,
  userAddress,
  privateKey,
  publicKey,
  nonce = Date.now().toString(),
  onSuccess,
  onError
}: JoinTableOptions): Promise<any> => {
  if (!userAddress || !privateKey) {
    const error = new Error("Missing user address or private key");
    if (onError) onError(error);
    throw error;
  }

  try {
    // Create a wallet to sign the message
    const wallet = new ethers.Wallet(privateKey);
    
    // Create message to sign in format that matches the action pattern
    // Format: "join" + amount + tableId + timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    const messageToSign = `join${buyInAmount}${tableId}${timestamp}`;
    
    // Sign the message
    const signature = await wallet.signMessage(messageToSign);

    // Prepare request data that matches the proxy's expected format for PERFORM_ACTION
    const requestData = {
      userAddress,
      buyInAmount,
      signature,
      publicKey: publicKey || userAddress,
      nonce: nonce || timestamp,
      timestamp
    };

    // Send the request to the proxy server
    const response = await axios.post(`${PROXY_URL}/table/${tableId}/join`, requestData);
    
    if (response.data?.result?.data && onSuccess) {
      onSuccess(response.data.result.data);
    }
    
    return response.data;
  } catch (error) {
    console.error("Error joining table:", error);
    if (onError) onError(error);
    throw error;
  }
};

/**
 * Performs a game action by signing the message client-side and sending to proxy
 * Compatible with IClient.performAction signature but adapted for browser
 * @param gameAddress Table address
 * @param action Action type (fold, check, call, etc)
 * @param amount Amount for bet/raise actions
 * @param nonce Optional nonce value
 * @returns Response data
 */
export const performAction = async (
  gameAddress: string,
  action: PlayerActionType,
  amount?: string, 
  nonce?: number
): Promise<any> => {
  try {
    // Get wallet info from browser storage
    const publicKey = localStorage.getItem("user_eth_public_key");
    const privateKey = localStorage.getItem("user_eth_private_key");
    
    if (!publicKey || !privateKey) {
      throw new Error("Wallet keys not available");
    }
    
    // Create wallet for signing
    const wallet = new ethers.Wallet(privateKey);
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create the message to sign using the expected format
    const messageToSign = `${action}${amount || "0"}${gameAddress}${timestamp}`;
    const signature = await wallet.signMessage(messageToSign);
    
    // Send to proxy server
    const response = await axios.post(`${PROXY_URL}/table/${gameAddress}/perform`, {
      userAddress: publicKey,
      actionType: action,
      amount: amount || "0",
      signature,
      publicKey,
      timestamp,
      nonce: nonce || timestamp
    });
    
    return response.data;
  } catch (error) {
    console.error("Error performing action:", error);
    throw error;
  }
};

/**
 * Handles player leaving a table
 * Compatible with IClient.playerLeave signature but adapted for browser
 * @param gameAddress Table address
 * @param amount The player's stack to withdraw
 * @param nonce Optional nonce
 * @returns Response data
 */
export const playerLeave = async (
  gameAddress: string, 
  amount: bigint,
  nonce?: number
): Promise<any> => {
  try {
    // Get wallet info
    const publicKey = localStorage.getItem("user_eth_public_key");
    const privateKey = localStorage.getItem("user_eth_private_key");
    
    if (!publicKey || !privateKey) {
      throw new Error("Wallet keys not available");
    }
    
    // Create wallet for signing
    const wallet = new ethers.Wallet(privateKey);
    const timestamp = Math.floor(Date.now() / 1000);
    const messageToSign = `leave${amount.toString()}${gameAddress}${timestamp}`;
    const signature = await wallet.signMessage(messageToSign);
    
    // Send leave request to proxy endpoint
    const response = await axios.post(`${PROXY_URL}/table/${gameAddress}/playeraction`, {
      userAddress: publicKey,
      action: "leave",
      amount: amount.toString(),
      signature,
      publicKey,
      timestamp,
      nonce: nonce || timestamp
    });
    
    return response.data;
  } catch (error) {
    console.error("Error leaving table:", error);
    throw error;
  }
};
