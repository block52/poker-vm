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

  async createAccount(address) {
    const query = { address };
    const account = await this.AccountModel.findOne(query);

    if (account) {
      return account;
    }

    const new_account = new this.AccountModel({
      address,
      balance: 0,
      nonce: 0,
    });
  }

  async addBalance(address, amount) {
    if (amount < 0) {
      throw new Error("Amount must be positive");
    }

    let account = await this.getAccount(address);

    if (!account) {
      account = await this.createAccount(address);
    }

    account.balance += amount;
    await account.save();

    return account;
  }
}

export default Account;
