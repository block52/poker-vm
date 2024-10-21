import { getMempoolInstance, Mempool } from "../core/mempool";
import { Block, Transaction } from "../models";

import { ICommand } from "./interfaces";

export class MineCommand implements ICommand<Block> {

  private readonly mempool: Mempool;


  constructor() {
    this.mempool = getMempoolInstance();
  }

  public async execute(): Promise<Block> {

    const txs = this.mempool.get();
    if (!txs.length) {
      throw new Error("No transactions in the mempool");
    }


    throw new Error("Method not implemented.");
  }
}
