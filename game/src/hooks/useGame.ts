// TODO: Implement useGame hook
// For now just return the static game state

import { Round, Seat, TexasHoldemState } from "@/types/game";
import { useState, useEffect } from "react";
import { useWallet } from "./useWallet";

export function useGame() {
    const [state, setState] = useState<TexasHoldemState>();
    const { b52 } = useWallet();

    useEffect(() => {
        const id = setInterval(async () => {
            const dto = await b52?.getGameState("0x1234");
            console.log(dto);
            if (dto) {
                const flop = dto.communityCards.length ? dto.communityCards.slice(3) : [0, 0, 0];
                const turn = dto.communityCards.at(4) ?? 0;
                const river = dto.communityCards.at(5) ?? 0;
                const nextPlayer = dto.players.findIndex(p => p.address == dto.currentPlayerAddress);
                const players = dto.players.map(p => { return { ...p, seat: Seat.NORMAL, isActive: true, isTurn: true, lastAction: undefined } });
                setState({ ...dto, flop, turn, river, nextPlayer, players, round: Round.FLOP });
            }
        }, 3000);
        return () => { clearInterval(id); };
    }, []);

    return { state };
}