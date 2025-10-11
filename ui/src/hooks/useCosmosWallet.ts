import { useCosmosContext } from "./useCosmosContext";
import { getTestAddresses } from "../utils/cosmosUtils";

// Re-export the cosmos context as useCosmosWallet for backward compatibility
const useCosmosWallet = () => {
    const cosmosContext = useCosmosContext();

    // Add the testChainAddresses function for backward compatibility
    const testChainAddresses = async () => {
        return await getTestAddresses();
    };

    return {
        ...cosmosContext,
        testChainAddresses,
    };
};

export default useCosmosWallet;