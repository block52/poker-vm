import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { abi } from "../../abis/contractABI";
import useUserWalletConnect from "./useUserWalletConnect";
import { FunctionName } from "../../types";
import { useCallback, useMemo } from "react";
import { CONTRACT_ADDRESSES } from "../../constants";

const useWithdraw = () => {
  const BRIDGE_ADDRESS = CONTRACT_ADDRESSES.bridgeAddress;
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { address: userAddress } = useUserWalletConnect();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash
  });

  const withdraw = useCallback(async (
    nonce: string, 
    receiver: string, 
    amount: bigint, 
    signature: string
  ): Promise<void> => {
    if (!userAddress) {
      console.error("User wallet is not connected");
      return;
    }

    if (!nonce || !receiver || amount <= 0n || !signature) {
      console.error("Invalid parameters for withdrawal");
      return;
    }

    try {
      writeContract({
        address: BRIDGE_ADDRESS as `0x${string}`,
        abi: abi,
        functionName: FunctionName.Withdraw,
        args: [
          nonce as `0x${string}`, 
          receiver as `0x${string}`, 
          amount, 
          signature as `0x${string}`
        ]
      });
    } catch (err) {
      console.error("Withdrawal failed:", err);
    }
  }, [userAddress, writeContract, BRIDGE_ADDRESS]);

  return useMemo(
    () => ({
      withdraw,
      hash,
      isLoading: isPending,
      isWithdrawPending: isConfirming,
      isWithdrawConfirmed: isConfirmed,
      withdrawError: error
    }),
    [withdraw, hash, isPending, isConfirming, isConfirmed, error]
  );
};

export default useWithdraw;