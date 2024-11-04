import { ethers, JsonRpcProvider } from "ethers";
import { getMempoolInstance } from "../core/mempool";
import { Transaction } from "../models/transaction";
import transactions from "../schema/transactions";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class MintCommand implements ISignedCommand<Transaction> {
    public readonly BridgeAddress = "0xD6c2f28c18Ca44a1199416458e1735F564812F1c";
    private readonly publicKey: string;

    constructor(
        readonly receiver: string,
        readonly amount: bigint,
        readonly nonce: string,
        private readonly privateKey: string
    ) {
        if (amount <= 0) {
            throw new Error("Amount must be greater than 0");
        }

        if (!receiver) {
            throw new Error("Receiver must be provided");
        }

        if (!nonce) {
            throw new Error("Nonce must be provided");
        }

        if (!privateKey) {
            throw new Error("Private key must be provided");
        }

        this.receiver = receiver;
        this.amount = amount;
        this.nonce = nonce
        const signer = new ethers.Wallet(privateKey);
        this.publicKey = signer.address;
    }

    public async execute(): Promise<ISignedResponse<Transaction>> {
        // Minting logic
        // Check tx hash is in the staking mainnet contract and has not be validated
        // If we're a validator, we can mint
        // Check the DB for the tx hash
        // If it's not in the DB, mint

        const existingTx = await transactions.findOne({ hash: this.transactionId });
        if (existingTx) {
            return signResult(Transaction.fromDocument(existingTx), this.privateKey);
        }

        // Get amount from the event and check it matches the amount in the transaction
        const abi = [
            "event Deposited(address indexed account, uint256 amount, uint256 index)"
        ];

        const baseRPCUrl = process.env.RPC_URL;
        const provider = new JsonRpcProvider(baseRPCUrl, undefined, {
            staticNetwork: true
        });

        const bridge = new ethers.Contract(this.BridgeAddress, abi, provider);
        const filter = bridge.filters.Deposited(this.transactionId);

        const logs = await provider.getLogs({
            ...filter,
            fromBlock: 0,
            toBlock: "latest"
        });

        const mintTx: Transaction = Transaction.create(this.receiver, this.publicKey, this.amount, this.privateKey);

        // Send to mempool
        const mempoolInstance = getMempoolInstance();
        await mempoolInstance.add(mintTx);
        return signResult(mintTx, this.privateKey);
    }
}
