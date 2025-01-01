import { ethers, JsonRpcProvider, Contract, InterfaceAbi, ZeroAddress } from "ethers";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models/transaction";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { NativeToken } from "../models/nativeToken";
import { createProvider } from "../core/provider";
import { CONTRACT_ADDRESSES } from "../core/constants";
import { TransactionManagement, getTransactionInstance } from "../state/transactionManagement";

export class MintCommand implements ISignedCommand<Transaction> {
    private readonly publicKey: string;
    private readonly provider: JsonRpcProvider;
    private readonly bridge: Contract;
    private readonly underlyingAssetAbi: InterfaceAbi;
    private readonly index: bigint;
    private readonly transactionManagement: TransactionManagement;
    private readonly mempool: Mempool;

    constructor(readonly depositIndex: string, readonly hash: string, private readonly privateKey: string) {
        if (!depositIndex) {
            throw new Error("Deposit index must be provided");
        }

        if (!privateKey) {
            throw new Error("Private key must be provided");
        }

        this.depositIndex = depositIndex;
        this.index = BigInt(depositIndex);
        const signer = new ethers.Wallet(privateKey);
        this.publicKey = signer.address;

        const bridgeAbi = ["function deposits(uint256) view returns (address account, uint256 amount)", "function underlying() view returns (address)"];
        this.underlyingAssetAbi = ["function decimals() view returns (uint8)"];

        // const baseRPCUrl = process.env.RPC_URL;
        // this.provider = new JsonRpcProvider(baseRPCUrl, undefined, {
        //     staticNetwork: true
        // });
        
        this.mempool = getMempoolInstance();
        this.transactionManagement = getTransactionInstance();

        this.provider = createProvider(process.env.RPC_URL ?? "http://localhost:8545");
        this.bridge = new ethers.Contract(CONTRACT_ADDRESSES.bridgeAddress, bridgeAbi, this.provider);
    }

    public async execute(): Promise<ISignedResponse<Transaction>> {
        // Minting logic
        // Check tx hash is in the staking mainnet contract and has not be validated
        // If we're a validator, we can mint
        // Check the DB for the tx hash
        // If it's not in the DB, mint

        // const existingTx = await Blocks.findOne({ transactions: { $elemMatch: { identifier: this.depositIndex } } });
        // console.log(existingTx);
        // if (existingTx) {
        //     return signResult(Transaction.fromDocument(existingTx), this.privateKey);
        // }

        // TODO: Get txId from bridge contract event
        // const data = this.hash;
        const data = `MINT_${this.depositIndex}`;
        const exists = await this.transactionManagement.exists(data);
        if (exists) {
            throw new Error("Transaction already in blockchain");
        }

        const [receiver, amount] = await this.bridge.deposits(this.index);
        if (receiver === ethers.ZeroAddress) {
            throw new Error("Receiver must not be zero address");
        }

        if (amount <= 0) {
            throw new Error("Value must be greater than 0");
        }

        let underlyingAssetDecimals: bigint = 6n;

        const useCached = true;
        if (!useCached) {
            const underlyingAssetAddress = await this.bridge.underlying();
            const underlyingAsset = new ethers.Contract(underlyingAssetAddress, this.underlyingAssetAbi, this.provider);
            underlyingAssetDecimals = await underlyingAsset.decimals();
        }

        const value: bigint = NativeToken.convertFromDecimals(amount, underlyingAssetDecimals);
        const mintTx: Transaction = Transaction.create(receiver, this.publicKey, value, this.index, this.privateKey, data);

        // Send to mempool
        await this.mempool.add(mintTx);
        return signResult(mintTx, this.privateKey);
    }
}
