import { getServerInstance, Server } from "../core/server";
import { Node } from "../core/types";
import { AbstractCommand } from "./abstractSignedCommand";

export class MeCommand extends AbstractCommand<Node> {

  private readonly server: Server;

  constructor(privateKey: string) {
    super(privateKey);
    this.server = getServerInstance();
  }

  public async executeCommand(): Promise<Node> {
    const node = this.server.me();
    return node;
  }
}
