import { AbstractCommand } from "./abstractSignedCommand";

export class GetNodesCommand extends AbstractCommand<[]> {
    constructor(privateKey: string) {
        super(privateKey);
    }

    public async executeCommand(): Promise<[]> {
        return [];
    }   
}
