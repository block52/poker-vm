const crypto = require("crypto");

// Core transaction
export class Transaction {
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

  verify() {
    return true;
  }
}
