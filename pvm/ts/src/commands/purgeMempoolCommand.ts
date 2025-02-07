import { getMempoolInstance, Mempool } from "../core/mempool";
import { ICommand } from "./interfaces";

export class PurgeMempoolCommand implements ICommand<boolean> {
    private readonly mempool: Mempool;

    constructor(private readonly userName: string, private readonly password: string) {
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<boolean> {
        if (
            this.userName !== process.env.ADMIN_USERNAME ||
            this.password !== process.env.ADMIN_PASSWORD
        ) {
            return false;
        }
        this.mempool.clear();
        return true;
    }
}
