const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const uri = process.env.DB_URL || "mongodb://localhost:27017/pvm";

const initConnection = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
  }

  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));

  return db;
};

module.exports = { initConnection };