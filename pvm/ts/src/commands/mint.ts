import { ICommand } from "./interfaces";

class Mint implements ICommand<string> {
    constructor(readonly receiver: string, readonly amount: number, readonly tx: string) {
        if (amount <= 0) {
            throw new Error("Amount must be greater than 0");
        }

        if (!receiver) {
            throw new Error("Receiver must be provided");
        }

        if (!tx) {
            throw new Error("Public key must be provided");
        }

        this.receiver = receiver;
        this.amount = amount;
        this.tx = tx;
    }

    public async execute(): Promise<string> {
        // Minting logic
        // Check tx hash is in the staking mainnet contract and has not be validated

        // If we're a validator, we can mint

        // Update the account balance via the account manager
        console.log("Minting...");
        return "Minted!";
    }
}

export default Mint;