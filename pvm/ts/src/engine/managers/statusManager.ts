import { GameOptions, GameStatus } from "@block52/poker-vm-sdk";
import { Player } from "../../models/player";

export class CashGameStateManager {

}

export class SitAndGoStatusManager {

    constructor(private readonly players: Player[], private readonly gameOptions: GameOptions) {
        // Initialize any necessary properties or dependencies
    }

    getState(): GameStatus {
        // Return the current state of the Sit and Go game

        if (this.players.length < this.gameOptions.minPlayers) {
            return GameStatus.WAITING_FOR_PLAYERS;
        } else if (this.players.length >= this.gameOptions.minPlayers && this.players.length <= this.gameOptions.maxPlayers) {
            return GameStatus.IN_PROGRESS;
        } else if (this.players.length > this.gameOptions.maxPlayers) {
            return GameStatus.FINISHED;
        }

        return GameStatus.FINISHED;
    }
}