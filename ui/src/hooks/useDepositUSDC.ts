import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { abi } from '../abis/contractABI';
import { FunctionName } from './types';
import { useMemo } from 'react';

const useDepositUSDC = () => {
  const BRIDGE_ADDRESS = import.meta.env.VITE_BRIDGE_ADDRESS || "";

  const {
    data: hash,
    writeContract,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  async function submit(amount: bigint) {

    console.log('Transaction starting...');
    try {
      const tx = await writeContract({
        address: BRIDGE_ADDRESS as `0x${string}`,
        abi,
        functionName: FunctionName.Deposit,
        args: [amount],
      });
      console.log('Transaction successful! Hash:', tx);
    } catch (err) {
      console.error('Transaction failed:', err);
    }
  }
  return useMemo(
    () => ({
      submit,
      isDepositPending: isConfirming,
      isDepositConfirmed: isConfirmed,
      hash,
      error,
    }),
    [submit, isConfirming, isConfirmed, hash, error]
  )
};

export default useDepositUSDC;