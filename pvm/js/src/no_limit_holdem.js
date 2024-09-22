
// This should be a concrete class that implements the game engine interface

class NoLimitHoldem {
  constructor(contract, instance) {
    this.contract = contract;
    this.instance = instance;
  }

  async loadState() {
    // Get the tip of the game from the db
  }

  nextAction() {
    // Get the next action from the player
  }

  async processAction(action) {
    // Process the action
  }

  players() {
    // Get the players
  }
}
