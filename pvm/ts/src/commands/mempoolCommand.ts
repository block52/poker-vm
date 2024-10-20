import { Transaction } from "../models";

import { ICommand } from "./interfaces";

export class MempoolCommand implements ICommand<Transaction> {

  constructor() {

  }

  public async execute(): Promise<Transaction> {

  }
}
