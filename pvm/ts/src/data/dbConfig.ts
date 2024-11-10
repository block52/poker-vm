import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const uri = process.env.DB_URL || "mongodb://localhost:27017/pvm";
        await mongoose.connect(uri);
        console.log(`MongoDB connected to ${uri}`);
    } catch (error) {
        process.exit(1);
    }
};

module.exports = connectDB;