class TxPool {
  _maxLength;

  constructor(maxLength = 1000) {
    this._transactions = [];
    this._maxLength = maxLength;
  }

  add(tx) {
    // throw if over the limit

    if (this._transactions.length >= this._maxLength) {
      throw new Error("Transaction pool is full");
    }

    if (this.contains(tx)) {
      throw new Error("Transaction already in pool");
    }

    this._transactions.push(tx);
  }

  getTransactions() {
    return this._transactions;
  }

  clear() {
    this._transactions = [];
  }

  contains(tx) {
    const _tx = this._transactions.find((t) => t.hash === tx.hash);
    return _tx !== undefined;
  }
}

export default TxPool;