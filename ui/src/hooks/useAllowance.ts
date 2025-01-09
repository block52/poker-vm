import { useReadContract } from 'wagmi';
import useUserWalletConnect from './useUserWalletConnect';
import { erc20abi } from '../abis/erc20ABI';
import { FunctionName } from './types';

const useAllowance = () => {
  const { address } = useUserWalletConnect();
  const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || "";
  const BRIDGE_ADDRESS = import.meta.env.VITE_BRIDGE_ADDRESS || "";

  const wagmiContractConfig = {
    address: USDC_ADDRESS as `0x${string}`,
    abi: erc20abi,
    chainId: 1,
  };

  const {
    data: allowance
  } = useReadContract({
    ...wagmiContractConfig,
    functionName: FunctionName.Allowance,
    args: [address as `0x${string}`, BRIDGE_ADDRESS as `0x${string}`],
  });
  return {
    allowance
  };
};

export default useAllowance;
