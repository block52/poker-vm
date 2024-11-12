import { PlayerAction } from "@bitcoinbrisbane/block52";
import { Player } from "../models/game";
import TexasHoldemGame from "./texasHoldem";

describe("Game", function () {
    it("should process messages", function () {
        const players: Player[] = [
            new Player("1", "Joe", 100),
            new Player("2", "John", 200),
            new Player("3", "Jack", 300)
        ];
        const game = new TexasHoldemGame("0x1234", players, 10, 30, 0);
        // Pre-flop
        game.performAction("3", PlayerAction.FOLD);
        game.performAction("1", PlayerAction.CALL);
        game.performAction("2", PlayerAction.CALL);
        console.log(players);
        // Flop
        game.performAction("2", PlayerAction.CHECK);
        game.performAction("1", PlayerAction.BET, 30);
        game.performAction("2", PlayerAction.CALL);
        // Turn
        game.performAction("2", PlayerAction.CHECK);
        game.performAction("1", PlayerAction.CHECK);
        // River
        game.performAction("2", PlayerAction.CHECK);
        game.performAction("1", PlayerAction.CHECK);
        console.log(players);
    });
});
