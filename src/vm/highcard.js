class Highcard {
  _maxPlayers = 2;
  _deck = [];
  _nextToAct = 0;

  _actions = ["cut"];

  constructor() {
    this.players = [];
    this._maxPlayers = 2;

    this._deck = [
        'AC', '2C', '3C', '4C', '5C', '6C', '7C', '8C', '9C', '10C', 'JC', 'QC', 'KC',
        'AD', '2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', '10D', 'JD', 'QD', 'KD',
        'AH', '2H', '3H', '4H', '5H', '6H', '7H', '8H', '9H', '10H', 'JH', 'QH', 'KH',
        'AS', '2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', '10S', 'JS', 'QS', 'KS'
    ];
  }

  addPlayer(player) {
    if (this.players.length >= _maxPlayers) {
      throw new Error("Game is full");
    }
    this.players.push(player);
  }

  getPlayers() {
    return this.players;
  }

  shuffle(seed) {
    // Shuffle the deck

    let currentIndex = this._deck.length,
      randomIndex;

    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [this._deck[currentIndex], this._deck[randomIndex]] = [
        this._deck[randomIndex],
        this._deck[currentIndex],
      ];
    }
  }

  performAction(player, action) {
    // Perform an action
  }
}
