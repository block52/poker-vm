import { TexasHoldemState } from "@/types/game";

import PlayerList from "./PlayerList";
import CardSet from "./CardSet";

export default function Game({ state }: { state: TexasHoldemState }) {
    return (
        <div>
            <PlayerList players={state.players} />
            <CardSet name="community" cards={[...state.flop, state.turn, state.river]} />
            <CardSet name="hole" cards={state.players[0].holeCards || []} />
        </div>
    );
}
