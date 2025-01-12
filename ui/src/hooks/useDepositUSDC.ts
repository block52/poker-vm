import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { abi } from "../abis/contractABI";
import { FunctionName } from "../types";
import { useMemo } from "react";

const useDepositUSDC = () => {
    const BRIDGE_ADDRESS = "0xBf1e380f3D1AE31854764081C488EaDA9F4CB195";

    const { data: hash, writeContract, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash
    });

    async function submit(amount: bigint, receiver: string, token: string) {
        console.log("Transaction starting...");
        try {
            const tx = await writeContract({
                address: BRIDGE_ADDRESS as `0x${string}`,
                abi,
                functionName: FunctionName.Deposit,
                args: [amount, receiver, token]
            });
            console.log("Transaction successful! Hash:", tx);
        } catch (err) {
            console.error("Transaction failed:", err);
        }
    }
    return useMemo(
        () => ({
            submit,
            isDepositPending: isConfirming,
            isDepositConfirmed: isConfirmed,
            isPending,
            hash,
            depositError: error
        }),
        [submit, isConfirming, isPending, isConfirmed, hash, error]
    );
};

export default useDepositUSDC;
