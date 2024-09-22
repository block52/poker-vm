const { v4: uuidv4 } = require("uuid");

class Hand {
  constructor(players, buttonPosition, smallBlind = 1) {
    this.id = uuidv4();
    this.players = this.assignSeats(players);
    this.buttonPosition = buttonPosition;
    this.smallBlind = smallBlind;
    this.bigBlind = 2 * smallBlind;
    this.pot = 0;
    this.communityCards = [];
    this.currentBet = 0;
    this.currentPlayer = null;
    this.status = "preflop";
    this.lastRaiseIndex = null;
  }

  assignSeats(players) {
    return players.map((player, index) => ({
      player: player,
      seatNumber: index,
      chipStack: player.chipBalance,
      holeCards: [],
      currentBet: 0,
      totalBet: 0,
      status: "active",
    }));
  }

  initializeHand() {
    this.setPositions();
    this.collectBlinds();
    // Deal hole cards (this would typically be done by a separate Deck class)
  }

  setPositions() {
    const numPlayers = this.players.length;
    this.smallBlindPosition = (this.buttonPosition + 1) % numPlayers;
    this.bigBlindPosition = (this.buttonPosition + 2) % numPlayers;
    this.currentPlayer = (this.bigBlindPosition + 1) % numPlayers;
  }

  collectBlinds() {
    this.placeBet(this.smallBlindPosition, this.smallBlind);
    this.placeBet(this.bigBlindPosition, this.bigBlind);
    this.lastRaiseIndex = this.bigBlindPosition;
  }

  placeBet(playerIndex, amount) {
    const player = this.players[playerIndex];
    const actualBet = Math.min(amount, player.chipStack);
    player.chipStack -= actualBet;
    player.currentBet += actualBet;
    player.totalBet += actualBet;
    this.pot += actualBet;
    this.currentBet = Math.max(this.currentBet, player.currentBet);
  }

  nextPlayer() {
    do {
      this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
    } while (this.players[this.currentPlayer].status !== "active");
  }

  getAllowedActions(playerIndex) {
    const player = this.players[playerIndex];
    const actions = ["fold"];

    if (player.currentBet < this.currentBet) {
      actions.push("call");
      if (player.chipStack > this.currentBet - player.currentBet) {
        actions.push("raise");
      }
    } else {
      actions.push("check");
      if (player.chipStack > 0) {
        actions.push("raise");
      }
    }

    if (player.chipStack === 0) {
      actions.push("all-in");
    }

    return actions;
  }

  performAction(playerIndex, action, amount = 0) {
    const player = this.players[playerIndex];
    switch (action) {
      case "fold":
        player.status = "folded";
        break;
      case "check":
        // No action needed
        break;
      case "call":
        this.placeBet(playerIndex, this.currentBet - player.currentBet);
        break;
      case "raise":
        this.placeBet(
          playerIndex,
          this.currentBet - player.currentBet + amount
        );
        this.currentBet = player.currentBet;
        this.lastRaiseIndex = playerIndex;
        break;
      case "all-in":
        this.placeBet(playerIndex, player.chipStack);
        if (player.currentBet > this.currentBet) {
          this.currentBet = player.currentBet;
          this.lastRaiseIndex = playerIndex;
        }
        break;
    }
    this.nextPlayer();
  }

  isRoundComplete() {
    const activePlayers = this.players.filter((p) => p.status === "active");
    return (
      activePlayers.every(
        (p) => p.currentBet === this.currentBet || p.chipStack === 0
      ) && this.currentPlayer === this.lastRaiseIndex
    );
  }

  nextStreet() {
    if (this.status === "preflop") {
      this.status = "flop";
      // Deal flop
    } else if (this.status === "flop") {
      this.status = "turn";
      // Deal turn
    } else if (this.status === "turn") {
      this.status = "river";
      // Deal river
    } else {
      this.status = "showdown";
      // Perform showdown
    }

    this.players.forEach((p) => {
      p.currentBet = 0;
    });
    this.currentBet = 0;
    this.currentPlayer = this.smallBlindPosition;
    this.lastRaiseIndex = null;
  }

  // Additional methods for dealing community cards, determining winners, etc. would go here
}

module.exports = Hand;
