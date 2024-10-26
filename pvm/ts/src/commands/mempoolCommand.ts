import { getMempoolInstance, Mempool } from "../core/mempool";
import { MempoolTransactions } from "../models/mempoolTransactions";
import { AbstractCommand } from "./abstractSignedCommand";

export class MempoolCommand extends AbstractCommand<MempoolTransactions> {

  private readonly mempool: Mempool;

  constructor(privateKey: string) {
    super(privateKey);
    this.mempool = getMempoolInstance();
  }

  public async executeCommand(): Promise<MempoolTransactions> {
    return new MempoolTransactions(this.mempool.get());
  }
}

