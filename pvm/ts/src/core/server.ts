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

let serverInstance: Server | null = null;

export function getServerInstance(): Server {
    if (!serverInstance) {
        const privateKey = process.env.VALIDATOR_KEY || ZeroHash;
        serverInstance = new Server(privateKey);
    }
    return serverInstance;
}

export class Server {
    public readonly contractAddress: string;
    public readonly publicKey: string;
    private isValidator: boolean;
    private _started: boolean = false;
    private _syncing: boolean = false;
    private _synced: boolean = false;
    private _lastDepositSync: Date;
    private readonly _port: number = parseInt(process.env.PORT || "3000");
    private readonly _nodes: Map<string, Node> = new Map();

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
        this._lastDepositSync = new Date("2025-01-01");
    }

    public async me(): Promise<Node> {
        const blockchain = getBlockchainInstance();
        const lastBlock = await blockchain.getLastBlock();
        const url = process.env.PUBLIC_URL || `http://localhost:${this._port}`;
        return new Node("pvm-typescript", this.publicKey, url, "1.0.2", this.isValidator, lastBlock.index);
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
        await this.loadNodes();

        console.log("Bootstrapping...");
        console.log("args", args);
        args.includes("--reset") ? await this.resyncBlockchain() : await this.syncBlockchain();

        await this.syncMempool();

        const validatorInstance = getValidatorInstance();
        this.isValidator = await validatorInstance.isValidator(this.publicKey);

        await this.syncDeposits();

        // console.log("Polling...");
        const intervalId = setInterval(async () => {
            if (!this._started) {
                clearInterval(intervalId);
                // console.log("Polling stopped");
                return;
            }

            await this.mine();
            await this.findHighestTip();

            if (!this.synced) {
                await this.syncBlockchain();
            }
        }, 15000);

        this._started = true;
        console.log(`Server started on port ${this._port}`);
    }

    public async mine() {
        if (!this.isValidator) {
            // console.log("Not a validator, skipping mine");
            return;
        }

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

            // console.log(`Block mined: ${block.hash}`);

            // Broadcast the block hash to the network
            const me = await this.me();
            const nodes = await getBootNodes(
                me.url, 
                process.env.DEV_MODE === "true"
            );

            for (const node of nodes) {
                // console.log(`Broadcasting block hash to ${node.url}`);
                try {
                    const client = new NodeRpcClient(node.url, this.privateKey);
                    const blockDTO: BlockDTO = block.toJson();
                    const blockJSON = JSON.stringify(blockDTO);
                    await client.sendBlock(block.hash, blockJSON);
                } catch (error) {
                    console.warn(`Missing node ${node.url}`);
                }
            }
        } else {
            // console.log(`I ${this.publicKey} am not a validator, looking for ${validatorAddress}. Waiting for next block...`);
        }
    }

    private async loadNodes() {
        // console.log("Loading boot nodes...");
        let count = 0;
        if (this._nodes.size === 0) {
            const me: Node = await this.me();
            const nodes = await getBootNodes(
                me.url, 
                process.env.DEV_MODE === "true"
            );

            for (const node of nodes) {
                this._nodes.set(node.url, node);
                count++;
            }
        }
        // console.log(`Found ${count} nodes`);
    }

    private async syncMempool() {
        // console.log("Syncing mempool...");
        const mempool = getMempoolInstance();
    
        for (const [url, node] of this._nodes) {
            try {
                const client = new NodeRpcClient(
                    url, 
                    this.isValidator ? this.privateKey : "0x1111111111111111111111111111111111111111111111111111111111111111"
                );
                
                const otherMempool: TransactionDTO[] = await client.getMempool();
                // Add to own mempool
                await Promise.all(
                    otherMempool.map(async transaction => {
                        await mempool.add(Transaction.fromJson(transaction));
                    })
                );
    
            } catch (error) {
                console.error("Error connecting to node:", error);
                console.warn(`Missing node ${url}`);
            }
        }

        // await Promise.all(
        //     this._nodes.forEach(async node => {
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
        //             this._nodes
        //         }
        //     })

        // this._nodes.map(async node => {
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
        //         this._nodes
        //     }
        // })
        //);
    }

    private async purgeMempool() {
        // console.log("Purging mempool...");
        const mempool = getMempoolInstance();
        await mempool.purge();
    }

    private async syncDeposits() {
        // if (!this.isValidator) {
            console.log("Not a validator, skipping deposit sync");
        //     return;
        // }

        // console.log("Syncing deposits...");

        // Check if the last deposit sync was more than 1 hour ago
        const now = new Date();
        const diff = now.getTime() - this._lastDepositSync.getTime();

        if (diff < 3600000) {
            // console.log("Last deposit sync was less than 1 hour ago, skipping deposit sync");
            return;
        }

        if (this.isValidator) {
            const bridge = new Bridge(process.env.RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/uwae8IxsUFGbRFh8fagTMrGz1w5iuvpc");
    
              // First sync historical deposits
              await bridge.resync();
            
              // Then start listening for new deposits
              await bridge.listenToBridge();
            this._lastDepositSync = new Date();
        }
    }

    private async resyncBlockchain() {
        // console.log("Resyncing blockchain...");
        const blockchain = getBlockchainInstance();
        await blockchain.reset();
        await this.syncBlockchain();
    }

    private async syncBlockchain() {
        this._syncing = true;

        if (this._nodes.size === 0) {
            // console.log("No nodes to sync with");
            this._syncing = false;
            this._synced = true;
            return;
        }

        // Get my current tip
        const blockchain = getBlockchainInstance();
        const lastBlock = await blockchain.getLastBlock();
        const tip = lastBlock.index;
        console.log(`My tip is ${tip}, syncing with other nodes...`);

        let highestNode: Node = Array.from(this._nodes.values())[0];
        let highestTip = 0;

        // create a map of nodes to their highest tip
        const nodeHeights = new Map<string, number>();

        // Find the highest tip
        for (const [url, node] of this._nodes) {
            try {
                const client = new NodeRpcClient(
                    url, 
                    this.isValidator ? this.privateKey : "0x1111111111111111111111111111111111111111111111111111111111111111"
                );
                
                console.log("Trying to connect to node:", node.url);
                const block = await client.getLastBlock();
                console.info(`Received block ${block.index} ${block.hash} from ${node.url}`);

                // Update the highest known tip
                if (block.index > highestTip) {
                    highestTip = block.index;
                    highestNode = node;
                }

                // Update the node height
                nodeHeights.set(node.url, block.index);

            } catch (error) {
                console.error("Error connecting to node:", error);
                console.warn(`Missing node ${url}`);
            }
        }

        if (highestTip === 0) {
            console.error("No nodes to sync with");
            this._syncing = false;
            this._synced = true;
            return;
        }

        const client = new NodeRpcClient(highestNode.url, this.privateKey);

        // Sync with the highest node
        for (let i = tip; i < highestTip; i++) {
            const blockDTO: BlockDTO = await client.getBlock(i);

            console.log(`Syncing block ${blockDTO.index} ${blockDTO.hash} from ${highestNode.url}`);
            
            if (blockDTO) {
                const block = Block.fromJson(blockDTO);

                if (!block.verify()) {
                    console.error(`Block ${block.hash} is invalid`);
                    continue;
                }

                console.log(`Adding block ${block.hash} to blockchain`);
                await blockchain.addBlock(block);
            }
        }
    }

    private async findHighestTip(): Promise<void> {
        const blockchain = getBlockchainInstance();
        const lastBlock = await blockchain.getLastBlock();
        const tip = lastBlock.index;

        let highestTip = 0;
        for (const [url, node] of this._nodes) {
            try {
                const client = new NodeRpcClient(
                    url, 
                    this.isValidator ? this.privateKey : "0x1111111111111111111111111111111111111111111111111111111111111111"
                );
                const block = await client.getLastBlock();
                if (block.index > highestTip) {
                    highestTip = block.index;
                }
            } catch (error) {
                console.warn(`Missing node ${url}`);
            }
        }

        this._synced = tip >= highestTip;
    }
}
