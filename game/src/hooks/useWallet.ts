import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { createWallet, saveWallet, loadWallet, MissingWalletError } from '../wallet';
import { NodeRpcClient } from '@block52/sdk';

export function useWallet() {
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [client, setClient] = useState<NodeRpcClient | null>(null);

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // Try to load an existing wallet
        const loadedWallet: ethers.Wallet = loadWallet();
        setWallet(loadedWallet);
      } catch (error) {
        if (error instanceof MissingWalletError) {
          console.log("Creating new wallet");
          const newWallet = createWallet();
          saveWallet(newWallet);
          setWallet(newWallet);
        } else {
          console.error("Error initializing wallet:", error);
          setWallet(null);
        }
      }
    };

    initializeWallet();
  }, []);

  useEffect(() => {
    if (wallet) {
      const privateKey = wallet.privateKey;
      const url = import.meta.env.VITE_NODE_RPC_URL ?? "http://localhost:3000";
      const client = new NodeRpcClient(url, privateKey);
      console.log(privateKey, url);
      setClient(client);
    }
  }, [wallet]);

  return {
    address: wallet?.address,
    ethereum: wallet,
    b52: client,
  }
}
