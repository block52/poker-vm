const fs = require("filesystem");

class Holdem {
  playerMap = new Map();
  _maxPlayers = 9;
  _deck = [];
  _hash = "";
  _nextToAct = 0;

  _actions = ["fold", "check", "call", "bet", "raise"];

  _instance = "";

  constructor(config, instance) {



    this.players = [];
    this._maxPlayers = maxPlayers;

    // Initialize the deck
    _deck = [
      "AC",
      "2C",
      "3C",
      "4C",
      "5C",
      "6C",
      "7C",
      "8C",
      "9C",
      "10C",
      "JC",
      "QC",
      "KC",
      "AD",
      "2D",
      "3D",
      "4D",
      "5D",
      "6D",
      "7D",
      "8D",
      "9D",
      "10D",
      "JD",
      "QD",
      "KD",
      "AH",
      "2H",
      "3H",
      "4H",
      "5H",
      "6H",
      "7H",
      "8H",
      "9H",
      "10H",
      "JH",
      "QH",
      "KH",
      "AS",
      "2S",
      "3S",
      "4S",
      "5S",
      "6S",
      "7S",
      "8S",
      "9S",
      "10S",
      "JS",
      "QS",
      "KS",
    ];
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

  performAction(player, action) {
    // Perform an action
  }

  concatenateCards(cards) {
    // Using the join method with an empty string as the separator to concatenate all elements without any space.
    return cards.join("");
  }
}
