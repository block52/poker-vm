import { KEYS, WithdrawResponseDTO } from "@bitcoinbrisbane/block52";
import { ICommand, ISignedResponse } from "./interfaces";
import { AccountCommand } from "./accountCommand";
import { Contract, ethers, InterfaceAbi, Wallet } from "ethers";
import { CONTRACT_ADDRESSES } from "../core/constants";
import { Transaction } from "../models/transaction";
import { getMempoolInstance, Mempool } from "../core/mempool";
import { signResult } from "./abstractSignedCommand";

export class WithdrawCommand implements ICommand<ISignedResponse<WithdrawResponseDTO>> {

    private readonly accountCommand: AccountCommand = new AccountCommand(this.from, this.privateKey);
    private readonly mempool: Mempool;
    
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

        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<WithdrawResponseDTO>> {
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

        const walletResponse: WithdrawResponseDTO = {
            nonce: withdraw_nonce,
            receiver: this.receiver,
            amount: this.amount.toString(),
            signature: signature,
            timestamp: Date.now().toString(),
            withdrawSignature: signature,
        }

        return signResult(walletResponse, this.privateKey);
    }
}