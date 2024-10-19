import mongoose from "mongoose";

export abstract class StateManager {
  constructor(
    readonly connectionString: string = "mongodb://localhost:27017/pvm"
  ) {}

  async connect() {
    try {
      // const uri = process.env.MONGO_URI || "mongodb://localhost:27017/pvm";
      await mongoose.connect(this.connectionString);
      console.log("MongoDB connected");
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }
}
