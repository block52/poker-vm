import { connectDB } from "../data/mongoConnection";

export abstract class StateManager {
    private readonly connectionString: string;

    constructor(connectionString: string = "mongodb://localhost:27017/pvm") {
        this.connectionString = connectionString;
    }

    async connect() {
        try {
            await connectDB.connect(this.connectionString);
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }
}
