import PlayerList from "./PlayerList";
import CardSet from "./CardSet";
import { GameActions } from "./GameActions";
import { useGame } from "@/hooks/useGame";
import { useWallet } from "@/hooks/useWallet";


export default function Game() {
    const { state } = useGame();
    const { b52 } = useWallet();

    if (!state)
        return (<></>);

    const handleFold = () => {
        b52?.fold(state.address);
    };

    const handleRaise = (amount: number) => {
        b52?.raise(state.address, amount.toString());
    };

    const handleCall = () => {
        b52?.call(state.address);
    };

    const handleCheck = () => {
        b52?.check(state.address);
    };

    return (<div>
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
