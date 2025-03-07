import { PlayerActionType, TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";
import { getMempoolInstance, Mempool } from "../core/mempool";
import TexasHoldemGame from "../engine/texasHoldem";
import { GameManagement } from "../state/gameManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export class GameStateCommand implements ISignedCommand<TexasHoldemStateDTO> {
    private readonly gameManagement: GameManagement;
    private readonly mempool: Mempool;

    constructor(readonly address: string, private readonly privateKey: string) {
        this.gameManagement = new GameManagement();
        this.mempool = getMempoolInstance();
    }

    public async execute(): Promise<ISignedResponse<TexasHoldemStateDTO>> {
        try {
            console.log("Getting game state for address:", this.address);
            const json = await this.gameManagement.get(this.address);
            console.log("Received game state:", json);

            // These need to be fetched from the contract in the future
            const minBuyIn = 1000000000000000000n;
            const maxBuyIn = 10000000000000000000n;

            const game = TexasHoldemGame.fromJson(json, minBuyIn, maxBuyIn);
            console.log("Created game object");

            const mempoolTransactions = this.mempool.findAll(tx => tx.to === this.address);
            console.log(`Found ${mempoolTransactions.length} mempool transactions`);

            // // Get all transactions from the chain
            // const minedTransactions = await this.transactionManagement.getTransactionsByAddress(this.address);
            // console.log(`Mined transactions: ${minedTransactions.length}`);

            // // Get all transactions from mempool and replay them
            // const allTransactions = [...minedTransactions, ...mempoolTransactions];

            mempoolTransactions.forEach(tx => {
                switch (tx.data) {
                    case "join":
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

            // HACK
            this.mempool.purge();

            // update game state
            const state = game.toJson();
            console.log("Updated game state:", state);

            const _json = {
                address: state.address,
                smallBlind: state.smallBlind.toString(),
                bigBlind: state.bigBlind.toString(),
                smallBlindPosition: state.smallBlindPosition,
                bigBlindPosition: state.bigBlindPosition,
                dealer: state.dealer,
                players: state.players,
                communityCards: state.communityCards,
                pots: state.pots,
                nextToAct: state.nextToAct,
                round: state.round,
                winners: undefined,
                signature: ""
            };

            await this.gameManagement.saveFromJSON(_json);
            // END HACK

            return await signResult(state, this.privateKey);
        } catch (error) {
            console.error("Error in GameStateCommand:", error);
            throw error;
        }
    }
}
