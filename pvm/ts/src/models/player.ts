
// export class Player {
//     constructor(
//         private readonly _address: string,
//         public chips: bigint,
//         public holeCards?: [Card, Card]
//     ) { }

//     get id(): string { return this._address; }

//     getPlayerState(game: TexasHoldemGame, position: number): PlayerState {
//         // console.log("getPlayerState", this.id, position);
//         // console.log("getPlayerState bb", game.bigBlindPosition);

//         const isSmallBlind = game.smallBlindPosition === position;
//         const isBigBlind = game.bigBlindPosition === position;
//         const isDealer = game.dealerPosition === position;
        
//         const lastMove = game.getLastAction(this.id);
//         const validMoves = game.getValidActions(this.id);

//         // const actions = validMoves.map(m => ({ action: m.action, min: m.minAmount.toString(), max: m.maxAmount.toString() }));
//         return new PlayerState(this, isSmallBlind, isBigBlind, isDealer, lastMove, position, PlayerStatus.ACTIVE, validMoves);
//     }
// }