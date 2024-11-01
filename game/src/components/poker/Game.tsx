import PlayerList from "./PlayerList";
import CardSet from "./CardSet";
import { GameActions } from "./GameActions";
import { useGame } from "@/hooks/useGame";
import { useWallet } from "@/hooks/useWallet";

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
    const { b52 } = useWallet();
    b52.fold();
}

export default function Game() {
    const [state] = useGame();

    return (
        <div>
            <PlayerList players={state.players} />
            <CardSet
                name="community"
                cards={[...state.flop, state.turn, state.river]}
            />
            <CardSet name="hole" cards={state.players[0].holeCards || []} />
            <GameActions
                onCall={() => handleCall()}
                onRaise={amount => handleRaise(amount)}
                onCheck={() => handleCheck()}
                onFold={() => handleFold()}
                minRaise={10}
                maxRaise={1000}
            />
        </div>
    );
}
