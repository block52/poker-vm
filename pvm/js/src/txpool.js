export class TxPool {
  _maxLength;

  constructor(maxLength = 1000) {
    this._transactions = [];
    this._maxLength = maxLength;
  }

  add(tx) {
    this._transactions.push(tx);
  }

  getTransactions() {
    return this._transactions;
  }

  clear() {
    this._transactions = [];
  }

  contains(tx) {
    const tx = this._transactions.find((t) => t.hash === tx.hash);
    return tx !== undefined;
  }
}