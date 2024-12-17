import { useReadContract } from 'wagmi';
import useUserWalletConnect from './useUserWalletConnect';
import { erc20abi } from '../abis/erc20ABI';
import { FunctionName } from './types';
import { useMemo } from 'react';

const useWalletBalance = () => {
  const { address } = useUserWalletConnect();
  const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || ""; 

  const wagmiContractConfig = {
    address: USDC_ADDRESS as `0x${string}`,
    abi: erc20abi, 
    chainId: 8453,
  };

  const {
    data: balance,
    isLoading,
    isError,
  } = useReadContract({
    ...wagmiContractConfig,
    functionName: FunctionName.Balance,
    args: [address as `0x${string}`], 
  });

  return useMemo(
    () => ({
        balance,
        isLoading,
        isError,
    }),
    [balance, isLoading, isError]
  )
};

export default useWalletBalance;
