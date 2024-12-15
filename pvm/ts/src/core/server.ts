import { ethers, ZeroHash } from "ethers";
import { Node } from "./types";
import { getMempoolInstance } from "./mempool";
import { getBlockchainInstance } from "../state/index";
import { Transaction } from "../models";
import { Block } from "../models/block";
import { BlockDTO, NodeRpcClient, TransactionDTO } from "@bitcoinbrisbane/block52";
import { MineCommand } from "../commands/mineCommand";
import { getValidatorInstance } from "./validator";
import { getBootNodes } from "../state/nodeManagement";

export class Server {
    public readonly contractAddress: string;
    public readonly publicKey: string;
    private readonly isValidator: boolean;
    private _started: boolean = false;
    private _syncing: boolean = false;
    private _synced: boolean = false;
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
        const url = process.env.PUBLIC_URL || `http://localhost:${this._port}`;
        return new Node("pvm-typescript", this.publicKey, url, "1.0.1", this.isValidator);
    }

    get started(): boolean {
        return this._started;
    }

    get syncing(): boolean {
        return this._syncing;
    }

    get synced(): boolean {
        return this._synced;
    }

    public async mine() {
        const validatorInstance = getValidatorInstance();
        const validatorAddress = await validatorInstance.getNextValidatorAddress();

        if (validatorAddress === this.publicKey) {
            console.log(`I am the validator. Mining block...`);
            const mineCommand = new MineCommand(this.privateKey);
            const mineCommandResponse = await mineCommand.execute();
            const block = mineCommandResponse.data;

            if (!block) {
                throw new Error("No block mined");
            }

            console.log(`Block mined: ${block.hash}`);

            // Broadcast the block hash to the network
            const nodes = await getBootNodes(this.me().url);
            for (const node of nodes) {
                console.log(`Broadcasting block hash to ${node.url}`);
                try {
                    const client = new NodeRpcClient(node.url, this.privateKey);
                    await client.sendBlockHash(block.hash);
                } catch (error) {
                    console.warn(`Missing node ${node.url}`);
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

        console.log("Syncing blocks...");
        while (!this.synced) {
            await this.syncBlockchain(10);
        }

        console.log("Polling...");
        const intervalId = setInterval(async () => {
            if (!this._started) {
                clearInterval(intervalId);
                console.log("Polling stopped.");
                return;
            }
            await this.syncMempool();
            // await this.mine();
        }, 15000);

        this._started = true;
        console.log("Server started");
    }

    private async syncMempool() {
        if (!this.started) {
            return;
        }

        const mempool = getMempoolInstance();
        const nodes = await getBootNodes(this.me().url);
        await Promise.all(
            nodes.map(async node => {
                try {
                    const client = new NodeRpcClient(node.url, this.privateKey);
                    const otherMempool: TransactionDTO[] = await client.getMempool();
                    // Add to own mempool
                    await Promise.all(
                        otherMempool.map(async transaction => {
                            await mempool.add(Transaction.fromJson(transaction));
                        })
                    );
                } catch (error) {
                    console.warn(`Missing node ${node.url}`);
                }
            })
        );
    }

    private async syncBlockchain(rate: number = 10) {
        this._syncing = true;
        const nodes = await getBootNodes(this.me().url);

        if (nodes.length === 0) {
            console.log("No nodes to sync with");
            return;
        }

        let highestNode: Node = nodes[0];

        // Get my current tip
        const blockchain = getBlockchainInstance();
        const lastBlock = await blockchain.getLastBlock();
        let tip = lastBlock.index;

        for (const node of nodes) {
            try {
                const client = new NodeRpcClient(node.url, this.privateKey);
                const block = await client.getLastBlock();
                console.log(`Received block ${block.hash} from ${node.url}`);

                if (block.index > tip) {
                    tip = block.index;
                    highestNode = node;
                }

                if (block.index === tip) {
                    this._synced = true;
                }

            } catch (error) {
                console.warn(`Missing node ${node.url}`);
            }
        }

        console.log(`Highest node is ${highestNode.url}`);

        if (this._synced) {
            this._syncing = false;
            return;
        }

        // Sync with the highest node
        const client = new NodeRpcClient(highestNode.url, this.privateKey);

        for (let i = lastBlock.index + 1; i <= tip; i++) {
            const blockDTO = await client.getBlock(i);
            console.log(`Verifying block ${blockDTO.hash} from ${highestNode.url}`);

            const block = Block.fromJson(blockDTO);

            if (!block.verify()) {
                console.warn(`Block ${block.hash} is invalid`);
                continue;
            }

            console.log(`Adding block ${block.hash} from ${highestNode.url}`);
            await blockchain.addBlock(block);
        }

        this._syncing = false;
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
