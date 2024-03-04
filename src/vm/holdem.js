class Table {
  _maxPlayers = 9;
  _deck = [];

  constructor(maxPlayers) {
    this.players = [];
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
}
