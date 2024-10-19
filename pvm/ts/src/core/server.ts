import axios from "axios";
import { ethers } from "ethers";

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

    public async start() {
        // Start the server
        console.log("Server started");
    }

    public async stop() {
        // Stop the server
        console.log("Server stopped");
    }

    public async bootstrap() {
        const bootnodes = await axios.get("https://bootnodes.io");
        console.log("Server bootstrapped");
    }
}