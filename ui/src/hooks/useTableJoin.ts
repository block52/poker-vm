// ui/src/hooks/useTableJoin.ts
import { ethers } from "ethers";
import axios from "axios";
import useSWRMutation from "swr/mutation";
import { PROXY_URL } from "../config/constants";

interface JoinTableOptions {
  buyInAmount: string;
  userAddress: string | null;
  privateKey: string | null;
  publicKey: string | null;
  nonce?: string | number;
}

async function joinTableFetcher(
  url: string,
  { arg }: { arg: JoinTableOptions }
) {
  const { buyInAmount, userAddress, privateKey, publicKey, nonce = Date.now().toString() } = arg;
  
  if (!userAddress || !privateKey) {
    throw new Error("Missing user address or private key");
  }

  // Create a wallet to sign the message
  const wallet = new ethers.Wallet(privateKey);
  
  // Create message to sign in format that matches the action pattern
  // Format: "join" + amount + tableId + timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const messageToSign = `join${buyInAmount}${url.split("/").pop()}${timestamp}`;

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
  const response = await axios.post(url, requestData);
  return response.data;
}

export function useTableJoin(tableId: string | undefined) {
  const { trigger, isMutating, error, data } = useSWRMutation(
    tableId ? `${PROXY_URL}/table/${tableId}/join` : null,
    joinTableFetcher
  );

  return {
    joinTable: tableId ? trigger : null,
    isJoining: isMutating,
    error,
    data
  };
}