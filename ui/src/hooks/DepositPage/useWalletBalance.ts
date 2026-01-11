import { useReadContract, useChainId } from "wagmi";
import useUserWalletConnect from "./useUserWalletConnect";
import { erc20abi } from "../../abis/erc20ABI";
import { FunctionName } from "../../types";
import { useMemo } from "react";
import {
    ETH_USDC_ADDRESS,
    ETH_CHAIN_ID,
    BASE_USDC_ADDRESS,
    BASE_CHAIN_ID
} from "../../config/constants";

const useWalletBalance = () => {
    const { address } = useUserWalletConnect();
    const chainId = useChainId();

    // Select USDC address based on connected chain
    const usdcAddress = chainId === BASE_CHAIN_ID ? BASE_USDC_ADDRESS : ETH_USDC_ADDRESS;
    const targetChainId = chainId === BASE_CHAIN_ID ? BASE_CHAIN_ID : ETH_CHAIN_ID;

    const wagmiContractConfig = {
        address: usdcAddress as `0x${string}`,
        abi: erc20abi,
        chainId: targetChainId
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
