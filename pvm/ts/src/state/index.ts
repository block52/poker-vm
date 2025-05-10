import Redis from "ioredis";
import { RedisBlockchainManagement } from "../data/redis";
import { getAccountManagementInstance } from "./accountManagement";
import { getContractSchemaManagement } from "./contractSchemaManagement";
import { getGameManagementInstance } from "./gameManagement";
import { IBlockchainManagement } from "./interfaces";
import { getTransactionInstance } from "./transactionManagement";

export { getAccountManagementInstance, getContractSchemaManagement, getGameManagementInstance, getTransactionInstance };

export const getBlockchainInstance = (): IBlockchainManagement => {
    // Create a Redis client with non authentication
    // const redisClient = new Redis({
    //     host: process.env.REDIS_HOST || "localhost",
    //     port: parseInt(process.env.REDIS_PORT || "6379", 10),
    //     password: process.env.REDIS_PASSWORD || undefined,
    // });

    const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
    const instance = new RedisBlockchainManagement(redisClient);
    return instance;
}