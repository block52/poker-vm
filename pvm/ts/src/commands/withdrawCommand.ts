import { KEYS, WithdrawResponse } from "@bitcoinbrisbane/block52";
import { ICommand, ISignedResponse } from "./interfaces";
import { AccountCommand } from "./accountCommand";
import { Contract, ethers, InterfaceAbi } from "ethers";
import { CONTRACT_ADDRESSES } from "../core/constants";
import { Transaction } from "../models/transaction";
import { getMempoolInstance, Mempool } from "../core/mempool";

export class WithdrawCommand implements ICommand<ISignedResponse<WithdrawResponse>> {

    private readonly accountCommand: AccountCommand = new AccountCommand(this.from, this.privateKey);
    // private readonly transactionManagement: ITransactionManagement;
    private readonly mempool: Mempool;
    private readonly bridge: Contract;
    private readonly underlyingAssetAbi: InterfaceAbi;
    
    /**
     * Creates a new WithdrawCommand instance.
     * @param from The address sending the funds.
     * @param receiver The address receiving the funds.
     * @param amount The amount of funds to withdraw.
     * @param nonce The nonce for the transaction.
     * @param privateKey The private key of the validator.
     */
    constructor(
        private readonly from: string,
        private readonly receiver: string,
        private readonly amount: bigint,
        private readonly nonce: number,
        private readonly privateKey: string
    ) {
        console.log(`Creating WithdrawCommand: from=${from}, receiver=${receiver}, amount=${amount}`);

        if (!privateKey) {
            throw new Error("Private key must be provided");
        }

        const bridgeAbi = ["function withdraw(uint256 amount, address receiver, bytes32 nonce, bytes calldata signature) external", "function underlying() view returns (address)"];
        this.underlyingAssetAbi = ["function decimals() view returns (uint8)"];
        this.bridge = new ethers.Contract(CONTRACT_ADDRESSES.bridgeAddress, bridgeAbi);

        this.mempool = getMempoolInstance();
        // this.transactionManagement = getTransactionInstance();
    }

    public async execute(): Promise<ISignedResponse<WithdrawResponse>> {
        if (!Number.isInteger(this.nonce) || this.nonce < 0) {
            throw new Error("Invalid nonce: must be a non-negative integer");
        }
        console.log(`Executing withdraw command...`);

        const accountResponse = await this.accountCommand.execute();
        const fromAccount = accountResponse.data;
        console.log(`Account balance for ${this.from}: ${fromAccount.balance} ${fromAccount.nonce}`);

        if (this.nonce !== fromAccount.nonce) {
            console.log(`Invalid nonce: expected=${fromAccount.nonce}, provided=${this.nonce}`);
            throw new Error("Invalid nonce");
        }

        if (this.amount > fromAccount.balance) {
            console.log(`Insufficient balance: required=${this.amount}, available=${fromAccount.balance}`);
            throw new Error("Insufficient balance");
        }

        // Create withdrawal signature
        const withdraw_nonce = ethers.id("unique_nonce");
        const messageHash = ethers.solidityPackedKeccak256(
            ["address", "uint256", "bytes32"],
            [this.receiver, this.amount, withdraw_nonce]
        );

        const validator = new ethers.Wallet(this.privateKey);
        const signature = await validator.signMessage(ethers.getBytes(messageHash));

        const params = new URLSearchParams();
        params.set(KEYS.AMOUNT, this.amount.toString());
        params.set(KEYS.RECEIVER, this.receiver);
        params.set(KEYS.WITHDRAW_NONCE, withdraw_nonce);
        params.set(KEYS.WITHDRAW_SIGNATURE, signature);

        const encodedData = params.toString();

        console.log("📝 Creating transaction...");
        const withdrawTx: Transaction = await Transaction.create(fromAccount.address, CONTRACT_ADDRESSES.bridgeAddress, this.amount, BigInt(this.nonce), this.privateKey, encodedData);

        console.log("📨 Sending to mempool...");
        await this.mempool.add(withdrawTx);

        const walletResponse = {
            from: this.from,
            to: this.receiver,
            amount: this.amount,
            nonce: this.nonce,
            privateKey: this.privateKey,
            withdrawNonce: withdraw_nonce,
            signature: signature
        }

        return signResult(walletResponse, this.privateKey);
    }
}