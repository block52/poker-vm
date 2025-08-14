import { TransactionResponse } from "@bitcoinbrisbane/block52";
import { ICommand, ISignedResponse } from "./interfaces";
import { AccountCommand } from "./accountCommand";
import { Contract, ethers, InterfaceAbi } from "ethers";
import { CONTRACT_ADDRESSES } from "../core/constants";

export class WithdrawCommand implements ICommand<ISignedResponse<TransactionResponse>> {

    private readonly accountCommand: AccountCommand = new AccountCommand(this.from, this.privateKey);
    private readonly bridge: Contract;
    private readonly underlyingAssetAbi: InterfaceAbi;
    
    /**
     * Creates a new WithdrawCommand instance.
     * @param from The address sending the funds.
     * @param to The address receiving the funds.
     * @param amount The amount of funds to transfer.
     * @param nonce The nonce for the transaction.
     * @param privateKey The private key of the sender's account.
     */
    constructor(
        private readonly from: string,
        private readonly to: string,
        private readonly amount: bigint,
        private readonly nonce: number,
        private readonly privateKey: string
    ) {
        console.log(`Creating WithdrawCommand: from=${from}, to=${to}, amount=${amount}`);

        if (!privateKey) {
            throw new Error("Private key must be provided");
        }

        const bridgeAbi = ["function deposits(uint256) view returns (address account, uint256 amount)", "function underlying() view returns (address)"];
        this.underlyingAssetAbi = ["function decimals() view returns (uint8)"];
        this.bridge = new ethers.Contract(CONTRACT_ADDRESSES.bridgeAddress, bridgeAbi, this.provider);
    }

    public async execute(): Promise<ISignedResponse<TransactionResponse>> {
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

        // const transaction = new Transaction(
        //     this.from,
        //     this.to,
        //     this.amount,
        //     this.nonce,
        //     KEYS.WITHDRAW_ACTION,
        //     PlayerActionType.WITHDRAW
        // );

        // const performActionCommand = new PerformActionCommandWithResult(
        //     transaction,
        //     this.privateKey
        // );

        // const signedResponse = await performActionCommand.execute();
        // return signResult(signedResponse, this.privateKey);

        throw new Error("WithdrawCommand is not yet implemented");
    }
}