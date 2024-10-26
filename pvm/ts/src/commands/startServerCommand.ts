import { getServerInstance } from "../core/server";
import { ICommand } from "./interfaces";

export class StartServerCommand implements ICommand<boolean> {
    public async execute(): Promise<boolean> {
        const server = getServerInstance();
        await server.start();
        return true;
    }
}
