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

        this.texasHoldemGame.performAction(this.from, this.action, this.index, this.value, this.data);

        const updatedGameState: TexasHoldemStateDTO = this.texasHoldemGame.toJson();
        return updatedGameState;
    }
}
