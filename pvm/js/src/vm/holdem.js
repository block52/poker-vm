const fs = require("filesystem");

class Holdem {
  playerMap = new Map();
  actionMap = new Map();

  players = [];
  _maxPlayers = 0;
  _deck = [];
  _hash = "";
  _nextToAct = 0;

  _actionTypes = ["sb", "bb", "fold", "check", "call", "bet", "raise"];
  _instance = "";
  _nextToAct = 0;

  _actions = [];
  _round = "preflop";

  // index of the dealer button
  _button = 0;
  _sb = 1;
  _bb = 2;

  constructor(config, instance) {
    // maybe we lookup the config for the instance
    if (fs.existsSync(config)) {
      const data = fs.readFileSync(config, "utf8");
      const json = JSON.parse(data);
      this._maxPlayers = json.maxPlayers;
    }

    this._instance = instance;
    this.players = [];

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
      "TC",
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
      "TD",
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
      "TH",
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
      "TS",
      "JS",
      "QS",
      "KS",
    ];
  }

  // this should be from the previous game, roated to the left
  buyIn(player, amount) {
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

  // Replay the actions
  addAction(player, action) {}

  shuffle(seed) {
    if (seed.length < 52) {
      throw new Error("Seed must be at least 64 characters long");
    }

    if (this._round !== "preflop") {
      throw new Error("Game in progress");
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

    for (let i = this._button; i < this.players.length; i++) {
      this.players[i].playerCards[0] = this.getNextDeckCard();
      this.players[i].playerCards[1] = this.getNextDeckCard();
    }

    this._round = "postflop";
    this._nextToAct = this._button + 1;

    this.actionMap.set(this._button + 1, ["sb"]);
    this.actionMap.set(this._button + 2, ["bb"]);

    for (let i = this._button + 1; i < this.players.length; i++) {
      this.actionMap.set(i, ["fold", "bet"]);
    }
  }

  fold(player) {
    // Get player index
    const playerIndex = this.players.findIndex((p) => p.id === player.id);
    if (playerIndex !== this._nextToAct) {
      throw new Error("It is not your turn to act");
    }

    if (!this._actions.includes("fold")) {
      throw new Error("Invalid action");
    }

    this._actions.push({
      player: player.id,
      action: "fold",
      amount: 0,
    });

    this.actionMap.delete(playerIndex);
    this.setNextToAct();
  }

  sb(player) {
    // Get player index
    const playerIndex = this.players.findIndex((p) => p.id === player.id);
    if (playerIndex !== this._nextToAct) {
      throw new Error("It is not your turn to act");
    }

    if (!this._actions.includes("sb")) {
      throw new Error("Invalid action");
    }

    if (!this.playerMap.has(player.id)) {
      throw new Error("Player not at table");
    }

    if (player.stack < this._sb) {
      throw new Error("Not enough chips");
    }

    player.stack -= this._sb;

    this._actions.push({
      player: player.id,
      action: "sb",
      amount: this._sb,
    });

    this.setNextToAct();
  }

  check(player) {
    // Get player index
    const playerIndex = this.players.findIndex((p) => p.id === player.id);
    if (playerIndex !== this._nextToAct) {
      throw new Error("It is not your turn to act");
    }

    if (!this._actions.includes("check")) {
      throw new Error("Invalid action");
    }

    this._actions.push({
      player: player.id,
      action: "check",
      amount: 0,
    });

    this.setNextToAct();
  }

  bet(player, amount) {
    // Get player index
    const playerIndex = this.players.findIndex((p) => p.id === player.id);
    if (playerIndex !== this._nextToAct) {
      throw new Error("It is not your turn to act");
    }

    if (!this._actions.includes("bet")) {
      throw new Error("Invalid action");
    }

    if (!this.playerMap.has(player.id)) {
      throw new Error("Player not at table");
    }

    if (player.stack < amount) {
      throw new Error("Not enough chips");
    }

    player.stack -= amount;

    this._actions.push({
      player: player.id,
      action: "bet",
      amount,
    });

    this.setNextToAct();
  }

  concatenateCards(cards) {
    // Using the join method with an empty string as the separator to concatenate all elements without any space.
    return cards.join("");
  }

  getNextDeckCard() {
    if (_deck.length === 0) {
      throw new Error("Deck is empty");
    }
    return _deck.pop();
  }

  setNextToAct() {
    // Move to the next player, but needs to loop back to the first player
    for (let i = this._nextToAct + 1; i < this.players.length; i++) {
      if (this.actionMap.has(i)) {
        this._nextToAct = i;
        break;
      }
    }
  }
}
