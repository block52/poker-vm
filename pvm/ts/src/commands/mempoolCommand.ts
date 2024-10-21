import { getInstance, Mempool, MempoolTransactions } from "../core/mempool";
import { Transaction } from "../models";
import { IJSONModel } from "../models/interfaces";
import { TransactionDTO } from "../types/chain";

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

