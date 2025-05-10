import { RedisBlockchainManagement } from "../data/redis";
import { getAccountManagementInstance } from "./accountManagement";
import { getContractSchemaManagement } from "./contractSchemaManagement";
import { getGameManagementInstance } from "./gameManagement";
import { IBlockchainManagement } from "./interfaces";
import { getTransactionInstance } from "./transactionManagement";

export { getAccountManagementInstance, getContractSchemaManagement, getGameManagementInstance, getTransactionInstance };

export const getBlockchainInstance = (): IBlockchainManagement => {

    const instance = new RedisBlockchainManagement();
    return instance;
}