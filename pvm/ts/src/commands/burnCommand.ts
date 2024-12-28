import { ethers, JsonRpcProvider, Contract, InterfaceAbi, ZeroAddress } from "ethers";
import { getMempoolInstance } from "../core/mempool";
import { Transaction, BurnResponse, NativeToken } from "../models";
import accounts from "../schema/accounts";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";
import { RandomCommand } from "./randomCommand";
import { createProvider } from "../core/provider";
import { CONTRACT_ADDRESSES } from "../core/constants";

export class BurnCommand implements ISignedCommand<BurnResponse> {
    private readonly randomCommand: RandomCommand;
    private readonly bridge: Contract;
    private readonly provider: JsonRpcProvider;
    private readonly signer: ethers.Wallet;
    private readonly burnFromWallet: ethers.Wallet;
    private readonly underlyingAssetAbi: InterfaceAbi;

    constructor(readonly burnFrom: string, readonly amount: bigint, readonly bridgeTo: string, private readonly privateKey: string) {
        if (!burnFrom) {
            throw new Error("Private key to burn from must be provided");
        }
        try {
            this.burnFromWallet = new ethers.Wallet(burnFrom);
        } catch {
            throw new Error("Invalid private key provided for account to burn from");
        }

        if (amount <= 0) {
            throw new Error("Amount must be greater than 0");
        }

        if (!ethers.isAddress(bridgeTo)) {
            throw new Error("Address to mint to must be provided");
        }

        if (!privateKey) {
            throw new Error("Private key must be provided");
        }

        this.amount = amount;
        this.bridgeTo = bridgeTo;
        this.privateKey = privateKey;
        this.randomCommand = new RandomCommand(32, "", this.privateKey);
        this.signer = new ethers.Wallet(privateKey);

        const bridgeAbi = ["function deposits(uint256) view returns (tuple(address account, uint256 amount))", "function underlying() view returns (address)"];
        this.underlyingAssetAbi = ["function decimals() view returns (uint8)"];

        // const baseRPCUrl = process.env.RPC_URL;
        // this.provider = new JsonRpcProvider(baseRPCUrl, undefined, {
        //     staticNetwork: true
        // });

        this.provider = createProvider(process.env.RPC_URL ?? "http://localhost:8545");
        this.bridge = new ethers.Contract(CONTRACT_ADDRESSES.bridgeAddress, bridgeAbi, this.provider);
    }

    public async execute(): Promise<ISignedResponse<BurnResponse>> {
        const account = await accounts.findOne({ address: this.burnFromWallet.address });
        if (!account) {
            throw new Error("Burn from account not found");
        }

        if (this.amount > account.balance) {
            throw new Error("Burn from account has insufficient funds");
        }

        const underlyingAssetAddress = await this.bridge.underlying();
        const underlyingAsset = new ethers.Contract(underlyingAssetAddress, this.underlyingAssetAbi, this.provider);
        const underlyingAssetDecimals = await underlyingAsset.decimals();
        const amountToMint = NativeToken.convertToDecimals(this.amount, underlyingAssetDecimals);

        const nonce = await this.randomCommand.execute();

        console.log(`Address to burn from: ${this.burnFromWallet.address}`);
        console.log(`Amount to burn: ${this.amount}`);
        console.log(`Amount to mint: ${amountToMint}`);
        console.log(`Address to bridge to: ${this.bridgeTo}`);
        console.log(`Nonce: 0x${nonce.data.toString("hex")}`);

        const hash = ethers.solidityPackedKeccak256(["address", "uint256", "bytes"], [this.bridgeTo, amountToMint, nonce.data]);
        console.log(`Hash: ${hash}`);
        const signature = await this.signer.signMessage(ethers.getBytes(hash));
        console.log(`Signed hash: ${signature}`);

        const burnTx: Transaction = Transaction.create(ethers.ZeroAddress, this.burnFromWallet.address, this.amount, this.privateKey);

        // Send to mempool
        const mempoolInstance = getMempoolInstance();
        await mempoolInstance.add(burnTx);

        const burnResponse = new BurnResponse(amountToMint, this.bridgeTo, nonce.data, signature, burnTx);

        // Should wait till transaction has been successfully mined before returning signature which allows minting
        return signResult(burnResponse, this.privateKey);
    }
}
