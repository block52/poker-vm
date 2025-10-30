import { DEFAULT_COSMOS_CONFIG } from "../../state/cosmos/config";
import { getCosmosClient } from "@bitcoinbrisbane/block52";
import { signResult } from "../abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "../interfaces";
import { Coin } from "@cosmjs/amino";

export interface CosmosAccountInfo {
    address: string;
    balances: Array<{
        denom: string;
        amount: string;
    }>;
    sequence: number;
    accountNumber: number;
    pubKey?: string;
    type: string;
}

// TODO:  Should return same Object as the old account info
export class CosmosAccountCommand implements ISignedCommand<CosmosAccountInfo> {
    private readonly cosmosRpcUrl: string;
    private readonly address: string;

    constructor(cosmosRpcUrl: string, address: string, private readonly privateKey: string) {
        this.cosmosRpcUrl = cosmosRpcUrl;
        this.address = address;
        this.privateKey = privateKey;
    }

    public async execute(): Promise<ISignedResponse<CosmosAccountInfo>> {
        try {
            // Create cosmos config with injected RPC URL
            const config = {
                ...DEFAULT_COSMOS_CONFIG,
                rpcEndpoint: this.cosmosRpcUrl
            };

            // Get cosmos client
            const cosmosClient = getCosmosClient(config);

            // Get account info and balances
            const [account, balances] = await Promise.all([cosmosClient.getAccount(this.address), cosmosClient.getAllBalances(this.address)]);

            // Transform the account data into our interface
            const accountInfo: CosmosAccountInfo = {
                address: this.address,
                balances: balances.map((coin: Coin) => ({
                    denom: coin.denom,
                    amount: coin.amount
                })),
                sequence: account?.sequence || 0,
                accountNumber: account?.accountNumber || 0,
                pubKey: account?.pubkey?.value || undefined,
                type: (account as any)?.["@type"] || "cosmos-sdk/BaseAccount"
            };

            return signResult(accountInfo, this.privateKey);
        } catch (error) {
            throw new Error(`Failed to fetch Cosmos account: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
}
