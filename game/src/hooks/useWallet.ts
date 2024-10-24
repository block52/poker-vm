import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { createWallet, saveWallet, loadWallet, MissingWalletError } from '../wallet';

export function useWallet() {
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // Try to load an existing wallet
        const loadedWallet: ethers.Wallet = loadWallet();
        setWallet(loadedWallet);
      } catch (error) {
        // Only create a new wallet if it's a MissingWalletError
        if (error instanceof MissingWalletError) {
          const newWallet = createWallet();
          saveWallet(newWallet);
          setWallet(newWallet);
        } else {
          // For other errors, log them and set wallet to null
          console.error("Error initializing wallet:", error);
          setWallet(null);
        }
      }
    };

    initializeWallet();
  }, []);

  return wallet;
}
