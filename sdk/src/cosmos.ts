import { SigningStargateClient, StargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { stringToPath } from "@cosmjs/crypto";

interface GameOptions {
  minBuyIn: string;
  maxBuyIn: string;
  maxPlayers: number;
  minPlayers: number;
  smallBlind: string;
  bigBlind: string;
  timeout: number;
}

interface Game {
  gameId: string;
  creator: string;
  status: string;
  round: string;
  pot: string;
  communityCards: string[];
  dealer: number;
  smallBlindPos: number;
  bigBlindPos: number;
}

interface PlayerState {
  gameId: string;
  playerAddress: string;
  seat: number;
  chips: string;
  holeCards: string[];
  status: string;
  lastAction: string;
  totalBet: string;
}

interface LegalAction {
  action: string;
  minAmount: string;
  maxAmount: string;
}

export class PokerChainClient {
  private client: StargateClient | null = null;
  private signingClient: SigningStargateClient | null = null;
  private wallet: DirectSecp256k1HdWallet | null = null;
  private address: string = "";

  constructor(
    private rpcEndpoint: string = "http://localhost:26657",
    private apiEndpoint: string = "http://localhost:1317"
  ) {}

  /**
   * Connect to the blockchain with a mnemonic
   */
  async connect(mnemonic: string): Promise<string> {
    // Create wallet from mnemonic
    this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: "b52",
    });

    // Get accounts
    const accounts = await this.wallet.getAccounts();
    this.address = accounts[0].address;

    // Create signing client
    this.signingClient = await SigningStargateClient.connectWithSigner(
      this.rpcEndpoint,
      this.wallet
    );

    // Create query client
    this.client = await StargateClient.connect(this.rpcEndpoint);

    return this.address;
  }

  /**
   * Create a new poker game
   */
  async createGame(options: GameOptions): Promise<string> {
    if (!this.signingClient || !this.address) {
      throw new Error("Client not connected");
    }

    const msg = {
      typeUrl: "/pokerchain.poker.MsgCreateGame",
      value: {
        creator: this.address,
        gameOptions: options,
      },
    };

    const fee = {
      amount: [{ denom: "stake", amount: "5000" }],
      gas: "200000",
    };

    const result = await this.signingClient.signAndBroadcast(
      this.address,
      [msg],
      fee,
      "Create poker game"
    );

    if (result.code !== 0) {
      throw new Error(`Transaction failed: ${result.rawLog}`);
    }

    // Extract game ID from events
    const createEvent = result.events.find(
      (e) => e.type === "poker.MsgCreateGame"
    );
    const gameId = createEvent?.attributes.find(
      (a) => a.key === "game_id"
    )?.value;

    return gameId || "";
  }

  /**
   * Join a poker game
   */
  async joinGame(
    gameId: string,
    seat: number,
    buyIn: string
  ): Promise<void> {
    if (!this.signingClient || !this.address) {
      throw new Error("Client not connected");
    }

    const msg = {
      typeUrl: "/pokerchain.poker.MsgJoinGame",
      value: {
        creator: this.address,
        gameId: gameId,
        seat: seat,
        buyIn: buyIn,
      },
    };

    const fee = {
      amount: [{ denom: "stake", amount: "5000" }],
      gas: "200000",
    };

    const result = await this.signingClient.signAndBroadcast(
      this.address,
      [msg],
      fee,
      "Join poker game"
    );

    if (result.code !== 0) {
      throw new Error(`Transaction failed: ${result.rawLog}`);
    }
  }

  /**
   * Leave a poker game
   */
  async leaveGame(gameId: string): Promise<void> {
    if (!this.signingClient || !this.address) {
      throw new Error("Client not connected");
    }

    const msg = {
      typeUrl: "/pokerchain.poker.MsgLeaveGame",
      value: {
        creator: this.address,
        gameId: gameId,
      },
    };

    const fee = {
      amount: [{ denom: "stake", amount: "5000" }],
      gas: "200000",
    };

    await this.signingClient.signAndBroadcast(this.address, [msg], fee);
  }

  /**
   * Deal cards
   */
  async dealCards(gameId: string): Promise<void> {
    await this.sendGameAction("/pokerchain.poker.MsgDealCards", gameId);
  }

  /**
   * Fold
   */
  async fold(gameId: string): Promise<void> {
    await this.sendGameAction("/pokerchain.poker.MsgFold", gameId);
  }

  /**
   * Check
   */
  async check(gameId: string): Promise<void> {
    await this.sendGameAction("/pokerchain.poker.MsgCheck", gameId);
  }

  /**
   * Call
   */
  async call(gameId: string): Promise<void> {
    await this.sendGameAction("/pokerchain.poker.MsgCall", gameId);
  }

  /**
   * Bet
   */
  async bet(gameId: string, amount: string): Promise<void> {
    await this.sendGameAction("/pokerchain.poker.MsgBet", gameId, { amount });
  }

  /**
   * Raise
   */
  async raise(gameId: string, amount: string): Promise<void> {
    await this.sendGameAction("/pokerchain.poker.MsgRaise", gameId, {
      amount,
    });
  }

  /**
   * Show cards
   */
  async showCards(gameId: string): Promise<void> {
    await this.sendGameAction("/pokerchain.poker.MsgShowCards", gameId);
  }

  /**
   * Muck cards
   */
  async muckCards(gameId: string): Promise<void> {
    await this.sendGameAction("/pokerchain.poker.MsgMuckCards", gameId);
  }

  /**
   * Generic action sender
   */
  private async sendGameAction(
    typeUrl: string,
    gameId: string,
    extraParams?: any
  ): Promise<void> {
    if (!this.signingClient || !this.address) {
      throw new Error("Client not connected");
    }

    const msg = {
      typeUrl,
      value: {
        creator: this.address,
        gameId: gameId,
        ...extraParams,
      },
    };

    const fee = {
      amount: [{ denom: "stake", amount: "5000" }],
      gas: "200000",
    };

    const result = await this.signingClient.signAndBroadcast(
      this.address,
      [msg],
      fee
    );

    if (result.code !== 0) {
      throw new Error(`Transaction failed: ${result.rawLog}`);
    }
  }

  /**
   * Query game state
   */
  async getGame(gameId: string): Promise<{
    game: Game;
    players: PlayerState[];
  }> {
    const response = await fetch(
      `${this.apiEndpoint}/pokerchain/poker/game/${gameId}?caller=${this.address}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch game");
    }

    return await response.json();
  }

  /**
   * List all games
   */
  async listGames(status?: string): Promise<Game[]> {
    const url = status
      ? `${this.apiEndpoint}/pokerchain/poker/games?status=${status}`
      : `${this.apiEndpoint}/pokerchain/poker/games`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to list games");
    }

    const data = await response.json();
    return data.games || [];
  }

  /**
   * Get player's games
   */
  async getPlayerGames(playerAddress?: string): Promise<Game[]> {
    const address = playerAddress || this.address;
    const response = await fetch(
      `${this.apiEndpoint}/pokerchain/poker/player-games/${address}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch player games");
    }

    const data = await response.json();
    return data.games || [];
  }

  /**
   * Get legal actions for a player
   */
  async getLegalActions(
    gameId: string,
    playerAddress?: string
  ): Promise<LegalAction[]> {
    const address = playerAddress || this.address;
    const response = await fetch(
      `${this.apiEndpoint}/pokerchain/poker/legal-actions/${gameId}/${address}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch legal actions");
    }

    const data = await response.json();
    return data.actions || [];
  }

  /**
   * Get player state in a game
   */
  async getPlayerState(
    gameId: string,
    playerAddress?: string
  ): Promise<PlayerState> {
    const address = playerAddress || this.address;
    const response = await fetch(
      `${this.apiEndpoint}/pokerchain/poker/player-state/${gameId}/${address}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch player state");
    }

    const data = await response.json();
    return data.playerState;
  }

  /**
   * Get balance
   */
  async getBalance(): Promise<string> {
    if (!this.client || !this.address) {
      throw new Error("Client not connected");
    }

    const balance = await this.client.getBalance(this.address, "stake");
    return balance.amount;
  }

  /**
   * Subscribe to game updates
   */
  subscribeToGame(
    gameId: string,
    callback: (game: Game) => void
  ): () => void {
    const intervalId = setInterval(async () => {
      try {
        const { game } = await this.getGame(gameId);
        callback(game);
      } catch (error) {
        console.error("Failed to fetch game update:", error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(intervalId);
  }
}

// Example usage
async function example() {
  const client = new PokerChainClient();

  // Connect with mnemonic
  const mnemonic = "your mnemonic here...";
  const address = await client.connect(mnemonic);
  console.log("Connected as:", address);

  // Create a game
  const gameId = await client.createGame({
    minBuyIn: "100",
    maxBuyIn: "10000",
    maxPlayers: 6,
    minPlayers: 2,
    smallBlind: "5",
    bigBlind: "10",
    timeout: 60,
  });
  console.log("Game created:", gameId);

  // Join the game
  await client.joinGame(gameId, 1, "1000");
  console.log("Joined game at seat 1");

  // Get game state
  const { game, players } = await client.getGame(gameId);
  console.log("Game state:", game);
  console.log("Players:", players);

  // Get legal actions
  const actions = await client.getLegalActions(gameId);
  console.log("Legal actions:", actions);

  // Subscribe to updates
  const unsubscribe = client.subscribeToGame(gameId, (game) => {
    console.log("Game updated:", game);
  });

  // Later: unsubscribe();
}