import { useReadContract } from "wagmi";
import useUserWalletConnect from "./useUserWalletConnect";
import { erc20abi } from "../abis/erc20ABI";
import { FunctionName } from "../types";

const useAllowance = () => {
    const { address } = useUserWalletConnect();
    const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    const BRIDGE_ADDRESS = "0xBf1e380f3D1AE31854764081C488EaDA9F4CB195";

    const wagmiContractConfig = {
        address: USDC_ADDRESS as `0x${string}`,
        abi: erc20abi,
        chainId: 1
    };

    const { data: allowance } = useReadContract({
        ...wagmiContractConfig,
        functionName: FunctionName.Allowance,
        args: [address as `0x${string}`, BRIDGE_ADDRESS as `0x${string}`]
    });
    return {
        allowance
    };
};

export default useAllowance;
