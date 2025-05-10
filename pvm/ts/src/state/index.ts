import Redis from "ioredis";
import { RedisBlockchainManagement } from "./redis/redisBlockchainManagement";
import { getAccountManagementInstance } from "./accountManagement";
import { getContractSchemaManagement } from "./contractSchemaManagement";
import { getGameManagementInstance } from "./gameManagement";
import { IBlockchainManagement } from "./interfaces";
import { getTransactionInstance } from "./transactionManagement";
import { MongoDBBlockchainManagement } from "./mongodb/blockchainManagement";
import { LevelDBBlockchainManagement } from "./leveldb/blockchainManagment";

export { getAccountManagementInstance, getContractSchemaManagement, getGameManagementInstance, getTransactionInstance };

export const getBlockchainInstance = (): IBlockchainManagement => {
    let connString = process.env.DB_URL || "redis://localhost:6379";

    connString = "leveldb://leveldb"; // For testing purposes, use LevelDB

    const dbType = connString.split(":")[0];

    if (dbType === "redis") {
        const redisClient = new Redis(process.env.DB_URL || "redis://localhost:6379");
        const instance = new RedisBlockchainManagement(redisClient);
        return instance;
    }

    if (dbType === "mongodb") {
        return new MongoDBBlockchainManagement(connString);
    }

    if (dbType === "leveldb") {
        const instance = new LevelDBBlockchainManagement("./leveldb");
        return instance;
    }

    throw new Error("Unsupported database type");
}