import axios from "axios";
import { ethers } from "ethers";
import { Node } from "./types";
import { RPCMethods, RPCRequest } from "../types/rpc";

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
    return {
      client: "pvm-typescript",
      publicKey: this.publicKey,
      version: "1.0.0",
      isValidator: this.isValidator,
      url: "http://localhost:3000",
    };
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
    const bootnodes = await axios.get(
      "https://raw.githubusercontent.com/block52/poker-vm/refs/heads/main/bootnodes.json"
    );

    // // TODO: PARALLELIZE
    // for (const node of bootnodes.data) {
    //   let id = 1;
    //   const request: RPCRequest = {
    //     id: `${id}`,
    //     method: RPCMethods.GET_NODES,
    //     params: [],
    //     data: undefined,
    //   };

    //   const response = await axios.post(`${node.url}`, request);
    //   console.log(response.data);

    //   // Connect to the node
    //   console.log(`Connected to node ${node.publicKey}`);

    //   id += 1;
    // }

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

start();
