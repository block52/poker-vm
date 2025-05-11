import { ethers, ZeroAddress } from "ethers";
import { getBootNodes } from "../state/nodeManagement";
import { Node } from "../core/types";
import { createProvider } from "./provider";
import { CONTRACT_ADDRESSES } from "./constants";
import { IBlockchainManagement } from "../state/interfaces";
import { getBlockchainInstance } from "../state";

export class Validator {
    private readonly stakingContract: ethers.Contract;
    private readonly blockManager: IBlockchainManagement;
    private validatorCount: number = 0;
    private nodes: Node[] = [];
    private synced: boolean = false;
    private count: number;
    private lastUpdate: Date;

    constructor(private rpcUrl: string) {
        this.blockManager = getBlockchainInstance();
        const provider = createProvider(rpcUrl);
        this.count = 0;
        this.lastUpdate = new Date("2025-01-01");
        this.stakingContract = new ethers.Contract(
            CONTRACT_ADDRESSES.vaultAddress,
            ["function isValidator(address) view returns (bool)", "function validatorCount() view returns (uint256)"],
            provider
        );
    }

    public async isValidator(address: string): Promise<boolean> {
        // In dev mode, always return true
        if (process.env.DEV_MODE === "true") {
            console.log("Dev mode: Always returning true for validator check");
            return true;
        }
        console.log("checking vault contract with", address);
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
        // In dev mode, always return our address
        if (process.env.DEV_MODE === "true") {
            console.log("Dev mode: Using our address as validator");
            // Return our validator address instead of ZeroAddress
            const validatorAddress = process.env.VALIDATOR_ADDRESS;
            if (!validatorAddress) {
                throw new Error("VALIDATOR_ADDRESS not set in .env");
            }
            return validatorAddress; // Return your actual address
        }

        const lastBlock = await this.blockManager.getLastBlock();
        const nextBlockIndex = lastBlock.index + 1;

        if (sync || !this.synced) {
            this.nodes = await getBootNodes();
            this.validatorCount = await this.getValidatorCount();
            // [this.nodes, this.validatorCount] = await Promise.all([getBootNodes(), this.getValidatorCount()]);
            this.synced = true;
        }

        if (this.validatorCount === 0) {
            console.warn("No validators found");
            return ZeroAddress;
        }

        // // For now, we will just use the first validator in the list
        // const validatorIndex = nextBlockIndex % this.validatorCount;
        // const { publicKey: validatorAddress } = this.nodes[validatorIndex];

        // const node1 = "0xb2b4420e386db7f36d6bc1e123a2fDaBc8364846";
        // const texasHodl = "0xeE3A5673dE06Fa3Efd2fA2B6F46B5f75C0AcEb8D";
        // const dogNode = "0xA5A3443679d1154264d419F8C716435AA4972D9d";

        // console.log(`Next validator index: ${validatorIndex}, ${validatorAddress}`);

        // dog node metamask 0xA5A3443679d1154264d419F8C716435AA4972D9d
        // texas hodl 0xeE3A5673dE06Fa3Efd2fA2B6F46B5f75C0AcEb8D
        // hack
        // const pub_keys = ["0xeE3A5673dE06Fa3Efd2fA2B6F46B5f75C0AcEb8D", "0xb2b4420e386db7f36d6bc1e123a2fDaBc8364846"];
        // return pub_keys[nextBlockIndex % 2];

        // return "0xA5A3443679d1154264d419F8C716435AA4972D9d"; // dog node
        // return validatorAddress;

        return "0xb2b4420e386db7f36d6bc1e123a2fDaBc8364846";

        // 0xb2b4420e386db7f36d6bc1e123a2fDaBc8364846 is node 1s address
        // Always return our address in dev mode
        //  return process.env.VALIDATOR_ADDRESS || ethers.ZeroAddress;
    }
}

let validatorInstance: Validator | null = null;

export function getValidatorInstance(): Validator {
    if (!validatorInstance) {
        validatorInstance = new Validator(process.env.RPC_URL ?? "http://localhost:8545");
    }
    return validatorInstance;
}
