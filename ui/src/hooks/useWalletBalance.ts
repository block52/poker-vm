import { useReadContract } from "wagmi";
import useUserWalletConnect from "./useUserWalletConnect";
import { erc20abi } from "../abis/erc20ABI";
import { FunctionName } from "../types";
import { useMemo } from "react";
import { CONTRACT_ADDRESSES } from "../constants";

const useWalletBalance = () => {
    const { address } = useUserWalletConnect();
    const USDC_ADDRESS = CONTRACT_ADDRESSES.USDC;

    const wagmiContractConfig = {
        address: USDC_ADDRESS as `0x${string}`,
        abi: erc20abi,
        chainId: 1
    };

    const {
        data: balance,
        isLoading,
        isError
    } = useReadContract({
        ...wagmiContractConfig,
        functionName: FunctionName.Balance,
        args: [address as `0x${string}`]
    });

    return useMemo(
        () => ({
            balance,
            isLoading,
            isError
        }),
        [balance, isLoading, isError]
    );
};

export default useWalletBalance;
