const crypto = require("crypto");

// Core transaction
class Transaction {
  // Convert rpc call to transaction object
  constructor(to, data, value, from, signature, nonce) {
    this.to = to;
    this.data = data;
    this.value = value;
    this.from = from;
    this.signature = signature;
    this.nonce = nonce;

    this.hash = this.getHash();
  }

  getHash() {
    const tx = {
      to: this.to,
      data: this.data,
      value: this.value,
      from: this.from,
      nonce: this.nonce,
    };

    const txString = JSON.stringify(tx);
    const hash = crypto.createHash("sha256");
    hash.update(txString);
    const _hash = hash.digest("hex");
    return _hash;
  }

  sign(privateKey) {
    // sign transaction

    // get public key from private key
    // this.from = "0x" + crypto.createHash("sha256").update(privateKey).digest("hex");
  }

  verify() {
    return true;
  }
}

module.exports = Transaction;
