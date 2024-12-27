import { ethers, ZeroAddress } from "ethers";
import { BlockchainManagement } from "../state/blockchainManagement";
import { getBootNodes } from "../state/nodeManagement";
import { Node } from "../core/types";

export class Validator {
    private readonly stakingContract: ethers.Contract;
    private readonly provider: ethers.JsonRpcProvider;
    private readonly blockManager: BlockchainManagement;
    private validatorCount: number = 0;
    private nodes: Node[] = [];
    private synced: boolean = false;
    private count: number;
    private lastUpdate: Date;

    constructor(rpcUrl: string) {
        const vault = process.env.VAULT_CONTRACT_ADDRESS ?? ZeroAddress;
        this.blockManager = new BlockchainManagement();
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.count = 0;
        this.lastUpdate = new Date();
        this.stakingContract = new ethers.Contract(vault, ["function isValidator(address) view returns (bool)", "function validatorCount() view returns (uint256)"], this.provider);
    }

    public async isValidator(address: string): Promise<boolean> {
        return await this.stakingContract.isValidator(address);
    }

    public async getValidatorCount(): Promise<number> {
        // Only update the validator count every 60 minutes otherwise return the cached value
        if (this.lastUpdate && new Date().getTime() - this.lastUpdate.getTime() < 60 * 60 * 1000) {
            return this.count;
        }
        const count: bigint = await this.stakingContract.validatorCount();
        this.count = Number(count);
        return this.count;
    }

    public async getNextValidatorAddress(sync: boolean = false): Promise<string> {
        const lastBlock = await this.blockManager.getLastBlock();
        const nextBlockIndex = lastBlock.index + 1;

        if (sync || !this.synced) {
            [this.nodes, this.validatorCount] = await Promise.all([getBootNodes(), this.getValidatorCount()]);
            // this.nodes = await getBootNodes();
            // this.validatorCount = await this.getValidatorCount();
            this.synced = true;
        }

        if (this.validatorCount === 0) {
            console.warn("No validators found");
            return ZeroAddress;
        }

        // For now, we will just use the first validator in the list
        const validatorIndex = nextBlockIndex % this.validatorCount;

        const { publicKey: validatorAddress } = this.nodes[validatorIndex];
        console.log(`Next validator index: ${validatorIndex}, ${validatorAddress}`);
        return validatorAddress;
    }
}

let validatorInstance: Validator | null = null;

export function getValidatorInstance(): Validator {
    if (!validatorInstance) {
        validatorInstance = new Validator(process.env.RPC_URL ?? "http://localhost:8545");
    }
    return validatorInstance;
}
