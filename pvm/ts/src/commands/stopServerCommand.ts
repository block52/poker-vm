import { getServerInstance } from "../core/server";
import { AbstractCommand } from "./abstractSignedCommand";

export class StopServerCommand extends AbstractCommand<boolean> {
    public async executeCommand(): Promise<boolean> {
        const server = getServerInstance();
        await server.stop();
        return true;
    }
}