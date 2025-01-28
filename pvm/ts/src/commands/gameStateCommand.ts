import { PlayerActionType } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import TexasHoldemGame from "../engine/texasHoldem";
import { Player, TexasHoldemGameState } from "../models/game";
import { GameManagement } from "../state/gameManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class GameStateCommand implements ISignedCommand<TexasHoldemGameState> {
    private readonly gameManagement: GameManagement;
    private readonly mempool: Mempool;

    constructor(readonly address: string, private readonly privateKey: string) {
        this.gameManagement = new GameManagement();
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<TexasHoldemGameState>> {
        // Get the game state as JSON
        const json = await this.gameManagement.get(this.address);
        const game = TexasHoldemGame.fromJson(json);

        // Get all transactions from mempool and replay them
        const transactions = this.mempool.findAll(tx => tx.to === this.address);

        transactions.forEach(tx => {
            switch (tx.data) {
                case "join":
                    // const player = new Player(tx.from, Number(tx.value));
                    game.join2(tx.from, tx.value);
                    break;
                case "bet":
                    game.performAction(tx.from, PlayerActionType.BET, tx.value);
                    break;
                case "call":
                    game.performAction(tx.from, PlayerActionType.CALL, tx.value);
                    break;
                case "fold":
                    game.performAction(tx.from, PlayerActionType.FOLD, 0n);
                    break;
                case "check":
                    game.performAction(tx.from, PlayerActionType.CHECK, 0n);
                    break;
                case "raise":
                    game.performAction(tx.from, PlayerActionType.RAISE, tx.value);
                    break;
                default:
                    throw new Error("Invalid action");
            };
        });

        const state = game.state;
        return await signResult(state, this.privateKey);
    }
}
