import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { erc20abi } from "../../abis/erc20ABI";
import useUserWalletConnect from "./useUserWalletConnect";
import { FunctionName } from "../../types";
import { useCallback, useMemo } from "react";

const useApprove = () => {
    const { data: hash, isPending, writeContract, error } = useWriteContract();
    const { address: userAddress } = useUserWalletConnect();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash
    });

    const approve = useCallback(async (tokenAddress: string, spender: string, amount: bigint): Promise<void> => {
        if (!userAddress) {
            console.error("User wallet is not connected");
            return;
        }

        if (!tokenAddress || !spender || amount <= 0) {
            console.error("Invalid parameters for approval");
            return;
        }


        try {
            const tx = await writeContract({
                address: tokenAddress as `0x${string}`,
                abi: erc20abi,
                functionName: FunctionName.Approve,
                args: [spender as `0x${string}`, amount]
            });
            return tx;
        } catch (err) {
            console.error("Approval failed:", err);
        }
    }, [userAddress, writeContract]);

    return useMemo(
        () => ({
            approve,
            hash,
            isLoading: isPending,
            isApprovePending: isConfirming,
            isApproveConfirmed: isConfirmed,
            approveError: error
        }),
        [approve, hash, isPending, isConfirming, isConfirmed, error]
    );
};

export default useApprove;
