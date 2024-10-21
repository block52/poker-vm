import { ethers } from "ethers";
import { getInstance, Server } from "../core/server";
import { ICommand } from "./interfaces";

export class ContractsCommand implements ICommand<string[]> {

  private readonly server: Server;

  constructor() {
    this.server = getInstance();
  }

  public async execute(): Promise<string[]> {
    const contracts = [ethers.ZeroAddress]
    return contracts;
  }
}
