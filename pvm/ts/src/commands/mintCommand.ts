import { ethers, JsonRpcProvider, Contract, InterfaceAbi, ZeroAddress } from "ethers";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models/transaction";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { NativeToken } from "../models/nativeToken";
import { createProvider } from "../core/provider";
import { CONTRACT_ADDRESSES } from "../core/constants";
import { getTransactionInstance } from "../state/index";
import { ITransactionManagement } from "../state/interfaces";

export class MintCommand implements ISignedCommand<Transaction> {
    private readonly publicKey: string;
    private readonly provider: JsonRpcProvider;
    private readonly bridge: Contract;
    private readonly underlyingAssetAbi: InterfaceAbi;
    private readonly index: bigint;
    private readonly transactionManagement: ITransactionManagement;
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

        this.provider = createProvider(process.env.RPC_URL ?? "https://eth-mainnet.g.alchemy.com/v2/uwae8IxsUFGbRFh8fagTMrGz1w5iuvpc");
        this.bridge = new ethers.Contract(CONTRACT_ADDRESSES.bridgeAddress, bridgeAbi, this.provider);
    }

    public async execute(): Promise<ISignedResponse<Transaction>> {
        // Minting logic
        // Check tx hash is in the staking mainnet contract and has not be validated
        // If we're a validator, we can mint
        // Check the DB for the tx hash
        // If it's not in the DB, mint
        console.log("\n🎬 MintCommand Execute Started:", {
            depositIndex: this.depositIndex,
            hash: this.hash,
            publicKey: this.publicKey
        });

        // TODO: Get txId from bridge contract event
        // const data = this.hash;
        const data = `MINT_${this.depositIndex}`;
        console.log("📝 Checking for existing transaction with data:", data);
        const exists = await this.transactionManagement.getTransactionByData(data);

        if (exists) {
            console.log("ℹ️ Transaction already exists in blockchain, returning existing transaction");
            // Return the existing transaction instead of throwing an error
            return signResult(exists, this.privateKey);
        }

        console.log("🔍 Fetching deposit details from bridge contract...");
        const [account, amount] = await this.bridge.deposits(this.index);
        if (account === ethers.ZeroAddress) {
            throw new Error("Receiver must not be zero address");
        }

        if (amount <= 0) {
            throw new Error("Value must be greater than 0");
        }
        console.log("📊 Deposit Details:", {
            account,
            amount: {
                raw: amount.toString(),
                hex: `0x${amount.toString(16)}`,
                usdc: Number(amount) / 1e6
            }
        });

        let underlyingAssetDecimals: bigint = 6n;

        const useCached = true;
        if (!useCached) {
            const underlyingAssetAddress = await this.bridge.underlying();
            const underlyingAsset = new ethers.Contract(underlyingAssetAddress, this.underlyingAssetAbi, this.provider);
            underlyingAssetDecimals = await underlyingAsset.decimals();
        }
        const value: bigint = NativeToken.convertFromDecimals(amount, 6n);
        console.log("💰 Converted value:", {
            original: amount.toString(),
            converted: value.toString(),
            asTokens: Number(value) / 1e18
        });

        console.log("📝 Creating transaction...");
        const mintTx: Transaction = await Transaction.create(account, CONTRACT_ADDRESSES.bridgeAddress, value, this.index, this.privateKey, data);

        console.log("📨 Sending to mempool...");
        await this.mempool.add(mintTx);

        console.log("✅ MintCommand execution complete");
        return signResult(mintTx, this.privateKey);
    }
}
