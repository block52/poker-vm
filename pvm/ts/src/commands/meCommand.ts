import { getInstance, Server } from "../core/server";
import { Node } from "../core/types";
import { ICommand } from "./interfaces";

export class MeCommand implements ICommand<Node> {

  private readonly server: Server;

  constructor() {
    this.server = getInstance();
  }

  public async execute(): Promise<Node> {
    const node = this.server.me();
    return node;
  }
}
