class Deck2 {
  _deck = [];
  _salt = "";

  constructor(salt) {
    this._salt = salt;
    this._deck = [
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

  // Seed as array of bytes
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

    return _deck;
  }

  concatenateCards() {
    // Using the join method with an empty string as the separator to concatenate all elements without any space.
    return this._deck.join("");
  }

  getDeck() {
    return this._deck;
  }

  getHash() {
    const cards = this.concatenateCards();
    const hash = crypto.createHash("sha256");
    hash.update(cards);
    return hash.digest("hex");
  }
}

module.exports = Deck;
