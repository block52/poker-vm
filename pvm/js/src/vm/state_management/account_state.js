const Account = require("../../schemas/account");

class AccountState {
  // constructor (mempool) {
  //   this.mempool = mempool;
  // }
  async createAccount(address) {
    const query = { address };
    const account = await Account.findOne(query);

    if (account) {
      return account;
    }

    const new_account = new Account({
      address,
      balance: 0,
      nonce: 0,
    });

    await new_account.save();
    return new_account;
  }

  async addBalance(address, amount) {
    let account = await this.getAccount(address);

    if (!account) {
      account = await this.createAccount(address);
    }

    account.balance += amount;
    await account.save();

    return account;
  }

  async getAccount(address) {
    const query = { address };
    const result = await Account.findOne(query);
    return result;
  }

  async getBalance(address) {
    const account = await this.getAccount(address);

    if (!account) {
      return 0;
    }

    return account.balance;
  }

  async nonce(address) {
    const account = await this.getAccount(address);

    if (!account) {
      // create account
      await this.createAccount(address);
      return 0;
    }

    return account.nonce;
  }

  async transfer(from, to, amount) {
    const from_account = await this.getAccount(from);
    const to_account = await this.getAccount(to);

    if (from_account.balance < amount) {
      throw new Error("Insufficient funds");
    }

    from_account.balance -= amount;
    from_account.nonce += 1;
    to_account.balance += amount;

    await from_account.save();
    await to_account.save();

    return { from: from_account, to: to_account, amount };
  }
}

module.exports = AccountState;
