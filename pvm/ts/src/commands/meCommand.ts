import { getServerInstance, Server } from "../core/server";
import { Node } from "../core/types";
import { ICommand } from "./interfaces";

export class MeCommand implements ICommand<Node> {

  private readonly server: Server;

  constructor() {
    this.server = getServerInstance();
  }

  public async execute(): Promise<Node> {
    const node = this.server.me();
    return node;
  }
}
