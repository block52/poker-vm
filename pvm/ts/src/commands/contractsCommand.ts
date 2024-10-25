import { ethers } from "ethers";
import { ICommand } from "./interfaces";
import { AbstractCommand } from "./abstractSignedCommand";

export class ContractsCommand extends AbstractCommand<string[]> {
  constructor(privateKey: string) {
    super(privateKey);
  }

  public async executeCommand(): Promise<string[]> {
    const contracts = [ethers.ZeroAddress]
    return contracts;
  }
}
