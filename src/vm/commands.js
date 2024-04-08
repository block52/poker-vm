const Account = require("./account");

const transferCommand = async (amount, to, from) => {
  const fromAccount = await Account.findOne({ address: from });

  if (!fromAccount) {
    throw new Error("Account not found");
  }

  if (fromAccount.balance < amount) {
    throw new Error("Insufficient funds");
  }

  const toAccount = await Account.findOne({ address: to });
  if (!toAccount) {
    const account = new Account({
      address: to,
      balance: amount,
    });
    await account.save();
  } else {
    toAccount.balance += amount;
    await toAccount.save();
  }

  console.log(`Sending ${amount} from ${from} to ${to}`);
};

export { transferCommand };
