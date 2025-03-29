import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { abi } from "../abis/contractABI";
import { FunctionName } from "../types";
import { useMemo } from "react";
import { CONTRACT_ADDRESSES } from "../constants";

const useDepositUSDC = () => {
    const BRIDGE_ADDRESS = CONTRACT_ADDRESSES.bridgeAddress;

    const { data: hash, writeContract, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash
    });

    const deposit = async (amount: bigint, receiver: string, token: string): Promise<void> => {
        console.log("Transaction starting...");
        try {
            const tx = await writeContract({
                address: BRIDGE_ADDRESS as `0x${string}`,
                abi,
                functionName: FunctionName.Deposit,
                args: [amount, receiver, token]
            });

            console.log("Transaction successful! Hash:", tx);
            return tx;
        } catch (err) {
            console.error("Transaction failed:", err);
        }
    };

    return useMemo(
        () => ({
            deposit,
            isDepositPending: isConfirming,
            isDepositConfirmed: isConfirmed,
            isPending,
            hash,
            depositError: error
        }),
        [deposit, isConfirming, isPending, isConfirmed, hash, error]
    );
};

export default useDepositUSDC;
