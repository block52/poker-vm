import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { erc20abi } from "../abis/erc20ABI";
import { FunctionName } from "../types";

const useDecimal = (tokenAddress: string) => {
    const [decimals, setDecimals] = useState<number>(0);

    const { data, error, isLoading } = useReadContract({
        address: tokenAddress as `0x${string}`,
        functionName: FunctionName.Decimals,
        abi: erc20abi
    });

    useEffect(() => {
        if (data) {
            setDecimals(data);
        }
    }, [data]);

    return {
        decimals,
        isLoading,
        error
    };
};

export default useDecimal;
