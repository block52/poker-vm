import TexasHoldemGame from "./texasHoldem";
import { ActionType, Player } from "./types";

describe("Game", function () {
    it("should process messages", function () {
        const players: Player[] = [{ id: "1", name: "Joe", chips: 100 }, { id: "2", name: "John", chips: 200 }, { id: "3", name: "Jack", chips: 300 }];
        const game = new TexasHoldemGame(players, 10, 30, 0);
        game.performAction("3", ActionType.FOLD);
        game.performAction("1", ActionType.CALL);
        game.performAction("2", ActionType.FOLD);
        console.log(players);
    });
});
