import { getServerInstance } from "../core/server";
import { AbstractCommand } from "./abstractSignedCommand";

export class StartServerCommand extends AbstractCommand<boolean> {
    public async executeCommand(): Promise<boolean> {
        const server = getServerInstance();
        await server.start();
        return true;
    }
}
