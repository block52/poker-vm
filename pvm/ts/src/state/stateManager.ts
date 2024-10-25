import mongoose from "mongoose";

export abstract class StateManager {
  constructor(
    readonly connectionString: string
  ) {

    if (!connectionString) {
      throw new Error("Connection string is required");
    }
  }

  async connect() {
    try {
      await mongoose.connect(this.connectionString);
      console.log(`MongoDB connected to ${this.connectionString}`);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }
}
