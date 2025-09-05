import { connectDB } from "../data/mongoConnection";

export abstract class StateManager {

    constructor(protected readonly connString: string) {
    }

    async connect() {
        try {
            await connectDB.connect(this.connString);
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }
}
