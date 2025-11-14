import { ethers, ZeroHash } from "ethers";
import { Node } from "./types";
import { getMempoolInstance } from "./mempool";
import { Transaction } from "../models";
import { Block } from "../models/block";
import { BlockDTO, NodeRpcClient, TransactionDTO } from "@bitcoinbrisbane/block52";
import { getBootNodes } from "../state/nodeManagement";

let serverInstance: Server | null = null;

export function getServerInstance(): Server {
    if (!serverInstance) {
        serverInstance = new Server();
    }
    return serverInstance;
}

export class Server {
    public readonly contractAddress: string;
    public readonly publicKey: string;
    private isValidator: boolean;
    private _started: boolean = false;
    _lastDepositSync: Date;
    private readonly _port: number = parseInt(process.env.PORT || "8545");
    private readonly _nodes: Map<string, Node> = new Map();

    constructor() {
        this.isValidator = false;
        this.publicKey = ethers.ZeroAddress;

        console.log(`Validator status: ${this.isValidator}`);
        console.log(`Validator public key: ${this.publicKey}`);
        console.log(`Validator port: ${this._port}`);

        this.contractAddress = ethers.ZeroAddress;
        this._lastDepositSync = new Date("2025-01-01");
    }

    public async me(): Promise<Node> {
        // const blockchain = getBlockchainInstance();
        // const lastBlock = await blockchain.getLastBlock();
        const url = process.env.PUBLIC_URL || `http://localhost:${this._port}`;
        return new Node("pvm-typescript", this.publicKey, url, "1.0.3", this.isValidator, 0);
    }

    get started(): boolean {
        return this._started;
    }

    get nodes(): Map<string, Node> {
        return this._nodes;
    }

    public async start() {
        // Start the server
        this._started = true;
        console.log(`Server starting on port ${this._port}...`);
    }

    public async stop() {
        // Stop the server
        this._started = false;
        console.log("Server stopping...");
    }

    public async bootstrap(args: string[] = []) {
        this._started = true;
        console.log(`Server started on port ${this._port}`);
    }
}
