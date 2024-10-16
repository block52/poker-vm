import mongoose from "mongoose";

const { Schema } = mongoose;

class Account {
  constructor() {
    const accountSchema = new Schema(
      {
        address: {
          required: true,
          type: String,
        },
        balance: {
          required: true,
          type: Number, // BigInt
        },
        nonce: {
          required: true,
          type: Number,
        },
      },
      {
        timestamps: true,
      }
    );

    this.AccountModel = mongoose.model("Account", accountSchema);
  }

  getModel() {
    return this.AccountModel;
  }
}

export default Account;
