const mongoose = require("mongoose");
require("dotenv").config();

const FALLBACK_URI = "mongodb+srv://node1:7e0Kc3EIU4sl2651@db-mongodb-syd1-41573-30ceb254.mongo.ondigitalocean.com/pvm?tls=true&authSource=admin&replicaSet=db-mongodb-syd1-41573";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || FALLBACK_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
