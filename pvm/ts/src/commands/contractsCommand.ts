import { ethers } from "ethers";
import { ICommand } from "./interfaces";

export class ContractsCommand implements ICommand<string[]> {
  constructor() {
  }

  public async execute(): Promise<string[]> {
    const contracts = [ethers.ZeroAddress]
    return contracts;
  }
}
