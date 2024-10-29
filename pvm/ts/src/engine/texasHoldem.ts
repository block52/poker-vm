type Player = {
  id: string;
  chips: number;
  cards?: [string, string]; // Each player has 2 cards, represented as strings like 'As' (Ace of spades)
};

type GameState = {
  players: Player[];
  communityCards: string[]; // Cards on the table, max 5
  pot: number;
  currentBet: number;
  dealerIndex: number;
  currentPlayerIndex: number;
};

export class Holdem {
  // private readonly playerMap = new Map();
  // private readonly actionMap = new Map();
  // private readonly playerMap: Player[];

  private readonly players: Player[] = [];
  private _maxPlayers = 0;
  private _deck = [];
  private _hash = "";
  private _nextToAct = 0;

  private _button = 0;
  private _sb = 1;
  private _bb = 2;
  private _round: string = "preflop";

  private _actions = ["fold", "check", "call", "bet", "raise"];

  constructor() {
    this._maxPlayers = 9; // instance.maxPlayers;
    this._deck = []; //instance.deck;
    this.players = [];

    // for (let i = 0; i < instance.players.length; i++) {
    //   // const player = new Player(players[i].account, players[i].balance);
    //   // this.addPlayer(player);
    //   this.players.push(instance.players[i]);
    // }
  }

  // this should be from the previous game, rotated to the left
  buyIn(player: Player, amount: number) {
    if (this.players.length >= this._maxPlayers) {
      throw new Error("Table is full");
    }

    // Check if buy-in amount is valid
    if (amount < 0) {
      throw new Error("Invalid buy-in amount");
    }

    const exists = this.players.find((p) => p.id === player.id);
    if (exists) {
      throw new Error("Player already at table");
    }

    this.players.push(player);
  }

  getPlayers(): Player[] {
    return this.players;
  }

  // Replay the actions
  addAction(id: number, action: string, amount: number): boolean {
    throw new Error("Not implemented");
  }

  deal(id: string): void {
    if (this.players.length < 2) {
      throw new Error("Not enough players");
    }

    const exists = this.players.find((p) => p.id === id);
    if (!exists) {
      throw new Error("Player not at table");
    }

    // if (player.hand.length > 0) {
    //   throw new Error("Player already has cards");
    // }

    if (this._hash === "") {
      throw new Error("Deck not shuffled");
    }

    for (let i = this._button; i < this.players.length; i++) {
      // this.players[i].playerCards[0] = this.getNextDeckCard();
      // this.players[i].playerCards[1] = this.getNextDeckCard();
    }

    this._round = "postflop";
    this._nextToAct = this._button + 1;

    // this.actionMap.set(this._button + 1, ["sb"]);
    // this.actionMap.set(this._button + 2, ["bb"]);

    this._actions[this._button + 1] = "sb";
    this._actions[this._button + 2] = "bb";

    for (let i = this._button + 1; i < this.players.length; i++) {
      // this.actionMap.set(i, ["fold", "bet"]);
    }
  }

  private fold(id: string): void {
    // Get player index
    const playerIndex = this.players.findIndex((p) => p.id === id);
    if (playerIndex !== this._nextToAct) {
      throw new Error("It is not your turn to act");
    }

    if (!this._actions.includes("fold")) {
      throw new Error("Invalid action");
    }

    // this._actions.push({
    //   player: player.id,
    //   action: "fold",
    //   amount: 0,
    // });

    // this.actionMap.delete(playerIndex);
    this.setNextToAct();
  }

  private sb(id: string): void {
    // Get player index
    const playerIndex = this.players.findIndex((p) => p.id === id);
    if (playerIndex !== this._nextToAct) {
      throw new Error("It is not your turn to act");
    }

    if (!this._actions.includes("sb")) {
      throw new Error("Invalid action");
    }

    const player = this.players.find((p) => p.id === id);
    if (!player) {
      throw new Error("Player not at table");
    }

    if (player.chips < this._sb) {
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

  check(id: string): void {
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

  bet(id: string, amount: number): boolean {
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

  getNextDeckCard() {
    if (this._deck.length === 0) {
      throw new Error("Deck is empty");
    }
    return this._deck.pop();
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

// class TexasHoldemGame {
//   private players: Player[];
//   private communityCards: string[];
//   private pot: number;
//   private currentBet: number;
//   private dealerIndex: number;
//   private currentPlayerIndex: number;

//   constructor(initialState: GameState) {
//     this.players = initialState.players;
//     this.communityCards = initialState.communityCards;
//     this.pot = initialState.pot;
//     this.currentBet = initialState.currentBet;
//     this.dealerIndex = initialState.dealerIndex;
//     this.currentPlayerIndex = initialState.currentPlayerIndex;
//   }

//   // Example method to proceed to the next player's turn
//   nextTurn() {
//     this.currentPlayerIndex =
//       (this.currentPlayerIndex + 1) % this.players.length;
//   }

//   // Example method to add a card to the community cards
//   addCommunityCard(card: string) {
//     if (this.communityCards.length < 5) {
//       this.communityCards.push(card);
//     } else {
//       throw new Error("Community cards limit reached.");
//     }
//   }

//   // Example method to place a bet
//   placeBet(playerId: string, amount: number) {
//     const player = this.players.find((p) => p.id === playerId);
//     if (!player) {
//       throw new Error("Player not found.");
//     }

//     if (player.chips < amount) {
//       throw new Error("Insufficient chips.");
//     }

//     player.chips -= amount;
//     this.pot += amount;
//     this.currentBet = Math.max(this.currentBet, amount);
//   }

//   // Example method to get the current game state
//   getGameState(): GameState {
//     return {
//       players: this.players,
//       communityCards: this.communityCards,
//       pot: this.pot,
//       currentBet: this.currentBet,
//       dealerIndex: this.dealerIndex,
//       currentPlayerIndex: this.currentPlayerIndex,
//     };
//   }

//   // Method to perform an action
//   action(
//     playerId: string,
//     actionType: "fold" | "call" | "raise",
//     amount?: number
//   ) {
//     const player = this.players.find((p) => p.id === playerId);
//     if (!player) {
//       throw new Error("Player not found.");
//     }

//     switch (actionType) {
//       case "fold":
//         console.log(`${player.name} has folded.`);
//         break;
//       case "call":
//         if (player.chips < this.currentBet) {
//           throw new Error("Insufficient chips to call.");
//         }
//         player.chips -= this.currentBet;
//         this.pot += this.currentBet;
//         console.log(`${player.name} has called with ${this.currentBet} chips.`);
//         break;
//       case "raise":
//         if (amount === undefined || amount <= this.currentBet) {
//           throw new Error("Invalid raise amount.");
//         }
//         if (player.chips < amount) {
//           throw new Error("Insufficient chips to raise.");
//         }
//         player.chips -= amount;
//         this.pot += amount;
//         this.currentBet = amount;
//         console.log(`${player.name} has raised to ${amount} chips.`);
//         break;
//       default:
//         throw new Error("Invalid action type.");
//     }
//   }
// }

//   // Example usage
//   const initialState: GameState = {
//     players: [
//       { id: '1', name: 'Alice', chips: 1000 },
//       { id: '2', name: 'Bob', chips: 1000 },
//       { id: '3', name: 'Charlie', chips: 1000 },
//     ],
//     communityCards: [],
//     pot: 0,
//     currentBet: 0,
//     dealerIndex: 0,
//     currentPlayerIndex: 1,
//   };

//   const game = new TexasHoldemGame(initialState);
//   game.placeBet('1', 100);
//   game.addCommunityCard('As'); // Ace of Spades
//   game.action('2', 'call');
//   console.log(game.getGameState());
