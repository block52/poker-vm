import { useReadContract, useChainId } from "wagmi";
import useUserWalletConnect from "./useUserWalletConnect";
import { erc20abi } from "../../abis/erc20ABI";
import { FunctionName } from "../../types";
import {
    ETH_USDC_ADDRESS,
    ETH_CHAIN_ID,
    BASE_USDC_ADDRESS,
    COSMOS_BRIDGE_ADDRESS,
    BASE_COSMOS_BRIDGE_ADDRESS,
    BASE_CHAIN_ID
} from "../../config/constants";

const useAllowance = () => {
    const { address } = useUserWalletConnect();
    const chainId = useChainId();

    // Select USDC and bridge addresses based on connected chain
    const usdcAddress = chainId === BASE_CHAIN_ID ? BASE_USDC_ADDRESS : ETH_USDC_ADDRESS;
    const bridgeAddress = chainId === BASE_CHAIN_ID ? BASE_COSMOS_BRIDGE_ADDRESS : COSMOS_BRIDGE_ADDRESS;
    const targetChainId = chainId === BASE_CHAIN_ID ? BASE_CHAIN_ID : ETH_CHAIN_ID;

    const wagmiContractConfig = {
        address: usdcAddress as `0x${string}`,
        abi: erc20abi,
        chainId: targetChainId
    };

    const { data: allowance } = useReadContract({
        ...wagmiContractConfig,
        functionName: FunctionName.Allowance,
        args: [address as `0x${string}`, bridgeAddress as `0x${string}`]
    });
    return {
        allowance
    };
};

export default useAllowance;
