
// This should be a concrete class that implements the game engine interface

class NoLimitHoldem {
  constructor(contract, instance) {
    this.contract = contract;
    this.instance = instance;
  }

  async loadState() {
    // Get the tip of the game from the db
  }
}
