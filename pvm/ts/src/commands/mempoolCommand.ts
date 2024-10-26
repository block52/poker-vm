import { getMempoolInstance, Mempool } from "../core/mempool";
import { MempoolTransactions } from "../models/mempoolTransactions";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class MempoolCommand implements ISignedCommand<MempoolTransactions> {
    private readonly mempool: Mempool;

    constructor(private readonly privateKey: string) {
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<MempoolTransactions>> {
        return signResult(
            new MempoolTransactions(this.mempool.get()),
            this.privateKey
        );
    }
}
