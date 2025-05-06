import { useState } from "react";
import axios from "axios";
import { PROXY_URL } from "../../config/constants";
import { STORAGE_PRIVATE_KEY, STORAGE_PUBLIC_KEY } from "../useUserWallet";
import { ethers } from "ethers";

interface UseNewCommandProps {
  gameContractAddress: string;
}

interface CreateGameResult {
  success: boolean;
  gameAddress?: string;
  error?: string;
}

const useNewCommand = ({ gameContractAddress }: UseNewCommandProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameAddress, setGameAddress] = useState<string | null>(null);

  const createNewGame = async (seed?: string): Promise<CreateGameResult> => {
    setIsCreating(true);
    setError(null);
    
    try {
      // Get wallet information
      const privateKey = localStorage.getItem(STORAGE_PRIVATE_KEY);
      const publicKey = localStorage.getItem(STORAGE_PUBLIC_KEY);
      
      if (!privateKey || !publicKey) {
        throw new Error("No wallet found. Please create a wallet first.");
      }

      // Create a wallet instance for signing
      const wallet = new ethers.Wallet(privateKey);
      
      // Create signature for the request (this is a simplified example)
      const timestamp = Date.now().toString();
      
      // TEMPORARY FIX: Hardcode the game contract address
      // This overrides any address passed in through props
      const hardcodedGameAddress = "0x22dfa2150160484310c5163f280f49e23b8fd34326";
      console.log("NOTE: Using hardcoded game address:", hardcodedGameAddress);
      
      const messageToSign = `create_game:${hardcodedGameAddress}:${timestamp}`;
      const signature = await wallet.signMessage(messageToSign);

      // Make the API call to create a new game
      const response = await axios.post(`${PROXY_URL}/create_new_game`, {
        address: hardcodedGameAddress, // Use hardcoded address instead of gameContractAddress
        seed,
        signature,
        publicKey
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      // Extract the game address from the response
      // This assumes that the NEW command returns a transaction with the new game address
      const newGameAddress = response.data.result?.data?.to || hardcodedGameAddress;
      
      setGameAddress(newGameAddress);
      return {
        success: true,
        gameAddress: newGameAddress
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.details || err.message || "Failed to create game";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createNewGame,
    isCreating,
    error,
    gameAddress
  };
};

export default useNewCommand;
