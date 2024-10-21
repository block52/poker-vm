import { getInstance, Mempool } from "../core/mempool";
import { MempoolTransactions } from "../models/mempoolTransactions";
import { ICommand } from "./interfaces";

export class MempoolCommand implements ICommand<MempoolTransactions> {

  private readonly mempool: Mempool;

  constructor() {
    this.mempool = getInstance();
  }

  public async execute(): Promise<MempoolTransactions> {
    return new MempoolTransactions(this.mempool.get());
  }
}

