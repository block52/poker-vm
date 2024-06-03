const Account = require("../schemas/account");

class AccountState {
  async createAccount(address) {
    const query = { address };
    const account = await Account.findOne(query);

    if (account) {
      return account;
    }

    const new_account = new Account({
      address,
      balance: 0,
    });

    await new_account.save();
    return new_account;
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

  async transfer(from, to, amount) {
    const from_account = await this.getAccount(from);
    const to_account = await this.getAccount(to);

    if (from_account.balance < amount) {
      return null;
    }

    from_account.balance -= amount;
    to_account.balance += amount;

    await from_account.save();
    await to_account.save();

    return { from: from_account, to: to_account, amount };
  }
}

module.exports = AccountState;