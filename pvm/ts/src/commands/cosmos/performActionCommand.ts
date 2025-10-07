import { GameOptions, KEYS, NonPlayerActionType, PlayerActionType, TexasHoldemStateDTO, TransactionResponse } from "@bitcoinbrisbane/block52";

import { ICommand, ISignedResponse } from "../interfaces";
import TexasHoldemGame from "../../engine/texasHoldem";

export class PerformActionCommand implements ICommand<TexasHoldemStateDTO> {

    private readonly texasHoldemGame: TexasHoldemGame;

    constructor(
        protected readonly from: string,
        protected readonly to: string,
        protected readonly index: number, // Allow array for join actions with seat number
        protected readonly value: bigint,
        protected readonly action: PlayerActionType | NonPlayerActionType,
        gameState: any,
        gameOptions: GameOptions,
        protected readonly data?: string,
    ) {
        this.texasHoldemGame = TexasHoldemGame.fromJson(gameState, gameOptions);
    }

    public async execute(): Promise<TexasHoldemStateDTO> {
        console.log(`Executing ${this.action} command...`);

        const params = new URLSearchParams();
        params.set(KEYS.ACTION_TYPE, this.action.toString());
        params.set(KEYS.INDEX, this.index.toString());
        params.set(KEYS.VALUE, this.value.toString());

        // If data is provided, append it to the params
        if (this.data) {
            const dataParams = new URLSearchParams(this.data);
            for (const [key, value] of dataParams.entries()) {
                params.set(key, value);
            }
        }

        // const encodedData = params.toString();
        // const tx: Transaction = await Transaction.create(
        //     this.to, // game receives funds (to)
        //     this.from, // player sends funds (from)
        //     this.value, // no value for game actions
        //     nonce,
        //     this.privateKey,
        //     encodedData
        // );


        // // Get mempool transactions for the game
        // const mempoolTransactions: Transaction[] = this.mempool.findAll(tx => tx.to === this.to && tx.data !== undefined && tx.data !== null && tx.data !== "");
        // console.log(`Found ${mempoolTransactions.length} mempool transactions`);

        // // Sort transactions by index
        // const orderedTransactions = mempoolTransactions.map(tx => toOrderedTransaction(tx)).sort((a, b) => a.index - b.index);
        // if (!this.addToMempool) {
        //     // If we're not adding to the mempool, we still need to process the transaction
        //     orderedTransactions.push(toOrderedTransaction(tx));
        //     console.log(`Added current transaction to ordered transactions: ${tx.hash}`);
        // }

        // const gameOptions = await this.gameManagement.getGameOptions(gameState.address);
        // const game: TexasHoldemGame = TexasHoldemGame.fromJson(gameState.state, gameOptions);

        // orderedTransactions.forEach(tx => {
        //     try {
        //         console.log(`Processing ${tx.type} action from ${tx.from} with value ${tx.value}, index ${tx.index}, and data ${tx.data}`);
        //         game.performAction(tx.from, tx.type, tx.index, tx.value, tx.data);

        //     } catch (error) {
        //         console.warn(`Error processing transaction ${tx.index} from ${tx.from}: ${(error as Error).message}`);
        //         // Continue with other transactions, don't let this error propagate up
        //     }
        // });


        this.texasHoldemGame.performAction(this.from, this.action, this.index, this.value, this.data);

        // const txResponse: TransactionResponse = {
        //     nonce: tx.nonce.toString(),
        //     to: tx.to,
        //     from: tx.from,
        //     value: this.value.toString(),
        //     hash: tx.hash,
        //     signature: tx.signature,
        //     timestamp: tx.timestamp.toString(),
        //     data: encodedData
        // };

        const updatedGameState: TexasHoldemStateDTO = this.texasHoldemGame.toJson();
        return updatedGameState;
    }
}
