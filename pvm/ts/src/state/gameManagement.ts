import { Player } from "../models/game";
import TexasHoldemGame from "../engine/texasHoldem";

export class GameManagement {
    private static _game: Map<string, TexasHoldemGame> = new Map<string, TexasHoldemGame>();

    join(gameAddress: string, playerAddress: string) {
        let game = GameManagement._game.get(gameAddress);
        if (!game) {
            game = new TexasHoldemGame(gameAddress, 10, 30);
            GameManagement._game.set(gameAddress, game);
        }
        game.join(new Player(playerAddress, 100));
        console.log(`Player ${playerAddress} joining ${gameAddress}`);
        if (game.players.length == 3)
            game.nextGame();
    }

    get(address: string): TexasHoldemGame | undefined {
        return GameManagement._game.get(address);
    }
}

export default GameManagement;
