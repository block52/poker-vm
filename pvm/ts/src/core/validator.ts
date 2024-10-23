import { ethers, ZeroAddress } from "ethers";
import { BlockchainManagement } from "../state/blockchainManagement";
import { getBootNodes } from "../state/nodeManagement";

export class Validator {
    private readonly stakingContract: ethers.Contract;
    private readonly provider: ethers.JsonRpcProvider;

    constructor(rpcUrl: string) {
        const vault = process.env.VAULT_CONTRACT_ADDRESS ?? ZeroAddress;
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

    public async getNextValidatorAddress(): Promise<string> {
        const nodes = await getBootNodes();
        const blockManager = new BlockchainManagement();
        const lastBlock = await blockManager.getLastBlock();
        const nextBlockIndex = lastBlock.index + 1;
        const validatorCount: number = await this.getValidatorCount();
        if (validatorCount === 0) {
            console.warn("No validators found");
            return ZeroAddress;
        }
        const validatorIndex = nextBlockIndex % validatorCount;
        const validatorAddress = nodes[validatorIndex];
        console.log(`Next validator: ${validatorIndex}, ${validatorAddress}`);
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
