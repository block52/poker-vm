import { ethers } from "ethers";
import axios from "axios";
import useSWRMutation from "swr/mutation";
import { PROXY_URL } from "../config/constants";

interface FoldOptions {
  userAddress: string | null;
  privateKey: string | null;
  publicKey: string | null;
  nonce?: string | number;
}

async function foldFetcher(
  url: string,
  { arg }: { arg: FoldOptions }
) {
  const { userAddress, privateKey, publicKey, nonce = Date.now().toString() } = arg;
  
  if (!userAddress || !privateKey) {
    throw new Error("Missing user address or private key");
  }

  // Create a wallet to sign the message
  const wallet = new ethers.Wallet(privateKey);
  
  // Create message to sign in format that matches the action pattern
  // Format: "fold" + "0" + tableId + timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const messageToSign = `fold0${url.split("/").pop()}${timestamp}`;
  
  // Sign the message
  const signature = await wallet.signMessage(messageToSign);

  // Prepare request data that matches the proxy's expected format for PERFORM_ACTION
  const requestData = {
    userAddress,
    signature,
    publicKey: publicKey || userAddress,
    nonce: nonce || timestamp,
    timestamp
  };

  // Send the request to the proxy server
  const response = await axios.post(url, requestData);
  return response.data;
}

export function useTableFold(tableId: string | undefined) {
  const { trigger, isMutating, error, data } = useSWRMutation(
    tableId ? `${PROXY_URL}/table/${tableId}/fold` : null,
    foldFetcher
  );

  return {
    foldHand: tableId ? trigger : null,
    isFolding: isMutating,
    error,
    data
  };
}