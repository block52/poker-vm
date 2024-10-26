import { getServerInstance } from "../core/server";
import { ICommand } from "./interfaces";

export class StopServerCommand implements ICommand<boolean> {
    constructor() {}
    public async execute(): Promise<boolean> {
        const server = getServerInstance();
        await server.stop();
        return true;
    }
}