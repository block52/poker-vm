import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { STORAGE_PRIVATE_KEY } from "./useUserWallet";

interface UseContractOptions {
    rpcUrl: string;
    contractAddress: string;
    abi: any[];
}

export const useContract = ({ rpcUrl, contractAddress, abi }: UseContractOptions) => {
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initializeContract = async () => {
            try {
                // Retrieve private key from localStorage
                const privateKey = localStorage.getItem(STORAGE_PRIVATE_KEY);
                if (!privateKey) {
                    throw new Error("Private key not found in localStorage");
                }

                // Set up provider and wallet
                const provider = new ethers.JsonRpcProvider(rpcUrl);
                const wallet = new ethers.Wallet(privateKey, provider);

                // Create contract instance
                const contractInstance = new ethers.Contract(contractAddress, abi, wallet);
                setContract(contractInstance);
            } catch (err) {
                setError((err as Error).message);
            }
        };

        initializeContract();
        
        // Cleanup function
        return () => {
            setContract(null);
        };
    }, [rpcUrl, contractAddress, abi]);

    const callContractFunction = useCallback(
        async (functionName: string, ...args: any[]) => {
            if (!contract) {
                throw new Error("Contract is not initialized");
            }

            try {
                const tx = await contract[functionName](...args);
                console.log("Transaction Hash:", tx.hash);

                // Wait for transaction confirmation
                const receipt = await tx.wait();
                console.log("Transaction Confirmed:", receipt);
                return receipt;
            } catch (err) {
                setError((err as Error).message);
                throw err;
            }
        },
        [contract]
    );

    return { contract, callContractFunction, error };
};