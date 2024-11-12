import { Player } from "../models/game";
import TexasHoldemGame from "../engine/texasHoldem";

export class GameManagement {
  private static _game: Map<string, TexasHoldemGame> = new Map<string, TexasHoldemGame>();

  getGame(address: string): TexasHoldemGame {
    if (!GameManagement._game.has(address)) {
      const players: Player[] = [
        new Player("1", "Joe", 100),
        new Player("2", "John", 200),
        new Player("3", "Jack", 300)
      ];
      GameManagement._game.set(address, new TexasHoldemGame(address, players, 10, 30, 0));

    }
    return GameManagement._game.get(address)!;
  }
}

export default GameManagement;
