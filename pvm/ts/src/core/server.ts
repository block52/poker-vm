import axios from "axios";
import { ethers, ZeroAddress } from "ethers";
import { Node } from "./types";
import { getMempoolInstance } from "./mempool";
import { Transaction } from "../models";
import { NodeRpcClient } from "../client/client";
import { MineCommand } from "../commands/mineCommand";
import { getValidatorInstance } from "./validator";

export class Server {
    public readonly contractAddress: string;
    public readonly publicKey: string;
    private readonly isValidator: boolean;
    private _started: boolean = false;
    constructor(privateKey: string = "") {
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
            `http://localhost:${process.env.PORT}`,
            "1.0.0",
            this.isValidator
        );
    }

    get started(): boolean {
        return this._started;
    }

    public async mine() {
        // Mine a block
        console.log("Block mined");
    }

    public async start() {
        // Start the server
        this._started = true;
        console.log("Server starting...");
    }

    public async stop() {
        // Stop the server
        this._started = false;
        console.log("Server stopping...");
    }

    private async getBootNodes(): Promise<string[]> {
        const response = await axios.get(
            "https://raw.githubusercontent.com/block52/poker-vm/refs/heads/main/bootnodes.json"
        );
        const ownNode = this.me();
        const bootNodeUrls = response.data as string[];
        const nodeUrls = bootNodeUrls.filter(url => url !== ownNode.url);
        return nodeUrls;
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
            const validatorInstance = getValidatorInstance();
            const validatorAddress = await validatorInstance.getNextValidatorAddress();
            if (validatorAddress === ZeroAddress || this.publicKey === validatorAddress) {
                const mineCommand = new MineCommand();
                const block = await mineCommand.execute();
                // Broadcast the block hash to the network
                const nodeUrls = await this.getBootNodes();
                for (const nodeUrl of nodeUrls) {
                    const client = new NodeRpcClient(nodeUrl);
                    await client.sendBlockHash(block.hash);
                }
            }
        }, 15000);

        this._started = true;
        console.log("Server started");
    }

    private async syncMempool() {
        if (!this.started) {
            return;
        }
        const mempool = getMempoolInstance();
        const nodeUrls = await this.getBootNodes();
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
        instance = new Server();
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
