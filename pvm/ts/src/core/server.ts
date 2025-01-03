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
import { Bridge } from "./bridge";

export class Server {
    public readonly contractAddress: string;
    public readonly publicKey: string;
    private readonly isValidator: boolean;
    private _started: boolean = false;
    private _syncing: boolean = false;
    private _synced: boolean = false;
    private _lastDepositSync: number = 0;
    private readonly _port: number = parseInt(process.env.PORT || "3000");
    private readonly nodes: Map<string, Node> = new Map();

    constructor(private readonly privateKey: string) {
        this.isValidator = false;
        this.publicKey = ethers.ZeroAddress;

        if (privateKey && privateKey !== ZeroHash) {
            const wallet = new ethers.Wallet(privateKey);
            this.publicKey = wallet.address;
            console.log(`Public key: ${this.publicKey}`);
            this.isValidator = true;
        }

        this.contractAddress = ethers.ZeroAddress;
        this._lastDepositSync = Date.now();
    }

    public me(): Node {
        const url = process.env.PUBLIC_URL || `http://localhost:${this._port}`;
        return new Node("pvm-typescript", this.publicKey, url, "1.0.2", this.isValidator);
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
            console.log(`I am a validator. Mining block...`);
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
            console.log(`I am not a validator ${this.publicKey}. Waiting for next block...`);
        }
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
        await this.getNodes();

        if (args.includes("--reset")) {
            await this.resyncBlockchain();
        }

        if (!args.includes("--reset")) {
            await this.syncBlockchain();
        }

        await this.syncDeposits();
        await this.syncMempool();

        console.log("Polling...");
        const intervalId = setInterval(async () => {
            if (!this._started) {
                clearInterval(intervalId);
                console.log("Polling stopped");
                return;
            }

            await this.mine();
            await this.purgeMempool();
            await this.findHighestTip();

            if (!this.synced) {
                await this.syncBlockchain();
            }
        }, 15000);

        this._started = true;
        console.log("Server started");
    }

    private async getNodes() {
        console.log("Finding nodes...");
        let count = 0;
        if (this.nodes.size === 0) {

            const nodes = await getBootNodes(this.me().url);

            for (const node of nodes) {
                this.nodes.set(node.url, node);
                count++;
            }
        }
        console.log(`Found ${count} nodes`);
    }

    // private async handShake(url: string) {
    //     const client = new NodeRpcClient(url, this.privateKey);
    //     const node = await client.getNode();
    //     console.log(`Handshake with ${node.name} ${node.url}`);
    //     this.nodes.set(node.url, node);
    // }

    private async syncMempool() {
        if (!this.started) {
            return;
        }

        console.log("Syncing mempool...");
        const mempool = getMempoolInstance();

        for (const [url, node] of this.nodes) {
            try {
                const client = new NodeRpcClient(url, this.privateKey);
                const otherMempool: TransactionDTO[] = await client.getMempool();
                // Add to own mempool
                await Promise.all(
                    otherMempool.map(async transaction => {
                        await mempool.add(Transaction.fromJson(transaction));
                    })
                );
            } catch (error) {
                // Dont evict the node
                console.warn(`Missing node ${url}`);
                // this.nodes.delete(url);
            }
        }

        // await Promise.all(
        //     this.nodes.forEach(async node => {
        //         try {
        //             const client = new NodeRpcClient(node.url, this.privateKey);
        //             const otherMempool: TransactionDTO[] = await client.getMempool();
        //             // Add to own mempool
        //             await Promise.all(
        //                 otherMempool.map(async transaction => {
        //                     await mempool.add(Transaction.fromJson(transaction));
        //                 })
        //             );
        //         } catch (error) {
        //             console.warn(`Missing node ${node.url}`);
        //             this.nodes
        //         }
        //     })

        // this.nodes.map(async node => {
        //     try {
        //         const client = new NodeRpcClient(node.url, this.privateKey);
        //         const otherMempool: TransactionDTO[] = await client.getMempool();
        //         // Add to own mempool
        //         await Promise.all(
        //             otherMempool.map(async transaction => {
        //                 await mempool.add(Transaction.fromJson(transaction));
        //             })
        //         );
        //     } catch (error) {
        //         console.warn(`Missing node ${node.url}`);
        //         this.nodes
        //     }
        // })
        //);
    }

    private async purgeMempool() {
        console.log("Purging mempool...");
        const mempool = getMempoolInstance();
        await mempool.purge();
    }

    private async syncDeposits() {
        if (this._lastDepositSync + 60000 > Date.now()) {
            return;
        }

        if (this.isValidator) {
            const bridge = new Bridge(process.env.RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/uwae8IxsUFGbRFh8fagTMrGz1w5iuvpc");
            await bridge.resync();
            this._lastDepositSync = Date.now();
        }
    }

    private async resyncBlockchain() {
        console.log("Resyncing blockchain...");
        const blockchain = getBlockchainInstance();
        await blockchain.reset();
        await this.syncBlockchain();
    }

    private async syncBlockchain() {
        this._syncing = true;

        if (this.nodes.size === 0) {
            console.log("No nodes to sync with");
            this._syncing = false;
            this._synced = true;
            return;
        }

        let highestNode: Node = Array.from(this.nodes.values())[0];
        let highestTip = 0;

        // create a map of nodes to their highest tip
        const nodeHeights = new Map<string, number>();

        for (const [url, node] of this.nodes) {
            try {
                const client = new NodeRpcClient(node.url, this.privateKey);
                const block = await client.getLastBlock();
                console.info(`Received block ${block.index} ${block.hash} from ${node.url}`);

                if (block.index > highestTip) {
                    highestTip = block.index;
                    highestNode = node;
                }

                // Update the node height
                nodeHeights.set(node.url, block.index);

            } catch (error) {
                console.warn(`Missing node ${node.url}`);
            }
        }

        // const highestNode: Node = await this.findHighestTip();

        console.log(`Highest node is ${highestNode.url} with tip ${highestTip}`);

        // Get my current tip
        const blockchain = getBlockchainInstance();
        const lastBlock = await blockchain.getLastBlock();
        let tip = lastBlock.index;

        // console.log(`My tip is ${tip}, syncing with other nodes...`);

        // for (const [url, height] of nodeHeights) {
        //     console.log(`Node ${url} has tip ${height}`);

        //     if (height < tip) {
        //         // Send blocks to the node
        //         // const blocks = await blockchain.getBlocks(tip - height);
        //         const client = new NodeRpcClient(url, this.privateKey);

        //         for (let i = height; i < tip; i++) {
        //             const block = await blockchain.getBlock(i);
        //             // console.log(`Sending block ${block.index} to ${url}`);
        //             // await client.sendBlock(block.toJson());
        //         }
        //     }
        // }

        if (lastBlock.index === highestTip) {
            console.log("Blockchain is synced");
            this._synced = true;
        }

        if (this._synced) {
            this._syncing = false;
            return;
        }

        // Sync with the highest node
        const client = new NodeRpcClient(highestNode.url, this.privateKey);

        for (let i = tip; i <= highestTip; i++) {
            const blockDTO: BlockDTO = await client.getBlock(i);
            console.log(blockDTO);

            if (!blockDTO) {
                console.warn(`Block ${i} is missing`);
                continue;
            }

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

    private async findHighestTip(): Promise<Node> {
        // Get my current tip
        const blockchain = getBlockchainInstance();
        const lastBlock = await blockchain.getLastBlock();
        let tip = lastBlock.index;

        let highestNode: Node = Array.from(this.nodes.values())[0];
        let highestTip = 0;

        for (const [url, node] of this.nodes) {
            try {
                const client = new NodeRpcClient(node.url, this.privateKey);
                const block = await client.getLastBlock();

                if (block.index > highestTip) {
                    highestTip = block.index;
                    highestNode = node;
                }
            } catch (error) {
                console.warn(`Missing node ${node.url}`);
            }
        }

        if (highestTip > tip) {
            this._synced = false;
        }

        return highestNode;
    }
}

let instance: Server;
export const getServerInstance = (): Server => {
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
