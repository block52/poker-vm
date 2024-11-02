import { ethers, JsonRpcProvider } from "ethers";
import { getMempoolInstance } from "../core/mempool";
import { Transaction } from "../models";
import accounts from "../schema/accounts";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { randomBytes } from "crypto";

export class BurnCommand implements ISignedCommand<Transaction> {
    private readonly publicKey: string;
    public readonly BridgeAddress = "0xD6c2f28c18Ca44a1199416458e1735F564812F1c";

    constructor(readonly receiver: string, readonly amount: bigint, private readonly privateKey: string) {
        if (amount <= 0) {
            throw new Error("Amount must be greater than 0");
        }

        if (!receiver) {
            throw new Error("Receiver must be provided");
        }

        if (!privateKey) {
            throw new Error("Private key must be provided");
        }

        this.receiver = receiver;
        this.amount = amount;
        this.privateKey = privateKey;
        const signer = new ethers.Wallet(privateKey);
        this.publicKey = signer.address;
    }

    public async execute(): Promise<ISignedResponse<Transaction>> {
        // Minting logic
        // Check tx hash is in the staking mainnet contract and has not be validated
        // If we're a validator, we can mint
        // Check the DB for the tx hash
        // If it's not in the DB, mint
        const account = await accounts.findOne({ address: this.receiver });
        if (account) {
            // return signResult(Transaction.fromDocument(existingTx), this.privateKey);
            // throw new Exception();
        }

        if (this.amount > Number(account?.balance)) {
            // throw ...
        }

        const abi = ["function withdraw(uint256 amount, address to, bytes32 nonce, bytes calldata signature)"];
        const nonce = randomBytes(32); // use random command

        const baseRPCUrl = process.env.RPC_URL;
        const provider = new JsonRpcProvider(baseRPCUrl, undefined, {
            staticNetwork: true
        });

        const bridge = new ethers.Contract(this.BridgeAddress, abi, provider);

        const tx = await bridge.withdraw(this.amount, this.receiver, nonce.toString("hex"))
        const burnTx: Transaction = Transaction.create(this.BridgeAddress, this.publicKey, this.amount, this.privateKey);

        // Send to mempool
        const mempoolInstance = getMempoolInstance();
        await mempoolInstance.add(burnTx);
        return signResult(burnTx, this.privateKey);
    }
}
