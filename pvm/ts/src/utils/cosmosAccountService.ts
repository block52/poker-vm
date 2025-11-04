import { CosmosAccountCommand, CosmosAccountInfo } from "../commands/cosmos/cosmosAccountCommand";
import { CosmosConfig } from "@bitcoinbrisbane/block52";

/**
 * Service for managing Cosmos account operations
 */
export class CosmosAccountService {
    private readonly config: CosmosConfig;
    private readonly privateKey: string;

    constructor(config: CosmosConfig, privateKey: string) {
        this.config = config;
        this.privateKey = privateKey;
    }

    /**
     * Get account information for a specific address
     */
    async getAccountInfo(address: string): Promise<CosmosAccountInfo> {
        const command = new CosmosAccountCommand(this.config.rpcEndpoint, address, this.privateKey);
        const response = await command.execute();
        return response.data;
    }

    /**
     * Get balance for a specific denomination
     */
    async getBalance(address: string, denom: string): Promise<string> {
        const accountInfo = await this.getAccountInfo(address);
        const balance = accountInfo.balances.find(b => b.denom === denom);
        return balance?.amount || "0";
    }

    /**
     * Get all balances for an address
     */
    async getAllBalances(address: string): Promise<Array<{ denom: string; amount: string }>> {
        const accountInfo = await this.getAccountInfo(address);
        return accountInfo.balances;
    }

    /**
     * Check if an account exists (has been initialized)
     */
    async accountExists(address: string): Promise<boolean> {
        try {
            const accountInfo = await this.getAccountInfo(address);
            return Number(accountInfo.accountNumber) > 0 || accountInfo.balances.length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get the next sequence number for an account
     */
    async getNextSequence(address: string): Promise<number> {
        const accountInfo = await this.getAccountInfo(address);
        return Number(accountInfo.sequence);
    }
}

// Example usage
async function example() {
    const config: CosmosConfig = {
        rpcEndpoint: "https://node1.block52.xyz",
        restEndpoint: "https://node1.block52.xyz/api",
        chainId: "poker-chain",
        prefix: "poker",
        denom: "upoker",
        gasPrice: "0.025upoker"
    };

    const privateKey = "your-private-key-here";
    const accountService = new CosmosAccountService(config, privateKey);

    try {
        const address = "poker1example...";

        console.log("Fetching account info for:", address);
        const accountInfo = await accountService.getAccountInfo(address);

        console.log("Account Info:", {
            address: accountInfo.address,
            balances: accountInfo.balances,
            sequence: accountInfo.sequence,
            accountNumber: accountInfo.accountNumber,
            type: accountInfo.type
        });

        // Get specific balance
        const pokerBalance = await accountService.getBalance(address, "upoker");
        console.log("POKER balance:", pokerBalance);

        // Check if account exists
        const exists = await accountService.accountExists(address);
        console.log("Account exists:", exists);

        // Get next sequence
        const nextSeq = await accountService.getNextSequence(address);
        console.log("Next sequence number:", nextSeq);
    } catch (error) {
        console.error("Error:", error);
    }
}

// Uncomment to run the example
// example().catch(console.error);
