import { TexasHoldemState } from "@/types/game";

import PlayerList from "./PlayerList";
import CardSet from "./CardSet";
import { GameActions } from "./GameActions";

function handleCall() {
    console.log("Call");
}

function handleRaise(amount: number) {
    console.log(`Raise ${amount}`);
}

function handleCheck() {
    console.log("Check");
}

function handleFold() {
    console.log("Fold");
}

export default function Game({ state }: { state: TexasHoldemState }) {
    return (
        <div>
            <PlayerList players={state.players} />
            <CardSet name="community" cards={[...state.flop, state.turn, state.river]} />  
            <CardSet name="hole" cards={state.players[0].holeCards || []} />
            <GameActions
                onCall={() => handleCall()}
                onRaise={(amount) => handleRaise(amount)}
                onCheck={() => handleCheck()}
                onFold={() => handleFold()}
                minRaise={10}
                maxRaise={1000}
            />
        </div>
    );
}
