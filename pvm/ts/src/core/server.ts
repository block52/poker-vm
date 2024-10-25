import { ethers, ZeroHash } from "ethers";
import { Node } from "./types";
import { getMempoolInstance } from "./mempool";
import { Transaction } from "../models";
import { NodeRpcClient } from "../client/client";
import { MineCommand } from "../commands/mineCommand";
import { getValidatorInstance } from "./validator";
import { getBootNodes } from "../state/nodeManagement";

export class Server {
    public readonly contractAddress: string;
    public readonly publicKey: string;
    private readonly isValidator: boolean;
    private _started: boolean = false;
    private readonly _port: number = parseInt(process.env.PORT || "3000");

    constructor(private readonly privateKey: string) {
        this.isValidator = false;
        this.publicKey = ethers.ZeroAddress;

        if (privateKey) {
            const wallet = new ethers.Wallet(privateKey);
            this.publicKey = wallet.address;
            this.isValidator = true;
        }

        this.contractAddress = ethers.ZeroAddress;
    }

    public me(): Node {
        return new Node(
            "pvm-typescript",
            this.publicKey,
            `http://localhost:${this._port}`,
            "1.0.0",
            this.isValidator
        );
    }

    get started(): boolean {
        return this._started;
    }

    public async mine() {
        const validatorInstance = getValidatorInstance();
        const validatorAddress = await validatorInstance.getNextValidatorAddress();
        if (validatorAddress === this.publicKey) {
            console.log(`I am the validator. Mining block...`);
            const mineCommand = new MineCommand(this.privateKey);
            const mineCommandResponse = await mineCommand.execute();
            const block = mineCommandResponse.result;
            if (!block) {
                throw new Error("No block mined");
            }
            console.log(`Block mined: ${block.hash}`);
            // Broadcast the block hash to the network
            const nodeUrls = await getBootNodes(this.me().url);
            for (const nodeUrl of nodeUrls) {
                console.log(`Broadcasting block hash to ${nodeUrl}`);
                try {
                    const client = new NodeRpcClient(nodeUrl);
                    await client.sendBlockHash(block.hash);
                } catch (error) {
                    console.warn(`Missing node ${nodeUrl}`);
                }
            }
        } else {
            console.log(`I am not the validator. Waiting for next block...`);
        }
    }

    public async start() {
        // Start the server
        this._started = true;
        console.log(`Server starting on port ${this._port} ...`);
    }

    public async stop() {
        // Stop the server
        this._started = false;
        console.log("Server stopping...");
    }

    public async bootstrap() {
        console.log("Polling...");
        const intervalId = setInterval(async () => {
            if (!this._started) {
                clearInterval(intervalId);
                console.log("Polling stopped.");
                return;
            }
            await this.syncMempool();
            await this.mine();
        }, 15000);

        this._started = true;
        console.log("Server started");
    }

    private async syncMempool() {
        if (!this.started) {
            return;
        }
        const mempool = getMempoolInstance();
        const nodeUrls = await getBootNodes(this.me().url);
        for (const nodeUrl of nodeUrls) {
            try {
                const client = new NodeRpcClient(nodeUrl);
                const otherMempool: Transaction[] = await client.getMempool();
                // Add to own mempool
                for (const transaction of otherMempool) {
                    mempool.add(transaction);
                }
            } catch (error) {
                console.warn(`Missing node ${nodeUrl}`);
            }
        }
    }
}

let instance: Server;
export const getServerInstance = () => {
    if (!instance) {
        instance = new Server(process.env.VALIDATOR_KEY || ZeroHash);
    }
    return instance;
};

const start = async () => {
    const server = getServerInstance();
    if (server.started) {
        return;
    }
    await server.bootstrap();
    await server.start();
};
