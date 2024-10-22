import axios from "axios";
import { ethers } from "ethers";
import { Node } from "./types";
import { getMempoolInstance } from "./mempool";
import { Transaction } from "../models";
import { NodeRpcClient } from "../client/client";

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
        const intervalId = setInterval(async () => {
            if (!this._started) {
                clearInterval(intervalId);
                console.log("Polling stopped.");
                return;
            }
            console.log("Polling...");
            await this.syncMempool();
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
                const otherMempool = await client.getMempool();
                // Add to own mempool
                for (const transaction of otherMempool) {
                    mempool.add(Transaction.fromJson(transaction));
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
