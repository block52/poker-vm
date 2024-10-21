import axios from "axios";
import { ethers } from "ethers";
import { Node } from "./types";

export class Server {
    public readonly contractAddress: string;
    public readonly publicKey: string;
    readonly isValidator: boolean;

    constructor(private readonly privateKey: string = "") {
        const wallet = new ethers.Wallet(privateKey);
        this.publicKey = wallet.address;
        this.contractAddress = "";

        // Check if the public key is a validator
        this.isValidator = false;
    }

    public me(): Node {
        return {
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
        const bootnodes = await axios.get("https://raw.githubusercontent.com/block52/poker-vm/refs/heads/main/bootnodes.json");
        console.log("Server bootstrapped");
    }
}

const start = async () => {
    const server = new Server();
    await server.bootstrap();
    await server.start();
}

start();