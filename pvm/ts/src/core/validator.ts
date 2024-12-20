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

    constructor(rpcUrl: string) {
        const vault = process.env.VAULT_CONTRACT_ADDRESS ?? ZeroAddress;
        this.blockManager = new BlockchainManagement();
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.stakingContract = new ethers.Contract(vault, ["function isValidator(address) view returns (bool)", "function validatorCount() view returns (uint256)"], this.provider);
    }

    public async isValidator(address: string): Promise<boolean> {
        return await this.stakingContract.isValidator(address);
    }

    public async getValidatorCount(): Promise<number> {
        const count: bigint = await this.stakingContract.validatorCount();
        return Number(count);
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
        const validatorIndex = 0; // nextBlockIndex % this.validatorCount;

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
