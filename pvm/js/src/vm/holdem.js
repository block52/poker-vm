const crypto = require("crypto");
const { Player } = require("./player");

class Holdem {
  playerMap = new Map();
  _maxPlayers = 9;
  _deck = undefined;
  _hash = "";
  _nextToAct = 0;

  _actions = ["fold", "check", "call", "bet", "raise"];

  constructor(players) {
    for (let i = 0; i < players.length; i++) {
      const player = new Player(players[i].account, players[i].balance);
      this.addPlayer(player);
    }
  }

  addPlayer(player) {
    if (this.players.length >= _maxPlayers) {
      throw new Error("Table is full");
    }

    if (this.playerMap.has(player.id)) {
      throw new Error("Player already at table");
    }

    this.players.push(player);
    this.playerMap.set(player.id, player);
  }

  getPlayers() {
    return this.players;
  }

  shuffle(seed) {
    if (seed.length < 52) {
      throw new Error("Seed must be at least 64 characters long");
    }

    // Shuffle the deck
    let currentIndex = _deck.length,
      temporaryValue,
      randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
      // Pick a remaining element...
      // randomIndex = Math.floor(Math.random() * currentIndex);
      randomIndex = parseInt(seed[currentIndex - 1]); // parseInt(seed[currentIndex - 1], 16) % currentIndex;
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = _deck[currentIndex];
      _deck[currentIndex] = _deck[randomIndex];
      _deck[randomIndex] = temporaryValue;
    }

    const cards = this.concatenateCards(_deck);
    this._hash = crypto.createHash("sha256").update(cards).digest("hex");
    return this._hash;
  }

  deal(player) {
    if (this.players.length < 2) {
      throw new Error("Not enough players");
    }

    if (!this.playerMap.has(player.id)) {
      throw new Error("Player not at table");
    }

    // if (player.hand.length > 0) {
    //   throw new Error("Player already has cards");
    // }

    if (this._hash === "") {
      throw new Error("Deck not shuffled");
    }

    const card1 = _deck.pop();
    const card2 = _deck.pop();

    player.hand = [card1, card2];
  }

  showDown() {
    // Compare hands
  }

  performAction(player, action) {
    // Perform an action
  }

  concatenateCards(cards) {
    // Using the join method with an empty string as the separator to concatenate all elements without any space.
    return cards.join("");
  }
}
