class Holdem {
  _maxPlayers = 9;
  _deck = [];
  _nextToAct = 0;

  _actions = ["fold", "check", "call", "bet", "raise"];

  constructor(maxPlayers) {
    this.players = [];
    this._maxPlayers = maxPlayers || 9;
  }

  addPlayer(player) {
    if (this.players.length >= _maxPlayers) {
      throw new Error("Table is full");
    }
    this.players.push(player);
  }

  getPlayers() {
    return this.players;
  }

  shuffle() {
    // Shuffle the deck
  }

  deal() {
    // Deal cards to players
    this.players.forEach((player) => {
      player.hand = ["2c", "3c"];
    });
  }

  performAction(player, action) {
    // Perform an action
  }
}
