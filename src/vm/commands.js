const Account = require("./account");

const sendCommand = (amount, to, from) => {
  const fromAccount = Account.findOne({ address: from });

  if (!fromAccount) {
    throw new Error("Account not found");
  }

  if (fromAccount.balance < amount) {
    throw new Error("Insufficient funds");
  }

  console.log(`Sending ${amount} from ${from} to ${to}`);
};

export { sendCommand };
