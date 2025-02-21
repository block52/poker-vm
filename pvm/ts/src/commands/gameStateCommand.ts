import { PlayerActionType, TexasHoldemGameStateDTO } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import TexasHoldemGame from "../engine/texasHoldem";
import { GameManagement } from "../state/gameManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class GameStateCommand implements ISignedCommand<TexasHoldemGameStateDTO> {
    private readonly gameManagement: GameManagement;
    private readonly mempool: Mempool;

    constructor(readonly address: string, private readonly privateKey: string) {
        this.gameManagement = new GameManagement();
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<TexasHoldemGameStateDTO>> {
        // Get the game state as JSON from the chain
        const json = await this.gameManagement.get(this.address);
        const game = TexasHoldemGame.fromJson(json);

        // // Get all transactions from the chain
        // const minedTransactions = await this.transactionManagement.getTransactionsByAddress(this.address);
        // console.log(`Mined transactions: ${minedTransactions.length}`);

        // // Get all transactions from mempool and replay them
        const mempoolTransactions = this.mempool.findAll(tx => tx.to === this.address);
        console.log(`Mempool transactions: ${mempoolTransactions.length}`);
        // // Merge transactions
        // const allTransactions = [...minedTransactions, ...mempoolTransactions];

        mempoolTransactions.forEach(tx => {
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

        const state = game.toJson();
        return await signResult(state, this.privateKey);
    }
}
