import { getRedisBlockchainManagementInstance } from "./redis/redisBlockchainManagement";
import { getGameManagementInstance } from "./mongodb/gameManagement";
import { IAccountManagement, IBlockchainManagement } from "./interfaces";
import { getTransactionInstance } from "./mongodb/transactionManagement";
import { MongoDBBlockchainManagement } from "./mongodb/blockchainManagement";
import { getRedisAccountManagementInstance } from "./redis/redisAccountManagement";
import { getMongoAccountManagementInstance } from "./mongodb/accountManagement";
export { getGameManagementInstance, getTransactionInstance };

export const getBlockchainInstance = (): IBlockchainManagement => {
    const connString = process.env.DB_URL || "redis://localhost:6379";
    const dbType = connString.split(":")[0];

    if (dbType === "redis") {
        return getRedisBlockchainManagementInstance(connString);
    }

    if (dbType === "mongodb" || dbType === "mongodb+srv") {
        return new MongoDBBlockchainManagement(connString);
    }

    if (dbType === "rocksdb") {
        throw new Error("RocksDB is not supported yet");
    }

    throw new Error("Unsupported database type");
}

export const getAccountManagementInstance = (): IAccountManagement => {
    const connString = process.env.DB_URL || "redis://localhost:6379";
    const dbType = connString.split(":")[0];

    if (dbType === "redis") {
        return getRedisAccountManagementInstance(connString);
    }

    if (dbType === "mongodb" || dbType === "mongodb+srv") {
        return getMongoAccountManagementInstance();
    }

    if (dbType === "rocksdb") {
        throw new Error("RocksDB is not supported yet");
    }

    throw new Error("Unsupported database type");
}