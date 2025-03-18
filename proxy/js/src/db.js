const mongoose = require("mongoose");
require("dotenv").config();

const FALLBACK_URI = "mongodb://localhost:27017/payments";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || FALLBACK_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
