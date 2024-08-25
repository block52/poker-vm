class GameState {
    constructor(index, previous_hash, timestamp, validator) {
      this.index = index;
      this.previous_hash = previous_hash;
      this.timestamp = timestamp;
      this.validator = validator;
    }
  
    hash() {
      this.hash = this.calculateHash();
    }
  
    calculateHash() {
      const json = JSON.stringify(this);
      // flatten the json
  
      // hash the json
      return crypto.createHash("SHA256").update(json).digest("hex");
    }
  }
  
  module.exports = GameState;
  