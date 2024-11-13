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

    const you = state.players.find(p => p.address == state.players[1].address)!;

    return (<div>
        <PlayerList players={state.players} you={you} />
        <CardSet name="community" cards={[...state.flop, state.turn, state.river]} >
            <div className="flex justify-between m-6 mt-0">
                <div className="text-start">
                    <div>Pot: ${state.pot}</div>
                    <div>Current Bet: ${state.currentBet}</div>
                </div>
                <div>{state.round.toUpperCase()}</div>
                <div className="text-end">
                    <div>Big Blind: ${state.bigBlind}</div>
                    <div>Small Blind: ${state.smallBlind}</div>
                </div>
            </div>
        </CardSet>
        <CardSet name="hole" cards={you.holeCards || []} />
        {you.isTurn && <GameActions
            onCall={() => handleCall()}
            onRaise={amount => handleRaise(amount)}
            onCheck={() => handleCheck()}
            onFold={() => handleFold()}
            minRaise={10}
            maxRaise={1000}
        />}
    </div>
    );
}
