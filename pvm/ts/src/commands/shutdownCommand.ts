import { ICommand } from "./interfaces";

export class ShutdownCommand implements ICommand<boolean> {
    constructor(
        private readonly userName: string,
        private readonly password: string,
    ) { }

    public async execute(): Promise<boolean> {
        if (
            this.userName !== process.env.ADMIN_USERNAME ||
            this.password !== process.env.ADMIN_PASSWORD
        ) {
            return false;
        }
        console.log("Shutting down in 10 seconds...");
        setTimeout(() => {
            console.log("Shutting down...");
            process.exit(0);
        }, 10000);
        return true;
    }
}
