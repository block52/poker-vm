import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { erc20abi } from '../abis/erc20ABI';
import useUserWalletConnect from './useUserWalletConnect';
import { FunctionName } from './types';
import { useMemo } from 'react';

const useApprove = () => {
  const {
    data: hash,
    isPending,
    writeContract,
    error,
  } = useWriteContract();
  const { address: userAddress } = useUserWalletConnect();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const approve = async (
    tokenAddress: string,
    spender: string,
    amount: bigint
  ): Promise<void> => {

    if (!userAddress) {
      console.error('User wallet is not connected');
      return;
    }

    if (!tokenAddress || !spender || amount <= 0n) {
      console.error('Invalid parameters for approval');
      return;
    }

    console.log('Approve transaction starting...');

    try {
      const tx = await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20abi,
        functionName: FunctionName.Approve,
        args: [spender as `0x${string}`, amount],
      });
      console.log(tx)
      return (tx);
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  return useMemo(
    () => ({
      approve,
      hash,
      isPending,
      isApprovePending: isConfirming,
      isApproveConfirmed: isConfirmed,
      error,
    }),
    [approve, isPending, hash, error, error, isConfirmed, isConfirmed]
  )
};

export default useApprove;