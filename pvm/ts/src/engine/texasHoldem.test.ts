import { ethers } from "ethers";
import TexasHoldemGame from "./texasHoldem";
import { ActionType, Player } from "./types";

describe("Game", () => {
    it("should process messages", () => {
        const players: Player[] = [{ id: "1", chips: 100, address: ethers.ZeroAddress }, { id: "2", chips: 200, address: ethers.ZeroAddress }, { id: "3", chips: 300, address: ethers.ZeroAddress }];
        const game = new TexasHoldemGame(players, 10, 30, 0);
        // Pre-flop
        game.performAction("3", ActionType.FOLD);
        game.performAction("1", ActionType.CALL);
        game.performAction("2", ActionType.CALL);
        console.log(players);
        // Flop
        game.performAction("2", ActionType.CHECK);
        game.performAction("1", ActionType.BET, 30);
        game.performAction("2", ActionType.CALL);
        // Turn
        game.performAction("2", ActionType.CHECK);
        game.performAction("1", ActionType.CHECK);
        // River
        game.performAction("2", ActionType.CHECK);
        game.performAction("1", ActionType.CHECK);
        console.log(players);
    });
});
