import { useReadContract } from "wagmi";
import useUserWalletConnect from "./useUserWalletConnect";
import { erc20abi } from "../abis/erc20ABI";
import { FunctionName } from "../types";
import { useMemo } from "react";
import { CONTRACT_ADDRESSES } from "../constants";

const useAllowance = () => {
    const { address } = useUserWalletConnect();

    const wagmiContractConfig = {
        address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
        abi: erc20abi,
        chainId: 1
    };

    const { data: allowance, isError, isLoading } = useReadContract({
        ...wagmiContractConfig,
        functionName: FunctionName.Allowance,
        args: address ? [address as `0x${string}`, CONTRACT_ADDRESSES.bridgeAddress as `0x${string}`] : undefined
    });

    return useMemo(() => ({
        allowance,
        isError,
        isLoading
    }), [allowance, isError, isLoading]);
};

export default useAllowance;