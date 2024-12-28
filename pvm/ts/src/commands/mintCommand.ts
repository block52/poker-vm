import { ethers, JsonRpcProvider, Contract, InterfaceAbi, ZeroAddress } from "ethers";
import { getMempoolInstance } from "../core/mempool";
import { Transaction } from "../models/transaction";
// import Blocks from "../schema/transactions";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { NativeToken } from "../models/nativeToken";
import { createProvider } from "../core/provider";

export class MintCommand implements ISignedCommand<Transaction> {
    private readonly publicKey: string;
    private readonly provider: JsonRpcProvider;
    private readonly bridge: Contract;
    private readonly underlyingAssetAbi: InterfaceAbi;
    // private readonly depositIndex: BigInt;

    constructor(readonly depositIndex: string, private readonly privateKey: string) {
        if (!depositIndex) {
            throw new Error("Deposit index must be provided");
        }

        if (!privateKey) {
            throw new Error("Private key must be provided");
        }

        this.depositIndex = depositIndex;
        const signer = new ethers.Wallet(privateKey);
        this.publicKey = signer.address;

        const bridgeAbi = ["function deposits(uint256) view returns (tuple(address account, uint256 amount))", "function underlying() view returns (address)"];
        this.underlyingAssetAbi = ["function decimals() view returns (uint8)"];

        // const baseRPCUrl = process.env.RPC_URL;
        // this.provider = new JsonRpcProvider(baseRPCUrl, undefined, {
        //     staticNetwork: true
        // });
        
        this.provider = createProvider();
        this.bridge = new ethers.Contract(process.env.BRIDGE_CONTRACT_ADDRESS ?? ZeroAddress, bridgeAbi, this.provider);
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

        const [receiver, amount] = await this.bridge.deposits(this.depositIndex);
        const underlyingAssetAddress = await this.bridge.underlying();
        
        const underlyingAsset = new ethers.Contract(underlyingAssetAddress, this.underlyingAssetAbi, this.provider);
        const underlyingAssetDecimals = await underlyingAsset.decimals();

        const amountToMint = NativeToken.convertFromDecimals(amount, underlyingAssetDecimals);

        if (receiver === ethers.ZeroAddress) {
            throw new Error("Receiver must not be zero address");
        }

        if (amount <= 0) {
            throw new Error("Amount must be greater than 0");
        }

        const mintTx: Transaction = Transaction.create(receiver, this.publicKey, amountToMint, this.privateKey);

        // Send to mempool
        const mempoolInstance = getMempoolInstance();
        await mempoolInstance.add(mintTx);
        return signResult(mintTx, this.privateKey);
    }
}
