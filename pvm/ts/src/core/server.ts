import axios from "axios";
import { ethers, id } from "ethers";
import { Node } from "./types";
import { RPCMethods, RPCRequest, RPCResponse } from "../types/rpc";
import fs from "fs";
import { getMempoolInstance } from "./mempool";
import { Transaction } from "../models";
import { MempoolTransactions } from "../models/mempoolTransactions";
import { TransactionDTO } from "../types/chain";

export class Server {
    public readonly contractAddress: string;
    public readonly publicKey: string;
    private readonly isValidator: boolean;
    private readonly Nodes: Node[] = [];

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

    public async mine() {
        // Mine a block
        console.log("Block mined");
    }

    public async start() {
        // Start the server
        console.log("Server started");
    }

    public async stop() {
        // Stop the server
        console.log("Server stopped");
    }

    public async bootstrap() {
        const response = await axios.get(
            "https://raw.githubusercontent.com/block52/poker-vm/refs/heads/main/bootnodes.json"
        );
        const bootNodeUrls = response.data as string[];
        const mempool = getMempoolInstance();
        // Get own node
        const ownNode = this.me();

        // Get all nodes except own node
        const nodeUrls = bootNodeUrls.filter((url) => url !== ownNode.url);
        let id = 0;

        setInterval(async () => {
          console.log("Polling...");
       
          for (const url of nodeUrls) {
              const request: RPCRequest = {
                  id: `${nodeUrls.indexOf(url) + 1}`,
                  method: RPCMethods.GET_MEMPOOL,
                  params: [],
                  data: undefined,
              };

              try {
                const response = await axios.post(`${url}`, request);
                const data = response.data as RPCResponse<TransactionDTO[]>
                const otherMempool = data.result as TransactionDTO[]

                // Add to own mempool
                for (const transaction of otherMempool) {
                    mempool.add(Transaction.fromJson(transaction));
                }

                id += 1;
              } catch (error) {
                console.warn(`Missing node ${url}`);
              }

            }
        }, 10000);

        console.log("Server bootstrapped");
    }
}

let instance: Server;
export const getInstance = () => {
    if (!instance) {
        instance = new Server();
    }
    return instance;
};

const start = async () => {
    const server = new Server();
    await server.bootstrap();
    await server.start();
};

// start();
