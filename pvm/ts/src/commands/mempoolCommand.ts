import { getInstance, Mempool } from "../core/mempool";
import { Transaction } from "../models";
import { TransactionDTO } from "../types/chain";

import { ICommand } from "./interfaces";

export class MempoolCommand implements ICommand<TransactionDTO[]> {

  private readonly mempool: Mempool;

  constructor() {
    this.mempool = getInstance();
  }

  public async execute(): Promise<TransactionDTO[]> {
    return this.mempool.get();
  }
}
