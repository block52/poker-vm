type Player = {
  id: string;
  name: string;
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

class TexasHoldemGame {
  private players: Player[];
  private communityCards: string[];
  private pot: number;
  private currentBet: number;
  private dealerIndex: number;
  private currentPlayerIndex: number;

  constructor(initialState: GameState) {
    this.players = initialState.players;
    this.communityCards = initialState.communityCards;
    this.pot = initialState.pot;
    this.currentBet = initialState.currentBet;
    this.dealerIndex = initialState.dealerIndex;
    this.currentPlayerIndex = initialState.currentPlayerIndex;
  }

  // Example method to proceed to the next player's turn
  nextTurn() {
    this.currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.players.length;
  }

  // Example method to add a card to the community cards
  addCommunityCard(card: string) {
    if (this.communityCards.length < 5) {
      this.communityCards.push(card);
    } else {
      throw new Error("Community cards limit reached.");
    }
  }

  // Example method to place a bet
  placeBet(playerId: string, amount: number) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error("Player not found.");
    }

    if (player.chips < amount) {
      throw new Error("Insufficient chips.");
    }

    player.chips -= amount;
    this.pot += amount;
    this.currentBet = Math.max(this.currentBet, amount);
  }

  // Example method to get the current game state
  getGameState(): GameState {
    return {
      players: this.players,
      communityCards: this.communityCards,
      pot: this.pot,
      currentBet: this.currentBet,
      dealerIndex: this.dealerIndex,
      currentPlayerIndex: this.currentPlayerIndex,
    };
  }

  // Method to perform an action
  action(
    playerId: string,
    actionType: "fold" | "call" | "raise",
    amount?: number
  ) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error("Player not found.");
    }

    switch (actionType) {
      case "fold":
        console.log(`${player.name} has folded.`);
        break;
      case "call":
        if (player.chips < this.currentBet) {
          throw new Error("Insufficient chips to call.");
        }
        player.chips -= this.currentBet;
        this.pot += this.currentBet;
        console.log(`${player.name} has called with ${this.currentBet} chips.`);
        break;
      case "raise":
        if (amount === undefined || amount <= this.currentBet) {
          throw new Error("Invalid raise amount.");
        }
        if (player.chips < amount) {
          throw new Error("Insufficient chips to raise.");
        }
        player.chips -= amount;
        this.pot += amount;
        this.currentBet = amount;
        console.log(`${player.name} has raised to ${amount} chips.`);
        break;
      default:
        throw new Error("Invalid action type.");
    }
  }
}

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
