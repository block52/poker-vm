import { ethers } from "ethers";
import axios from "axios";
import useSWRMutation from "swr/mutation";
import { PROXY_URL } from "../config/constants";

interface LeaveTableOptions {
  amount: string;
  userAddress: string | null;
  privateKey: string | null;
  publicKey: string | null;
  nonce?: string | number;
}

async function leaveTableFetcher(
  url: string,
  { arg }: { arg: LeaveTableOptions }
) {
  const { amount, userAddress, privateKey, publicKey, nonce = Date.now().toString() } = arg;
  
  if (!userAddress || !privateKey) {
    throw new Error("Missing user address or private key");
  }

  // Create a wallet to sign the message
  const wallet = new ethers.Wallet(privateKey);
  
  // Create message to sign in format that matches the action pattern
  // Format: "leave" + amount + tableId + timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const messageToSign = `leave${amount}${url.split("/").pop()}${timestamp}`;
  
  // Sign the message
  const signature = await wallet.signMessage(messageToSign);

  // Prepare request data that matches the proxy's expected format for PERFORM_ACTION
  const requestData = {
    userAddress,
    amount,
    signature,
    publicKey: publicKey || userAddress,
    nonce: nonce || timestamp,
    timestamp
  };

  // Send the request to the proxy server
  const response = await axios.post(url, requestData);
  return response.data;
}

export function useTableLeave(tableId: string | undefined) {
  const { trigger, isMutating, error, data } = useSWRMutation(
    tableId ? `${PROXY_URL}/table/${tableId}/leave` : null,
    leaveTableFetcher
  );

  return {
    leaveTable: tableId ? trigger : null,
    isLeaving: isMutating,
    error,
    data
  };
}